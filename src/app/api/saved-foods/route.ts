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
      SELECT id, food_name, calories, protein_g, carbs_g,
        fat_g, fiber_g, default_serving, is_favourite, times_used
      FROM saved_foods
      WHERE user_id = ${user.id}
      ORDER BY is_favourite DESC, times_used DESC, created_at DESC
    `;

    return NextResponse.json({ foods: rows });
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
    const {
      food_name,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      fiber_g,
      default_serving,
    } = body;

    if (!food_name || typeof food_name !== 'string') {
      return NextResponse.json(
        { error: 'Food name required' },
        { status: 400 }
      );
    }

    const caloriesNum = Number(calories);
    if (!Number.isInteger(caloriesNum)) {
      return NextResponse.json(
        { error: 'Calories required' },
        { status: 400 }
      );
    }

    const rows = await db`
      INSERT INTO saved_foods (
        user_id, food_name, calories, protein_g, carbs_g,
        fat_g, fiber_g, default_serving
      )
      VALUES (
        ${user.id}, ${food_name}, ${caloriesNum},
        ${protein_g ?? null}, ${carbs_g ?? null},
        ${fat_g ?? null}, ${fiber_g ?? null},
        ${default_serving ?? null}
      )
      RETURNING id
    `;

    return NextResponse.json(
      { success: true, id: rows[0].id },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
