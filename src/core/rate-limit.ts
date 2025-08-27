import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Simple in-memory rate limiter for development
class SimpleRateLimiter {
  private store = new Map<string, { count: number; reset: number }>();

  async limit(identifier: string, limit: number, windowMs: number) {
    const now = Date.now();
    const key = identifier;
    const item = this.store.get(key);

    // Clean expired entries
    if (item && now > item.reset) {
      this.store.delete(key);
    }

    const current = this.store.get(key) || { count: 0, reset: now + windowMs };

    if (current.count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: new Date(current.reset),
      };
    }

    current.count++;
    this.store.set(key, current);

    return {
      success: true,
      limit,
      remaining: limit - current.count,
      reset: new Date(current.reset),
    };
  }
}

// Use Redis in production, simple rate limiter in development
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Development fallback
const devRateLimiter = new SimpleRateLimiter();

// Rate limiters for different endpoints
export const adminRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute for admin
      analytics: true,
      prefix: "admin_rl",
    })
  : {
      limit: (id: string) => devRateLimiter.limit(id, 100, 60000),
    };

export const publicRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests per minute for public
      analytics: true,
      prefix: "public_rl",
    })
  : {
      limit: (id: string) => devRateLimiter.limit(id, 30, 60000),
    };

export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 auth attempts per minute
      analytics: true,
      prefix: "auth_rl",
    })
  : {
      limit: (id: string) => devRateLimiter.limit(id, 5, 60000),
    };

export const paymentRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 payment requests per minute
      analytics: true,
      prefix: "payment_rl",
    })
  : {
      limit: (id: string) => devRateLimiter.limit(id, 10, 60000),
    };

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  // Fallback for development
  return "127.0.0.1";
}

// Rate limit check function
export async function checkRateLimit(
  rateLimit: any,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  try {
    const result = await rateLimit.limit(identifier);
    return result;
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Allow request if rate limiting fails
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: new Date(),
    };
  }
}

// Rate limit response helper
export function createRateLimitResponse(
  limit: number,
  remaining: number,
  reset: Date
) {
  return new Response(
    JSON.stringify({
      error: "Quá nhiều yêu cầu",
      message: "Vui lòng thử lại sau",
      limit,
      remaining,
      resetTime: reset.toISOString(),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.getTime().toString(),
        "Retry-After": Math.ceil(
          (reset.getTime() - Date.now()) / 1000
        ).toString(),
      },
    }
  );
}
