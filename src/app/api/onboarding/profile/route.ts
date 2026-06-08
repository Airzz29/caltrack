import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';

const ACTIVITY_LEVELS = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
] as const;

const GOAL_TYPES = [
  'lose_weight',
  'gain_muscle',
  'maintain',
  'bulk',
] as const;

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      display_name,
      age,
      gender,
      height_cm,
      current_weight_kg,
      goal_weight_kg,
      activity_level,
      goal_type,
    } = body;

    if (
      !display_name ||
      typeof display_name !== 'string' ||
      display_name.length < 1 ||
      display_name.length > 100
    ) {
      return NextResponse.json(
        { error: 'Invalid display name' },
        { status: 400 }
      );
    }

    const ageNum = Number(age);
    if (!Number.isInteger(ageNum) || ageNum < 10 || ageNum > 120) {
      return NextResponse.json({ error: 'Invalid age' }, { status: 400 });
    }

    const heightNum = Number(height_cm);
    if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
      return NextResponse.json({ error: 'Invalid height' }, { status: 400 });
    }

    const currentWeightNum = Number(current_weight_kg);
    if (
      isNaN(currentWeightNum) ||
      currentWeightNum < 20 ||
      currentWeightNum > 500
    ) {
      return NextResponse.json(
        { error: 'Invalid current weight' },
        { status: 400 }
      );
    }

    const goalWeightNum = Number(goal_weight_kg);
    if (
      isNaN(goalWeightNum) ||
      goalWeightNum < 20 ||
      goalWeightNum > 500
    ) {
      return NextResponse.json(
        { error: 'Invalid goal weight' },
        { status: 400 }
      );
    }

    if (
      !activity_level ||
      !ACTIVITY_LEVELS.includes(activity_level)
    ) {
      return NextResponse.json(
        { error: 'Invalid activity level' },
        { status: 400 }
      );
    }

    if (!goal_type || !GOAL_TYPES.includes(goal_type)) {
      return NextResponse.json({ error: 'Invalid goal type' }, { status: 400 });
    }

    await db`
      INSERT INTO user_profiles
        (user_id, display_name, age, gender, height_cm,
         current_weight_kg, goal_weight_kg, activity_level, goal_type)
      VALUES
        (${user.id}, ${display_name}, ${ageNum}, ${gender}, ${heightNum},
         ${currentWeightNum}, ${goalWeightNum}, ${activity_level}, ${goal_type})
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        height_cm = EXCLUDED.height_cm,
        current_weight_kg = EXCLUDED.current_weight_kg,
        goal_weight_kg = EXCLUDED.goal_weight_kg,
        activity_level = EXCLUDED.activity_level,
        goal_type = EXCLUDED.goal_type,
        updated_at = NOW()
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
