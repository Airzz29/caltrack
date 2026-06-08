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
      SELECT memory_json FROM user_memory
      WHERE user_id = ${user.id}
    `;

    const row = rows[0] as { memory_json: string } | undefined;
    const memory = row
      ? typeof row.memory_json === 'string'
        ? JSON.parse(row.memory_json)
        : row.memory_json
      : [];

    return NextResponse.json({ memory });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
