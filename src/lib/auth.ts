import { SignJWT, jwtVerify } from 'jose';
import bcryptjs from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { db } from './db';

export interface JWTPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  onboarding_completed: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  onboarding_completed: boolean;
}

const COOKIE_NAME = 'caltrack_session';
const JWT_EXPIRY = '30d';
const BCRYPT_ROUNDS = 12;
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(plain, hash);
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
}

export function getSessionCookie(req: NextRequest): string | undefined {
  return req.cookies.get(COOKIE_NAME)?.value;
}

export async function getUser(req: NextRequest): Promise<User | null> {
  const token = getSessionCookie(req);
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const rows = await db`
    SELECT id, username, email, role, status, onboarding_completed
    FROM users WHERE id = ${payload.userId}
  `;

  const user = rows[0] as User | undefined;
  return user ?? null;
}
