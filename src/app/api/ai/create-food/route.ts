import { NextRequest, NextResponse } from 'next/server';
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

    const profileRows = await db`
      SELECT daily_calories, daily_protein_g, display_name
      FROM user_profiles WHERE user_id = ${user.id}
    `;

    const profile = profileRows[0] as
      | {
          daily_calories: number;
          daily_protein_g: number;
          display_name: string;
        }
      | undefined;

    const displayName = profile?.display_name ?? user.username;

    const historyMessages = (history ?? []).map(
      (m: { role: 'user' | 'ai'; text: string }) => ({
        role: m.role === 'ai' ? ('assistant' as const) : ('user' as const),
        content: m.text,
      })
    );

    const response = await callAI({
      userId: user.id,
      feature: 'chat_log',
      maxTokens: 400,
      system: `You are a nutrition assistant helping ${displayName} create and save custom meal entries for their calorie tracker.

Your job: chat with them to understand what food or meal they want to save, then calculate the nutrition.

Once you have enough info, respond with the nutrition in a JSON block at the END of your message:
<food_result>
{"food_name":"...","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"serving_size":"..."}
</food_result>

Rules:
- Ask clarifying questions if portions are unclear
- Use real nutrition data for common ingredients
- For combos (like wraps) add up each ingredient
- Keep chat responses SHORT — 1-2 sentences max
- Don't add the food_result tag until you have enough info to calculate accurately`,
      messages: [
        ...historyMessages,
        { role: 'user', content: message },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const foodMatch = text.match(/<food_result>([\s\S]*?)<\/food_result>/);
    let parsedFood: {
      food_name: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      serving_size: string;
    } | null = null;

    if (foodMatch) {
      try {
        parsedFood = JSON.parse(foodMatch[1].trim());
      } catch {
        parsedFood = null;
      }
    }

    const cleanText = text.replace(/<food_result>[\s\S]*?<\/food_result>/g, '').trim();

    return NextResponse.json({
      reply: cleanText,
      result: parsedFood,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
