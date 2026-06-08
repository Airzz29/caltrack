export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';

function toLocalDateKey(value: string | Date): string {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function calculateStreak(logDates: string[]): {
  streak: number;
  loggedToday: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayKey = toLocalDateKey(today);
  const yesterdayKey = toLocalDateKey(yesterday);

  const dateSet = new Set(logDates.map((d) => toLocalDateKey(d)));

  const loggedToday = dateSet.has(todayKey);
  const loggedYesterday = dateSet.has(yesterdayKey);

  if (!loggedToday && !loggedYesterday) {
    return { streak: 0, loggedToday: false };
  }

  let streak = 0;
  const check = new Date(loggedToday ? today : yesterday);

  while (dateSet.has(toLocalDateKey(check))) {
    streak++;
    check.setDate(check.getDate() - 1);
  }

  return { streak, loggedToday };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await db`
      SELECT DISTINCT log_date
      FROM food_log
      WHERE user_id = ${user.id}
        AND log_date >= CURRENT_DATE - INTERVAL '90 days'
      ORDER BY log_date DESC
    `;

    const logDates = rows.map((r) => String(r.log_date));
    const { streak, loggedToday } = calculateStreak(logDates);

    return NextResponse.json({ streak, loggedToday });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
