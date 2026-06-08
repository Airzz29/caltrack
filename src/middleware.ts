import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const publicPaths = ['/login', '/signup', '/pending'];

const publicPrefixes = [
  '/_next',
  '/api/auth',
  '/icons',
  '/manifest.json',
  '/sw.js',
  '/offline.html',
  '/favicon.ico',
];

const protectedPaths = [
  '/dashboard',
  '/log/',
  '/progress',
  '/foods',
  '/coach',
  '/onboarding',
  '/settings',
  '/admin',
];

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const token = req.cookies.get('caltrack_session')?.value;
  const payload = token ? await verifyToken(token) : null;

  if (pathname.startsWith('/admin')) {
    if (!payload) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  if (
    protectedPaths.some(
      (p) =>
        pathname === p.replace(/\/$/, '') ||
        pathname.startsWith(p.endsWith('/') ? p : p + '/')
    )
  ) {
    if (!payload) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (payload.status === 'pending') {
      return NextResponse.redirect(new URL('/pending', req.url));
    }
    if (payload.status === 'rejected') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (pathname.startsWith('/onboarding')) {
      return NextResponse.next();
    }
    if (!payload.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding/profile', req.url));
    }
    return NextResponse.next();
  }

  if (publicPaths.includes(pathname)) {
    if (payload) {
      if (payload.role === 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      if (payload.status === 'pending') {
        return NextResponse.redirect(new URL('/pending', req.url));
      }
      if (payload.status === 'approved' && !payload.onboarding_completed) {
        return NextResponse.redirect(new URL('/onboarding/profile', req.url));
      }
      if (payload.status === 'approved' && payload.onboarding_completed) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
