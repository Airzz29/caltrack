import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
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

    const rl = checkRateLimit(
      user.id,
      'photo_scan',
      RATE_LIMITS.photo_scan.max,
      RATE_LIMITS.photo_scan.windowMs
    );
    if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

    const response = await callAI({
      userId: user.id,
      feature: 'photo_scan',
      maxTokens: 60,
      system:
        'You are a barcode reader. Look at the image and find any barcode. Return ONLY the barcode digits with no other text. If no barcode visible return NOT_FOUND.',
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
              text: 'Read the barcode number. Return only the digits.',
            },
          ],
        },
      ],
    });

    const raw =
      response.content[0].type === 'text'
        ? response.content[0].text.trim()
        : '';
    const barcode = raw.replace(/\D/g, '');

    if (!barcode || barcode.length < 6 || raw === 'NOT_FOUND') {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, barcode });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
