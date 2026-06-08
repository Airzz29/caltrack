import { NextRequest, NextResponse } from 'next/server';
import { getUser, signToken, setSessionCookie } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db`
      UPDATE users SET sessions_invalidated_at = NOW()
      WHERE id = ${user.id}
    `;

    const newToken = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      onboarding_completed: user.onboarding_completed,
    });

    const res = NextResponse.json({ success: true });
    setSessionCookie(res, newToken);
    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
