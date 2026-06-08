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

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = checkRateLimit(
      user.id,
      'chat_log',
      RATE_LIMITS.chat_log.max,
      RATE_LIMITS.chat_log.windowMs
    );
    if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    const profileRows = await db`
      SELECT daily_calories, daily_protein_g,
        daily_carbs_g, daily_fat_g, display_name
      FROM user_profiles WHERE user_id = ${user.id}
    `;

    const profile = profileRows[0] as
      | {
          daily_calories: number;
          daily_protein_g: number;
          daily_carbs_g: number | null;
          daily_fat_g: number | null;
          display_name: string;
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

    const displayName = profile?.display_name ?? user.username;
    const dailyCalories = profile?.daily_calories ?? 2000;
    const dailyProtein = profile?.daily_protein_g ?? 150;

    const historyMessages: Anthropic.MessageParam[] = (
      history ?? []
    ).map((h: { role: 'user' | 'ai'; text: string }) => ({
      role: h.role === 'ai' ? 'assistant' : 'user',
      content: h.text,
    }));

    const response = await callAI({
      userId: user.id,
      feature: 'chat_log',
      maxTokens: 600,
      system: `You are a helpful nutrition assistant for ${displayName}.
Their daily targets: ${dailyCalories} kcal, ${dailyProtein}g protein.
Today so far: ${totals.total_cal} kcal, ${totals.total_pro}g protein.
Remaining: ${dailyCalories - Number(totals.total_cal)} kcal.

Your job: help them log food by asking clarifying questions to identify exactly what they ate and the quantity.

Once you have enough info, extract the nutrition and respond with a JSON block at the END of your message in this format:
<nutrition>
{"food_name":"...","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0}
</nutrition>

If you don't have enough info yet, ask ONE short clarifying question.
Keep responses brief and friendly.`,
      messages: [
        ...historyMessages,
        { role: 'user', content: message },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const nutritionMatch = text.match(
      /<nutrition>\s*([\s\S]*?)\s*<\/nutrition>/i
    );

    if (nutritionMatch) {
      const cleanText = text
        .replace(/<nutrition>[\s\S]*?<\/nutrition>/i, '')
        .trim();

      try {
        const nutritionData = JSON.parse(nutritionMatch[1]);
        return NextResponse.json({ reply: cleanText, result: nutritionData });
      } catch {
        return NextResponse.json({ reply: text, result: null });
      }
    }

    return NextResponse.json({ reply: text, result: null });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
