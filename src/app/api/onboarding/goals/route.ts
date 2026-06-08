import { NextRequest, NextResponse } from 'next/server';
import { getUser, signToken, setSessionCookie } from '@/lib/auth';
import { db } from '@/lib/db';

function parseOptionalInt(
  value: unknown,
  min: number,
  max: number
): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    return NaN;
  }
  return num;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      daily_calories,
      daily_protein_g,
      daily_carbs_g,
      daily_fat_g,
      daily_fiber_g,
      daily_sugar_g,
      daily_sodium_mg,
      use_ai_plan,
    } = body;

    const caloriesNum = Number(daily_calories);
    if (
      !Number.isInteger(caloriesNum) ||
      caloriesNum < 500 ||
      caloriesNum > 9999
    ) {
      return NextResponse.json(
        { error: 'Invalid daily calories' },
        { status: 400 }
      );
    }

    const proteinNum = Number(daily_protein_g);
    if (
      !Number.isInteger(proteinNum) ||
      proteinNum < 0 ||
      proteinNum > 999
    ) {
      return NextResponse.json(
        { error: 'Invalid daily protein' },
        { status: 400 }
      );
    }

    const carbsNum = parseOptionalInt(daily_carbs_g, 0, 999);
    if (Number.isNaN(carbsNum)) {
      return NextResponse.json({ error: 'Invalid carbs' }, { status: 400 });
    }

    const fatNum = parseOptionalInt(daily_fat_g, 0, 999);
    if (Number.isNaN(fatNum)) {
      return NextResponse.json({ error: 'Invalid fat' }, { status: 400 });
    }

    const fiberNum = parseOptionalInt(daily_fiber_g, 0, 999);
    if (Number.isNaN(fiberNum)) {
      return NextResponse.json({ error: 'Invalid fiber' }, { status: 400 });
    }

    const sugarNum = parseOptionalInt(daily_sugar_g, 0, 999);
    if (Number.isNaN(sugarNum)) {
      return NextResponse.json({ error: 'Invalid sugar' }, { status: 400 });
    }

    const sodiumNum = parseOptionalInt(daily_sodium_mg, 0, 99999);
    if (Number.isNaN(sodiumNum)) {
      return NextResponse.json({ error: 'Invalid sodium' }, { status: 400 });
    }

    const aiPlanAccepted = use_ai_plan === true;

    await db`
      UPDATE user_profiles SET
        daily_calories = ${caloriesNum},
        daily_protein_g = ${proteinNum},
        daily_carbs_g = ${carbsNum},
        daily_fat_g = ${fatNum},
        daily_fiber_g = ${fiberNum},
        daily_sugar_g = ${sugarNum},
        daily_sodium_mg = ${sodiumNum},
        ai_plan_accepted = ${aiPlanAccepted},
        updated_at = NOW()
      WHERE user_id = ${user.id}
    `;

    await db`
      UPDATE users SET onboarding_completed = true
      WHERE id = ${user.id}
    `;

    const updatedUser = await db`
      SELECT id, username, role, status 
      FROM users WHERE id = ${user.id}
    `;

    const newToken = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      onboarding_completed: true,
    });

    const response = NextResponse.json({ success: true });
    setSessionCookie(response, newToken);
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
