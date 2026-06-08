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
      SELECT u.username, p.display_name, p.goal_type,
        u.created_at,
        (SELECT COUNT(*) FROM food_log 
         WHERE user_id = u.id 
         AND log_date = CURRENT_DATE)::int as logged_today,
        (SELECT COUNT(DISTINCT log_date) FROM food_log 
         WHERE user_id = u.id 
         AND log_date >= CURRENT_DATE - INTERVAL '7 days')
         ::int as streak_days
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.status = 'approved' AND u.role = 'user'
      ORDER BY u.created_at ASC
    `;

    return NextResponse.json({
      users: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
