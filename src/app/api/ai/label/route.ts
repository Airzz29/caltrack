import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
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
      'label_scan',
      RATE_LIMITS.label_scan.max,
      RATE_LIMITS.label_scan.windowMs
    );
    if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

    const body = await req.json();
    const { image, serving_description } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }

    if (image.length * 0.75 > 4_000_000) {
      return NextResponse.json(
        { error: 'Image too large. Max 4MB.' },
        { status: 413 }
      );
    }

    const response = await callAI({
      userId: user.id,
      feature: 'label_scan',
      maxTokens: 512,
      system:
        'You are a precise nutrition label reader. Extract exact values from the nutrition panel in the image. Return ONLY valid JSON.',
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
              text: `Read the nutrition label in this image.
${serving_description
  ? `The user had: "${serving_description}". Calculate the nutrition for THAT specific amount based on the label values.
     For example if label says 100g = 200kcal and user had 250g,
     return 500kcal.`
  : 'Return values per one standard serving shown on the label.'}

Return this exact JSON — no markdown:
{
  "food_name": "<product name from label>",
  "serving_size": "${serving_description ?? 'per serving from label'}",
  "calories": <integer — for the amount user described>,
  "protein_g": <number 1dp>,
  "carbs_g": <number 1dp>,
  "fat_g": <number 1dp>,
  "fiber_g": <number 1dp or null>,
  "sugar_g": <number 1dp or null>,
  "sodium_mg": <number 1dp or null>,
  "confidence": "high",
  "calculation_note": "<brief note e.g. '2 tbsp = 30g, calculated from per-100g values'>"
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
