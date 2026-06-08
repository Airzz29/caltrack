import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';

const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const entry = attempts.get(ip);
  const now = Date.now();

  if (entry && entry.count >= 5 && entry.resetAt > now) {
    return false;
  }

  if (entry && entry.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }

  if (entry) {
    attempts.set(ip, {
      count: entry.count + 1,
      resetAt: entry.resetAt,
    });
  } else {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
  }

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many attempts, try again later' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const existing = await db`
      SELECT id FROM users WHERE username = ${username} OR email = ${email}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 400 }
      );
    }

    const hash = await hashPassword(password);

    await db`
      INSERT INTO users (username, email, password_hash, role, status)
      VALUES (${username}, ${email}, ${hash}, 'user', 'pending')
      RETURNING id
    `;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
