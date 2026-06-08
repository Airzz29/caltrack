export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      display_name,
      daily_calories,
      daily_protein_g,
      daily_carbs_g,
      daily_fat_g,
      daily_fiber_g,
      goal_weight_kg,
      current_weight_kg,
      theme,
    } = body;

    if (display_name !== undefined) {
      if (
        typeof display_name !== 'string' ||
        display_name.length < 1 ||
        display_name.length > 100
      ) {
        return NextResponse.json(
          { error: 'Invalid display name' },
          { status: 400 }
        );
      }
    }

    if (daily_calories !== undefined) {
      const n = Number(daily_calories);
      if (!Number.isInteger(n) || n < 500 || n > 9999) {
        return NextResponse.json(
          { error: 'Invalid daily calories' },
          { status: 400 }
        );
      }
    }

    if (daily_protein_g !== undefined) {
      const n = Number(daily_protein_g);
      if (!Number.isInteger(n) || n < 0 || n > 999) {
        return NextResponse.json(
          { error: 'Invalid daily protein' },
          { status: 400 }
        );
      }
    }

    if (goal_weight_kg !== undefined && goal_weight_kg !== null) {
      const n = Number(goal_weight_kg);
      if (isNaN(n) || n < 20 || n > 500) {
        return NextResponse.json(
          { error: 'Invalid goal weight' },
          { status: 400 }
        );
      }
    }

    if (current_weight_kg !== undefined && current_weight_kg !== null) {
      const n = Number(current_weight_kg);
      if (isNaN(n) || n < 20 || n > 500) {
        return NextResponse.json(
          { error: 'Invalid current weight' },
          { status: 400 }
        );
      }
    }

    if (theme !== undefined && theme !== 'dark' && theme !== 'light') {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    const existingRows = await db`
      SELECT daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g
      FROM user_profiles WHERE user_id = ${user.id}
    `;
    const existing = existingRows[0] as {
      daily_calories: number;
      daily_protein_g: number;
      daily_carbs_g: number;
      daily_fat_g: number;
    };

    const calories =
      daily_calories !== undefined
        ? parseInt(String(daily_calories), 10)
        : undefined;
    const protein =
      daily_protein_g !== undefined
        ? parseInt(String(daily_protein_g), 10)
        : undefined;
    const carbs =
      daily_carbs_g !== undefined
        ? parseInt(String(daily_carbs_g), 10)
        : undefined;
    const fat =
      daily_fat_g !== undefined ? parseInt(String(daily_fat_g), 10) : undefined;

    await db`
      UPDATE user_profiles SET
        display_name = COALESCE(${display_name ?? null}, display_name),
        daily_calories = ${calories ?? existing?.daily_calories ?? null},
        daily_protein_g = ${protein ?? existing?.daily_protein_g ?? null},
        daily_carbs_g = ${carbs ?? existing?.daily_carbs_g ?? null},
        daily_fat_g = ${fat ?? existing?.daily_fat_g ?? null},
        daily_fiber_g = COALESCE(${daily_fiber_g ?? null}, daily_fiber_g),
        goal_weight_kg = COALESCE(${goal_weight_kg ?? null}, goal_weight_kg),
        current_weight_kg = COALESCE(${current_weight_kg ?? null}, current_weight_kg),
        theme = COALESCE(${theme ?? null}, theme),
        updated_at = NOW()
      WHERE user_id = ${user.id}
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
