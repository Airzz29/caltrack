import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { callAI } from '@/lib/ai';
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitResponse,
} from '@/lib/rateLimiter';

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = checkRateLimit(
      user.id,
      'ai_coach',
      RATE_LIMITS.ai_coach.max,
      RATE_LIMITS.ai_coach.windowMs
    );
    if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    if (message.length < 1 || message.length > 1000) {
      return NextResponse.json({ error: 'Invalid message length' }, { status: 400 });
    }

    const { id: chatId } = params;

    const chatRows = await db`
      SELECT id FROM coach_chats
      WHERE id = ${chatId} AND user_id = ${user.id}
    `;

    if (chatRows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const profileRows = await db`
      SELECT display_name, goal_type, activity_level,
        current_weight_kg, goal_weight_kg,
        daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g
      FROM user_profiles WHERE user_id = ${user.id}
    `;

    const profile = profileRows[0] as
      | {
          display_name: string;
          goal_type: string | null;
          activity_level: string | null;
          current_weight_kg: number | null;
          goal_weight_kg: number | null;
          daily_calories: number;
          daily_protein_g: number;
          daily_carbs_g: number | null;
          daily_fat_g: number | null;
        }
      | undefined;

    const totalsRows = await db`
      SELECT
        COALESCE(SUM(calories), 0) as total_cal,
        COALESCE(SUM(protein_g), 0) as total_pro
      FROM food_log
      WHERE user_id = ${user.id} AND log_date = CURRENT_DATE
    `;

    const totals = totalsRows[0] as {
      total_cal: number;
      total_pro: number;
    };

    const todayKcal = Number(totals.total_cal);
    const todayPro = Number(totals.total_pro);

    const memoryRows = await db`
      SELECT memory_json FROM user_memory
      WHERE user_id = ${user.id}
    `;

    const memoryRow = memoryRows[0] as { memory_json: string } | undefined;
    const memory: string[] = memoryRow
      ? typeof memoryRow.memory_json === 'string'
        ? JSON.parse(memoryRow.memory_json)
        : (memoryRow.memory_json as string[])
      : [];

    const countRows = await db`
      SELECT COUNT(*)::int as count FROM coach_messages
      WHERE chat_id = ${chatId}
    `;
    const messageCountBefore = (countRows[0] as { count: number }).count;

    const historyRows = await db`
      SELECT role, content FROM coach_messages
      WHERE chat_id = ${chatId}
      ORDER BY created_at DESC LIMIT 20
    `;

    const historyMessages: Anthropic.MessageParam[] = [...historyRows]
      .reverse()
      .map((h) => ({
        role: (h.role === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: h.content as string,
      }));

    await db`
      INSERT INTO coach_messages (chat_id, role, content)
      VALUES (${chatId}, 'user', ${message})
    `;

    const displayName = profile?.display_name ?? user.username;
    const dailyCalories = profile?.daily_calories ?? 2000;
    const dailyProtein = profile?.daily_protein_g ?? 150;

    const response = await callAI({
      userId: user.id,
      feature: 'ai_coach',
      maxTokens: 600,
      system: `You are a personal nutrition and fitness coach for ${displayName}.

PROFILE:
Goal: ${profile?.goal_type?.replace(/_/g, ' ') ?? 'not set'}
Activity: ${profile?.activity_level ?? 'not set'}
Weight: ${profile?.current_weight_kg ?? '?'}kg → Goal: ${profile?.goal_weight_kg ?? '?'}kg

DAILY TARGETS:
${dailyCalories} kcal · ${dailyProtein}g protein
${profile?.daily_carbs_g ? `${profile.daily_carbs_g}g carbs · ` : ''}${profile?.daily_fat_g ? `${profile.daily_fat_g}g fat` : ''}

TODAY:
Eaten: ${todayKcal} kcal · ${todayPro}g protein
Remaining: ${dailyCalories - todayKcal} kcal

MEMORY (things you know about this user):
${memory.length > 0 ? memory.map((m, i) => `${i + 1}. ${m}`).join('\n') : 'No memory yet — this is an early conversation.'}

Be direct, warm, specific. 2-3 sentences unless detail is asked for. No markdown bullets — natural prose only.`,
      messages: [...historyMessages, { role: 'user', content: message }],
    });

    const replyText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    await db`
      INSERT INTO coach_messages (chat_id, role, content)
      VALUES (${chatId}, 'ai', ${replyText})
    `;

    await db`
      UPDATE coach_chats SET updated_at = NOW()
      WHERE id = ${chatId}
    `;

    if (messageCountBefore === 0) {
      const title = message.slice(0, 40);
      await db`
        UPDATE coach_chats SET title = ${title}
        WHERE id = ${chatId}
      `;
    }

    try {
      const memoryResponse = await callAI({
        userId: user.id,
        feature: 'ai_coach',
        maxTokens: 200,
        system:
          'Extract 0-2 key facts about the user from this message that would be useful to remember long-term. Facts about preferences, lifestyle, goals, or restrictions. Return ONLY a JSON array of short strings, max 8 words each. Example: ["prefers chicken over red meat", "trains 5 days a week"] Return [] if nothing worth remembering.',
        messages: [{ role: 'user', content: message }],
      });

      const memoryText =
        memoryResponse.content[0].type === 'text'
          ? memoryResponse.content[0].text
          : '[]';

      const newFacts = JSON.parse(stripMarkdownFences(memoryText)) as string[];

      if (Array.isArray(newFacts) && newFacts.length > 0) {
        const merged = [...memory, ...newFacts]
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(-15);

        await db`
          INSERT INTO user_memory (user_id, memory_json)
          VALUES (${user.id}, ${JSON.stringify(merged)})
          ON CONFLICT (user_id) DO UPDATE SET
            memory_json = EXCLUDED.memory_json,
            updated_at = NOW()
        `;
      }
    } catch {
      // memory extraction is best-effort
    }

    return NextResponse.json({ reply: replyText });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
