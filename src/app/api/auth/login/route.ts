import { NextRequest, NextResponse } from 'next/server';
import {
  comparePassword,
  setSessionCookie,
  signToken,
  JWTPayload,
} from '@/lib/auth';
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
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const rows = await db`
      SELECT id, username, email, password_hash, role, status, onboarding_completed
      FROM users
      WHERE username = ${username} OR email = ${username}
    `;

    const user = rows[0] as
      | {
          id: string;
          username: string;
          email: string;
          password_hash: string;
          role: 'user' | 'admin';
          status: 'pending' | 'approved' | 'rejected';
          onboarding_completed: boolean;
        }
      | undefined;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const valid = await comparePassword(password, user.password_hash);

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (user.status === 'rejected') {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 403 }
      );
    }

    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      onboarding_completed: user.onboarding_completed ?? false,
    };

    const token = await signToken(payload);

    let redirect: string;
    if (user.role === 'admin') {
      redirect = '/dashboard';
    } else if (user.status === 'pending') {
      redirect = '/pending';
    } else if (!user.onboarding_completed) {
      redirect = '/onboarding/profile';
    } else {
      redirect = '/dashboard';
    }

    const res = NextResponse.json({ success: true, redirect });
    setSessionCookie(res, token);

    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
