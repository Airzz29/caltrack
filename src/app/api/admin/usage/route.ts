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

    const statsRows = await db`
      SELECT COUNT(DISTINCT user_id)::int as active_users,
        COUNT(*)::int as total_calls,
        SUM(cost_usd_cents)::numeric(8,4) as total_cost_usd
      FROM ai_usage_log
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `;

    const perUser = await db`
      SELECT u.username, p.display_name,
        COALESCE(SUM(a.cost_usd_cents),0)::numeric(8,4) as cost_usd,
        COUNT(a.id)::int as calls
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      LEFT JOIN ai_usage_log a ON a.user_id = u.id
        AND a.created_at >= DATE_TRUNC('month', CURRENT_DATE)
      WHERE u.role = 'user' AND u.status = 'approved'
      GROUP BY u.id, u.username, p.display_name
      ORDER BY cost_usd DESC
    `;

    return NextResponse.json({
      stats: statsRows[0],
      perUser,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
