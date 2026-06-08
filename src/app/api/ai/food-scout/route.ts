import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = checkRateLimit(
      user.id,
      'food_scout',
      RATE_LIMITS.food_scout.max,
      RATE_LIMITS.food_scout.windowMs
    );
    if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

    const body = await req.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }

    if (image.length * 0.75 > 4_000_000) {
      return NextResponse.json(
        { error: 'Image too large. Max 4MB.' },
        { status: 413 }
      );
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

    void profile;
    void totals;

    const response = await callAI({
      userId: user.id,
      feature: 'photo_scan',
      maxTokens: 800,
      system:
        'You are a precise nutrition analyser and food coach. Return ONLY valid JSON.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: image,
              },
            },
            {
              type: 'text',
              text: `Identify this food product and provide detailed nutrition information.

Return this exact JSON:
{
  "food_name": "<full product name>",
  "brand": "<brand if visible, else null>",
  "per_100g": {
    "calories": <int>,
    "protein_g": <num 1dp>,
    "carbs_g": <num 1dp>,
    "fat_g": <num 1dp>,
    "fiber_g": <num 1dp or null>,
    "sugar_g": <num 1dp or null>,
    "sodium_mg": <num 1dp or null>
  },
  "common_servings": [
    { "label": "<e.g. 1 cup (240ml)>", "grams": <num> },
    { "label": "<e.g. 1 tbsp (15g)>", "grams": <num> },
    { "label": "<e.g. 100g>", "grams": 100 }
  ],
  "notes": "<brief note e.g. processed food, whole grain, etc>"
}`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const parsedData = JSON.parse(stripMarkdownFences(text));
      return NextResponse.json({ result: parsedData });
    } catch {
      return NextResponse.json(
        { error: 'Could not analyse image. Try a clearer photo.' },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
