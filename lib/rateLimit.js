/**
 * In-memory sliding-window rate limiter.
 *
 * Suitable for single-instance deployments (Next.js dev + typical VPS/serverless).
 * State lives in the Node.js module cache — resets on cold start, which is fine
 * for abuse prevention (not billing-grade enforcement).
 *
 * Usage:
 *   const result = rateLimit(userId, "generate-outfit", { limit: 20, windowMs: 24 * 60 * 60 * 1000 });
 *   if (!result.allowed) return rateLimitResponse(result);
 */

// Map<`${userId}:${action}`, { count: number, resetAt: number }>
const store = new Map();

// Periodically evict expired entries so the Map doesn't grow unbounded.
let cleanupCounter = 0;
const CLEANUP_EVERY = 200; // check after every N calls

function maybeCleanup() {
  cleanupCounter++;
  if (cleanupCounter < CLEANUP_EVERY) return;
  cleanupCounter = 0;
  const now = Date.now();
  for (const [key, record] of store) {
    if (now > record.resetAt) store.delete(key);
  }
}

/**
 * @param {string} userId
 * @param {string} action   — unique key for this route, e.g. "generate-outfit"
 * @param {{ limit: number, windowMs: number }} options
 * @returns {{ allowed: boolean, remaining: number, limit: number, resetIn: number }}
 *   resetIn — seconds until the window resets
 */
export function rateLimit(userId, action, { limit, windowMs }) {
  maybeCleanup();

  const key = `${userId}:${action}`;
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    // Start a fresh window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, limit, resetIn: Math.ceil(windowMs / 1000) };
  }

  if (record.count >= limit) {
    return {
      allowed:   false,
      remaining: 0,
      limit,
      resetIn:   Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count++;
  return {
    allowed:   true,
    remaining: limit - record.count,
    limit,
    resetIn:   Math.ceil((record.resetAt - now) / 1000),
  };
}

/**
 * Convenience — build the 429 NextResponse from a rateLimit result.
 * Import NextResponse at call site; pass it in so this file stays framework-agnostic.
 */
export function rateLimitResponse(NextResponse, result, action) {
  return NextResponse.json(
    {
      message: `Too many requests. You've reached the limit for ${action}. Please try again in ${formatResetIn(result.resetIn)}.`,
      retryAfter: result.resetIn,
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit":     String(result.limit),
        "X-RateLimit-Remaining": "0",
        "Retry-After":           String(result.resetIn),
      },
    }
  );
}

/** 3600 → "1 hour", 120 → "2 minutes", 45 → "45 seconds" */
function formatResetIn(seconds) {
  if (seconds >= 3600) return `${Math.ceil(seconds / 3600)} hour${Math.ceil(seconds / 3600) !== 1 ? "s" : ""}`;
  if (seconds >= 60)   return `${Math.ceil(seconds / 60)} minute${Math.ceil(seconds / 60) !== 1 ? "s" : ""}`;
  return `${seconds} second${seconds !== 1 ? "s" : ""}`;
}

// ── Pre-defined limit configs ─────────────────────────────────────
const DAY = 24 * 60 * 60 * 1000;

export const LIMITS = {
  "generate-outfit":  { limit: 20, windowMs: DAY },
  "upload-clothing":  { limit: 40, windowMs: DAY },
  "chat-stylist":     { limit: 50, windowMs: DAY },
  "outfit-of-the-day":{ limit:  5, windowMs: DAY },
  "capsule":          { limit:  5, windowMs: DAY },
  "packing":          { limit: 10, windowMs: DAY },
  "skin-tone":        { limit:  3, windowMs: DAY },
};
