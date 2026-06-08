export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Barcode required' }, { status: 400 });
    }

    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${code}.json`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ found: false });
    }

    const p = data.product;
    const nutriments = p.nutriments ?? {};

    const servingG = parseFloat(p.serving_quantity) || 100;
    const factor = servingG / 100;

    const product = {
      food_name: p.product_name_en ?? p.product_name ?? 'Unknown Product',
      brand: p.brands ?? '',
      calories: Math.round((nutriments['energy-kcal_100g'] ?? 0) * factor),
      protein_g:
        Math.round((nutriments.proteins_100g ?? 0) * factor * 10) / 10,
      carbs_g:
        Math.round((nutriments.carbohydrates_100g ?? 0) * factor * 10) / 10,
      fat_g: Math.round((nutriments.fat_100g ?? 0) * factor * 10) / 10,
      serving_size: p.serving_size ?? `${servingG}g`,
      barcode: code,
    };

    return NextResponse.json({ found: true, product });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
