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
      'onboarding_plan',
      RATE_LIMITS.onboarding_plan.max,
      RATE_LIMITS.onboarding_plan.windowMs
    );
    if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

    const rows = await db`
      SELECT display_name, age, gender, height_cm,
        current_weight_kg, goal_weight_kg,
        activity_level, goal_type
      FROM user_profiles WHERE user_id = ${user.id}
    `;

    const profile = rows[0] as
      | {
          display_name: string;
          age: number;
          gender: string;
          height_cm: number;
          current_weight_kg: number;
          goal_weight_kg: number;
          activity_level: string;
          goal_type: string;
        }
      | undefined;

    if (!profile) {
      return NextResponse.json(
        { error: 'Complete your profile first' },
        { status: 400 }
      );
    }

    const response = await callAI({
      userId: user.id,
      feature: 'onboarding_plan',
      maxTokens: 512,
      system:
        'You are a precise nutrition calculator. Calculate using Harris-Benedict BMR × activity multiplier, then adjust for goal. Return ONLY valid JSON — no markdown, no explanation outside the JSON.',
      messages: [
        {
          role: 'user',
          content: `Calculate a nutrition plan for:
Name: ${profile.display_name}
Age: ${profile.age}
Gender: ${profile.gender}
Height: ${profile.height_cm}cm
Current weight: ${profile.current_weight_kg}kg
Goal weight: ${profile.goal_weight_kg}kg
Activity level: ${profile.activity_level}
Goal: ${profile.goal_type}

Return this exact JSON structure:
{
  "daily_calories": <integer>,
  "daily_protein_g": <integer>,
  "daily_carbs_g": <integer>,
  "daily_fat_g": <integer>,
  "rationale": "<2-3 sentence explanation>",
  "weekly_plan_summary": "<one sentence overview>"
}`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const plan = JSON.parse(cleaned);

    await db`
      UPDATE user_profiles SET
        ai_plan_json = ${JSON.stringify(plan)},
        updated_at = NOW()
      WHERE user_id = ${user.id}
    `;

    return NextResponse.json({ plan });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
