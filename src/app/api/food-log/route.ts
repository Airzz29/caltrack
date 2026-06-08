export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';

const SOURCES = ['manual', 'photo', 'barcode', 'label'] as const;

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await db`
      SELECT id, food_name, calories, protein_g, carbs_g,
        fat_g, source, meal_type, serving_size, created_at
      FROM food_log
      WHERE user_id = ${user.id}
        AND log_date = CURRENT_DATE
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ entries: rows });
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
      sugar_g,
      sodium_mg,
      serving_size,
      source,
      meal_type,
      notes,
    } = body;

    if (
      !food_name ||
      typeof food_name !== 'string' ||
      food_name.length > 255
    ) {
      return NextResponse.json(
        { error: 'Invalid food name' },
        { status: 400 }
      );
    }

    const caloriesNum = Number(calories);
    if (
      !Number.isInteger(caloriesNum) ||
      caloriesNum < 0 ||
      caloriesNum > 9999
    ) {
      return NextResponse.json(
        { error: 'Invalid calories' },
        { status: 400 }
      );
    }

    const proteinNum = Number(protein_g);
    if (isNaN(proteinNum) || proteinNum < 0 || proteinNum > 999) {
      return NextResponse.json(
        { error: 'Invalid protein' },
        { status: 400 }
      );
    }

    if (!source || !SOURCES.includes(source)) {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
    }

    const rows = await db`
      INSERT INTO food_log (
        user_id, food_name, calories, protein_g, carbs_g, fat_g,
        fiber_g, sugar_g, sodium_mg, serving_size, source, meal_type, notes
      )
      VALUES (
        ${user.id}, ${food_name}, ${caloriesNum}, ${proteinNum},
        ${carbs_g ?? null}, ${fat_g ?? null},
        ${fiber_g ?? null}, ${sugar_g ?? null}, ${sodium_mg ?? null},
        ${serving_size ?? null}, ${source}, ${meal_type ?? null}, ${notes ?? null}
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
