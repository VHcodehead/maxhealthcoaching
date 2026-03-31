export type RateLimitConfig = {
  windowMs: number;
  maxAttempts: number;
};

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const store = new Map<string, RateLimitEntry>();
let callCount = 0;

function sweepExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now >= entry.resetTime) {
      store.delete(key);
    }
  }
}

export function rateLimit(
  key: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; resetIn: number } {
  const now = Date.now();

  callCount++;
  if (callCount % 100 === 0) {
    sweepExpired();
  }

  const existing = store.get(key);

  if (!existing || now >= existing.resetTime) {
    // Fresh window
    store.set(key, { count: 1, resetTime: now + config.windowMs });
    return {
      success: true,
      remaining: config.maxAttempts - 1,
      resetIn: config.windowMs,
    };
  }

  if (existing.count >= config.maxAttempts) {
    return {
      success: false,
      remaining: 0,
      resetIn: existing.resetTime - now,
    };
  }

  existing.count++;
  return {
    success: true,
    remaining: config.maxAttempts - existing.count,
    resetIn: existing.resetTime - now,
  };
}

export const LOGIN_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
};

export const SIGNUP_LIMIT: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxAttempts: 3,
};

export const RESET_LIMIT: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxAttempts: 3,
};
