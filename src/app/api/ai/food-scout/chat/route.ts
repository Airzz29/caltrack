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
      'food_scout_chat',
      RATE_LIMITS.food_scout_chat.max,
      RATE_LIMITS.food_scout_chat.windowMs
    );
    if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

    const body = await req.json();
    const { message, history, foodContext } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
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
    const todayKcal = Number(totals.total_cal);
    const todayPro = Number(totals.total_pro);

    const f = foodContext.chosenGrams / 100;
    const portionKcal = Math.round(foodContext.per_100g.calories * f);
    const portionPro =
      Math.round(foodContext.per_100g.protein_g * f * 10) / 10;

    const historyMessages: Anthropic.MessageParam[] = (
      history ?? []
    ).map((h: { role: 'user' | 'ai'; text: string }) => ({
      role: h.role === 'ai' ? 'assistant' : 'user',
      content: h.text,
    }));

    const response = await callAI({
      userId: user.id,
      feature: 'food_scout',
      maxTokens: 400,
      system: `You are a knowledgeable nutrition coach helping ${displayName} make smart food choices.

FOOD BEING DISCUSSED:
Name: ${foodContext.food_name}${foodContext.brand ? ` by ${foodContext.brand}` : ''}
Per 100g: ${foodContext.per_100g.calories} kcal, ${foodContext.per_100g.protein_g}g protein, ${foodContext.per_100g.carbs_g}g carbs, ${foodContext.per_100g.fat_g}g fat
Chosen portion: ${foodContext.chosenGrams}g = ${portionKcal} kcal, ${portionPro}g protein

USER CONTEXT:
Daily targets: ${dailyCalories} kcal, ${dailyProtein}g protein
Eaten today: ${todayKcal} kcal, ${todayPro}g protein
Remaining: ${dailyCalories - todayKcal} kcal, ${dailyProtein - todayPro}g protein

Be direct and concise. Answer in 2-3 sentences max.
Use numbers when helpful. No markdown formatting.

If the user says they want to log/track/add this food (e.g. 'track that', 'add to my log', 'log it', 'add 1 tbsp to my calories', 'yeah log it'), respond conversationally confirming you're logging it, then add this exact tag at the very end of your response:
<LOG_CONFIRMED portion_grams='${foodContext.chosenGrams}'>

Only add this tag if the user explicitly asks to log/track/add.
Do not add it for general questions.`,
      messages: [...historyMessages, { role: 'user', content: message }],
    });

    const replyText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const logMatch = replyText.match(
      /<LOG_CONFIRMED portion_grams='(\d+)'>/
    );
    const shouldLog = !!logMatch;
    const logGrams = logMatch ? parseInt(logMatch[1], 10) : null;

    const cleanReply = replyText
      .replace(/<LOG_CONFIRMED[^>]*>/g, '')
      .trim();

    let logData: {
      food_name: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      source: string;
      meal_type: string;
    } | null = null;

    if (shouldLog) {
      const f =
        (logGrams ?? foodContext.chosenGrams) / 100;
      logData = {
        food_name: `${foodContext.food_name} (${logGrams ?? foodContext.chosenGrams}g)`,
        calories: Math.round(foodContext.per_100g.calories * f),
        protein_g:
          Math.round(foodContext.per_100g.protein_g * f * 10) / 10,
        carbs_g:
          Math.round(foodContext.per_100g.carbs_g * f * 10) / 10,
        fat_g: Math.round(foodContext.per_100g.fat_g * f * 10) / 10,
        source: 'photo',
        meal_type: 'snack',
      };

      await db`
        INSERT INTO food_log 
          (user_id, food_name, calories, protein_g, carbs_g, fat_g, source, meal_type)
        VALUES (
          ${user.id},
          ${logData.food_name},
          ${logData.calories},
          ${logData.protein_g},
          ${logData.carbs_g},
          ${logData.fat_g},
          ${logData.source},
          ${logData.meal_type}
        )
      `;
    }

    return NextResponse.json({
      reply: cleanReply,
      logged: shouldLog,
      logData: shouldLog ? logData : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
