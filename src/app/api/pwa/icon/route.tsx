import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = parseInt(searchParams.get('size') ?? '192', 10);

  const svg = `<svg width="${size}" height="${size}" 
    viewBox="0 0 ${size} ${size}" 
    xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" 
      rx="${size * 0.22}" fill="#07070D"/>
    <circle cx="${size / 2}" cy="${size / 2}" 
      r="${size * 0.32}" 
      fill="rgba(124,110,248,0.15)"/>
    <circle cx="${size / 2}" cy="${size / 2}" 
      r="${size * 0.21}" 
      fill="url(#grad)"/>
    <text x="${size / 2}" y="${size / 2}" 
      dominant-baseline="central" text-anchor="middle"
      fill="white" font-family="sans-serif" 
      font-weight="800" font-size="${size * 0.18}"
      letter-spacing="-0.02em">CT</text>
    <defs>
      <linearGradient id="grad" x1="0" y1="0" 
        x2="1" y2="1">
        <stop offset="0%" stop-color="#7C6EF8"/>
        <stop offset="100%" stop-color="#9d5cf6"/>
      </linearGradient>
    </defs>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
