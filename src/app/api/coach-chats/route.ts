export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await db`
      SELECT id, title, created_at, updated_at
      FROM coach_chats
      WHERE user_id = ${user.id}
      ORDER BY updated_at DESC
      LIMIT 30
    `;

    return NextResponse.json({ chats: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title } = body;

    const rows = await db`
      INSERT INTO coach_chats (user_id, title)
      VALUES (${user.id}, ${title ?? 'New conversation'})
      RETURNING id, title, created_at, updated_at
    `;

    return NextResponse.json({ chat: rows[0] }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
