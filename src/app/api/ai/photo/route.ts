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

    const limit = RATE_LIMITS.photo_scan;
    const rl = checkRateLimit(user.id, 'photo_scan', limit.max, limit.windowMs);
    if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

    const body = await req.json();
    const { image, description } = body;

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
      feature: 'photo_scan',
      maxTokens: 512,
      system:
        'You are a precise nutrition estimator. Analyse the food in the image and return ONLY valid JSON — no markdown, no explanation outside JSON.',
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
              text: `Identify the food and estimate nutrition.
${description ? `User note: ${description}` : ''}

Return this exact JSON:
{
  "food_name": "<name of the food>",
  "calories": <integer>,
  "protein_g": <number 1dp>,
  "carbs_g": <number 1dp>,
  "fat_g": <number 1dp>,
  "confidence": "high" | "medium" | "low",
  "notes": "<brief note about the estimate>"
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
