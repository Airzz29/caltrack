import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const chatRows = await db`
      SELECT id FROM coach_chats
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    if (chatRows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const messages = await db`
      SELECT id, role, content, created_at
      FROM coach_messages
      WHERE chat_id = ${id}
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ messages });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const chatRows = await db`
      SELECT id FROM coach_chats
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    if (chatRows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db`DELETE FROM coach_chats WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { title } = body;

    const chatRows = await db`
      SELECT id FROM coach_chats
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    if (chatRows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db`
      UPDATE coach_chats SET title = ${title}, updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
