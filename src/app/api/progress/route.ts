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

    const weightRows = await db`
      SELECT log_date, weight_kg
      FROM weight_logs
      WHERE user_id = ${user.id}
        AND log_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY log_date ASC
    `;

    const calorieRows = await db`
      SELECT
        log_date,
        SUM(calories)::int as total_calories,
        SUM(protein_g)::numeric(6,1) as total_protein
      FROM food_log
      WHERE user_id = ${user.id}
        AND log_date >= CURRENT_DATE - INTERVAL '14 days'
      GROUP BY log_date
      ORDER BY log_date ASC
    `;

    const goalsRows = await db`
      SELECT daily_calories, daily_protein_g
      FROM user_profiles
      WHERE user_id = ${user.id}
    `;

    const goalsRow = goalsRows[0] as
      | { daily_calories: number; daily_protein_g: number }
      | undefined;

    return NextResponse.json({
      weightLogs: weightRows,
      calorieLogs: calorieRows,
      goals: {
        daily_calories: goalsRow?.daily_calories ?? 2000,
        daily_protein_g: goalsRow?.daily_protein_g ?? 150,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
