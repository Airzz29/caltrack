const store = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  resetInSeconds: number;
}

export function checkRateLimit(
  userId: string,
  feature: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const key = `${userId}:${feature}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, resetInSeconds: 0 };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true, resetInSeconds: 0 };
}

export const RATE_LIMITS: Record<
  string,
  { max: number; windowMs: number; label: string }
> = {
  photo_scan: { max: 15, windowMs: 60 * 60 * 1000, label: '15/hour' },
  label_scan: { max: 15, windowMs: 60 * 60 * 1000, label: '15/hour' },
  ai_coach: { max: 30, windowMs: 60 * 60 * 1000, label: '30/hour' },
  chat_log: { max: 20, windowMs: 60 * 60 * 1000, label: '20/hour' },
  food_scout: { max: 15, windowMs: 60 * 60 * 1000, label: '15/hour' },
  food_scout_chat: { max: 30, windowMs: 60 * 60 * 1000, label: '30/hour' },
  onboarding_plan: { max: 10, windowMs: 24 * 60 * 60 * 1000, label: '10/day' },
};

export function rateLimitResponse(resetInSeconds: number) {
  return Response.json(
    { error: `Rate limit reached. Try again in ${resetInSeconds} seconds.` },
    { status: 429 }
  );
}
