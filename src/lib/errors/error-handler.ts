import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./api-errors";

/**
 * Standard error response format
 */
interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  timestamp?: string;
}

/**
 * Handle API errors and return appropriate NextResponse
 * @param error - The error to handle
 * @returns NextResponse with error details
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  console.error("API Error:", error);

  // Custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === "development" && error.details
          ? { details: error.details }
          : {}),
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Invalid request data",
        code: "VALIDATION_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error.errors.map((err) => ({
                path: err.path.join("."),
                message: err.message,
              }))
            : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // Standard Error objects
  if (error instanceof Error) {
    // Don't expose internal error details in production
    const message =
      process.env.NODE_ENV === "development"
        ? error.message
        : "An unexpected error occurred";

    return NextResponse.json(
      {
        error: message,
        code: "INTERNAL_ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  // Unknown error types
  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}

/**
 * Wrap async functions with error handling
 * @param fn - Async function to wrap
 * @returns Wrapped function that catches and handles errors
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}

/**
 * Log error for monitoring/debugging
 * @param context - Context where error occurred
 * @param error - The error
 * @param metadata - Additional metadata
 */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  const errorLog = {
    context,
    timestamp: new Date().toISOString(),
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
          }
        : error,
    metadata,
  };

  // In production, send to monitoring service (e.g., Sentry, DataDog)
  // For now, just log to console
  console.error(JSON.stringify(errorLog, null, 2));
}
