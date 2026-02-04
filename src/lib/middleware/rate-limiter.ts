import { NextRequest } from "next/server";

// In-memory store for rate limiting (for production, use Redis)
const rateLimitStore = new Map<
  string,
  { count: number; resetAt: number; requests: number[] }
>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  limit: number; // Max requests
  windowMs: number; // Time window in milliseconds
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {
    limit: 100,
    windowMs: 60000, // 1 minute
  }
): Promise<RateLimitResult> {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // No existing record or window expired
  if (!record || now > record.resetAt) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt,
      requests: [now],
    });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt,
    };
  }

  // Filter out old requests outside the window
  const validRequests = record.requests.filter(
    (timestamp) => timestamp > now - config.windowMs
  );

  // Check if limit exceeded
  if (validRequests.length >= config.limit) {
    const oldestRequest = Math.min(...validRequests);
    const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfter,
    };
  }

  // Update record
  validRequests.push(now);
  record.requests = validRequests;
  record.count = validRequests.length;

  return {
    allowed: true,
    remaining: config.limit - validRequests.length,
    resetAt: record.resetAt,
  };
}

/**
 * Get rate limit identifier from request
 * @param req - Next.js request object
 * @param userId - Optional user ID
 * @returns Unique identifier for rate limiting
 */
export function getRateLimitIdentifier(
  req: NextRequest,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP address
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0] || realIp || "unknown";

  return `ip:${ip}`;
}

/**
 * Rate limit configurations for different endpoints
 */
export const RateLimits = {
  // Chat endpoints - moderate limit
  CHAT: {
    limit: 60,
    windowMs: 60000, // 60 requests per minute
    message: "Too many chat requests. Please wait a moment.",
  },

  // Research - lower limit (expensive operation)
  RESEARCH: {
    limit: 10,
    windowMs: 60000, // 10 requests per minute
    message: "Too many research requests. Please wait before starting a new research.",
  },

  // Slides generation - low limit (very expensive)
  SLIDES: {
    limit: 5,
    windowMs: 60000, // 5 requests per minute
    message: "Too many slide generation requests. Please wait before creating new slides.",
  },

  // Sheets generation - low limit
  SHEETS: {
    limit: 10,
    windowMs: 60000, // 10 requests per minute
    message: "Too many sheet generation requests.",
  },

  // Knowledge base operations - moderate
  KNOWLEDGE_BASE: {
    limit: 30,
    windowMs: 60000, // 30 requests per minute
    message: "Too many knowledge base requests.",
  },

  // File uploads - strict limit
  FILE_UPLOAD: {
    limit: 20,
    windowMs: 60000, // 20 files per minute
    message: "Too many file uploads. Please wait.",
  },

  // API key operations - very strict
  API_KEYS: {
    limit: 10,
    windowMs: 60000, // 10 operations per minute
    message: "Too many API key operations.",
  },

  // Workflow execution - moderate
  WORKFLOW: {
    limit: 30,
    windowMs: 60000,
    message: "Too many workflow executions.",
  },

  // Auth operations - strict
  AUTH: {
    limit: 5,
    windowMs: 60000, // 5 attempts per minute
    message: "Too many authentication attempts. Please try again later.",
  },

  // Default for other endpoints
  DEFAULT: {
    limit: 100,
    windowMs: 60000,
    message: "Too many requests. Please slow down.",
  },
} as const;

/**
 * Create rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.remaining + (result.allowed ? 1 : 0)),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
    ...(result.retryAfter && {
      "Retry-After": String(result.retryAfter),
    }),
  };
}
