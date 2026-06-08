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

    const check = await db`
      SELECT role FROM users WHERE id = ${user.id}
    `;
    if (check[0]?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await db`
      SELECT 
        u.id, u.username, u.email, u.role, u.status,
        u.onboarding_completed, u.created_at,
        p.display_name, p.goal_type,
        COALESCE(SUM(a.cost_usd_cents),0)::numeric(8,4) as total_cost_usd,
        COUNT(a.id)::int as total_ai_calls,
        (SELECT COUNT(DISTINCT log_date) FROM food_log f
         WHERE f.user_id = u.id
         AND f.log_date >= CURRENT_DATE - INTERVAL '7 days'
        )::int as streak_7d,
        (SELECT COUNT(*) FROM food_log f
         WHERE f.user_id = u.id
         AND f.log_date = CURRENT_DATE
        )::int as logged_today
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      LEFT JOIN ai_usage_log a ON a.user_id = u.id
      WHERE u.role = 'user'
      GROUP BY u.id, p.display_name, p.goal_type
      ORDER BY 
        CASE u.status WHEN 'pending' THEN 0
                      WHEN 'approved' THEN 1
                      ELSE 2 END,
        u.created_at ASC
    `;

    return NextResponse.json({ users: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
