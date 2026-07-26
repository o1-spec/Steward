import { NextResponse } from "next/server";

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

export interface RateLimiterInterface {
  check(key: string, options: RateLimitOptions): Promise<RateLimitResult>;
}

class InMemoryRateLimiter implements RateLimiterInterface {
  private store: Map<string, { count: number; expiresAt: number }> = new Map();

  public async check(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.expiresAt) {
      const expiresAt = now + options.windowMs;
      this.store.set(key, { count: 1, expiresAt });
      return {
        allowed: true,
        remaining: options.limit - 1,
        resetSeconds: Math.ceil(options.windowMs / 1000),
      };
    }

    if (record.count >= options.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetSeconds: Math.ceil((record.expiresAt - now) / 1000),
      };
    }

    record.count += 1;
    return {
      allowed: true,
      remaining: options.limit - record.count,
      resetSeconds: Math.ceil((record.expiresAt - now) / 1000),
    };
  }
}

export const defaultRateLimiter: RateLimiterInterface = new InMemoryRateLimiter();

export async function rateLimitRequest(
  key: string,
  options: RateLimitOptions = { limit: 10, windowMs: 60000 }
): Promise<{ allowed: true } | { allowed: false; response: NextResponse }> {
  const result = await defaultRateLimiter.check(key, options);

  if (!result.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(result.resetSeconds),
            "X-RateLimit-Limit": String(options.limit),
            "X-RateLimit-Remaining": "0",
          },
        }
      ),
    };
  }

  return { allowed: true };
}
