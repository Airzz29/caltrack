import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';

async function requireAdmin(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return null;

  const check = await db`
    SELECT role FROM users WHERE id = ${user.id}
  `;
  if (check[0]?.role !== 'admin') return null;

  return user;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { status } = body;

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await db`
      UPDATE users SET status = ${status} WHERE id = ${id}
    `;

    await db`
      INSERT INTO admin_audit_log
        (admin_id, action, target_user_id, details)
      VALUES (
        ${user.id},
        ${status === 'approved' ? 'approve_user' : 'reject_user'},
        ${id},
        ${JSON.stringify({ status })}::jsonb
      )
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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const userRows = await db`
      SELECT u.id, u.username, u.email, u.status,
        u.created_at, u.onboarding_completed,
        p.display_name, p.goal_type, p.daily_calories,
        p.daily_protein_g, p.current_weight_kg, p.goal_weight_kg
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.id = ${id}
    `;

    const usageByFeature = await db`
      SELECT feature,
        COUNT(*)::int as calls,
        SUM(input_tokens)::int as input_tokens,
        SUM(output_tokens)::int as output_tokens,
        SUM(cost_usd_cents)::numeric(8,4) as cost_usd
      FROM ai_usage_log
      WHERE user_id = ${id}
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY feature
      ORDER BY cost_usd DESC
    `;

    const monthlyRows = await db`
      SELECT COALESCE(SUM(cost_usd_cents),0)::numeric(8,4) as total_usd,
        COUNT(*)::int as total_calls
      FROM ai_usage_log
      WHERE user_id = ${id}
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `;

    const alltimeRows = await db`
      SELECT COALESCE(SUM(cost_usd_cents),0)::numeric(8,4) as alltime_usd
      FROM ai_usage_log WHERE user_id = ${id}
    `;

    return NextResponse.json({
      user: userRows[0],
      usageByFeature,
      monthlyTotal: monthlyRows[0],
      alltimeUsd: alltimeRows[0]?.alltime_usd ?? 0,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
