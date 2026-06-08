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
      SELECT log_date, weight_kg FROM weight_logs
      WHERE user_id = ${user.id}
      ORDER BY log_date DESC LIMIT 30
    `;

    return NextResponse.json({ logs: rows });
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
    const { weight_kg, notes } = body;

    const weightNum = Number(weight_kg);
    if (isNaN(weightNum) || weightNum < 20 || weightNum > 500) {
      return NextResponse.json(
        { error: 'Invalid weight' },
        { status: 400 }
      );
    }

    await db`
      INSERT INTO weight_logs (user_id, log_date, weight_kg, notes)
      VALUES (${user.id}, CURRENT_DATE, ${weightNum}, ${notes ?? null})
      ON CONFLICT (user_id, log_date) DO UPDATE SET
        weight_kg = EXCLUDED.weight_kg,
        notes = EXCLUDED.notes
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
