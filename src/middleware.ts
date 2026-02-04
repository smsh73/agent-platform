import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  getRateLimitHeaders,
  RateLimits,
} from "@/lib/middleware/rate-limiter";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers for all requests
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.perplexity.ai",
      "frame-ancestors 'none'",
    ].join("; ")
  );

  // CORS for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      process.env.NEXTAUTH_URL || "http://localhost:3000",
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
    }

    // Handle OPTIONS preflight
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }

    // Rate limiting for API routes
    const session = await auth();
    const identifier = getRateLimitIdentifier(request, session?.user?.id);

    // Determine rate limit config based on path
    let rateLimitConfig = RateLimits.DEFAULT;
    const path = request.nextUrl.pathname;

    if (path.includes("/api/chat")) {
      rateLimitConfig = RateLimits.CHAT;
    } else if (path.includes("/api/research")) {
      rateLimitConfig = RateLimits.RESEARCH;
    } else if (path.includes("/api/slides")) {
      rateLimitConfig = RateLimits.SLIDES;
    } else if (path.includes("/api/sheets")) {
      rateLimitConfig = RateLimits.SHEETS;
    } else if (path.includes("/api/knowledge-base")) {
      rateLimitConfig = RateLimits.KNOWLEDGE_BASE;
    } else if (path.includes("/api/documents") || path.includes("/upload")) {
      rateLimitConfig = RateLimits.FILE_UPLOAD;
    } else if (path.includes("/api/settings/provider-keys")) {
      rateLimitConfig = RateLimits.API_KEYS;
    } else if (path.includes("/api/workflows")) {
      rateLimitConfig = RateLimits.WORKFLOW;
    } else if (path.includes("/api/auth")) {
      rateLimitConfig = RateLimits.AUTH;
    }

    const rateLimitResult = await checkRateLimit(identifier, rateLimitConfig);

    // Add rate limit headers
    const headers = getRateLimitHeaders(rateLimitResult);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Block if rate limit exceeded
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitConfig.message || "Too many requests",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: response.headers,
        }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
    // Match dashboard routes for security headers
    "/(dashboard|admin)/:path*",
  ],
};
