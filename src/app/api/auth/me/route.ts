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
      SELECT daily_calories, daily_protein_g, daily_carbs_g,
        daily_fat_g, display_name, goal_weight_kg
      FROM user_profiles
      WHERE user_id = ${user.id}
    `;

    const profile = rows[0] ?? null;

    return NextResponse.json({
      user: { ...user, profile },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
