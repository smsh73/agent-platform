/**
 * Base API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 - Bad Request / Validation Error
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

/**
 * 401 - Unauthorized / Authentication Error
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

/**
 * 403 - Forbidden / Authorization Error
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = "You don't have permission to perform this action") {
    super(message, 403, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
  }
}

/**
 * 404 - Not Found
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * 409 - Conflict
 */
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

/**
 * 422 - Unprocessable Entity
 */
export class UnprocessableEntityError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 422, "UNPROCESSABLE_ENTITY", details);
    this.name = "UnprocessableEntityError";
  }
}

/**
 * 429 - Too Many Requests
 */
export class RateLimitError extends ApiError {
  constructor(message: string = "Too many requests, please try again later") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
  }
}

/**
 * 500 - Internal Server Error
 */
export class InternalServerError extends ApiError {
  constructor(message: string = "An internal server error occurred") {
    super(message, 500, "INTERNAL_SERVER_ERROR");
    this.name = "InternalServerError";
  }
}

/**
 * 503 - Service Unavailable
 */
export class ServiceUnavailableError extends ApiError {
  constructor(service: string = "Service") {
    super(`${service} is currently unavailable`, 503, "SERVICE_UNAVAILABLE");
    this.name = "ServiceUnavailableError";
  }
}

/**
 * API Key Missing or Invalid
 */
export class ApiKeyError extends ApiError {
  constructor(provider: string, configured: boolean = false) {
    const message = configured
      ? `Invalid API key for ${provider.toUpperCase()}`
      : `API key not configured for ${provider.toUpperCase()}. Please configure it in Settings.`;
    super(message, configured ? 401 : 503, "API_KEY_ERROR", { provider });
    this.name = "ApiKeyError";
  }
}

/**
 * Database Error
 */
export class DatabaseError extends ApiError {
  constructor(operation: string, originalError?: Error) {
    super(
      `Database error during ${operation}`,
      500,
      "DATABASE_ERROR",
      process.env.NODE_ENV === "development" ? originalError?.message : undefined
    );
    this.name = "DatabaseError";
  }
}

/**
 * External API Error (OpenAI, Anthropic, etc.)
 */
export class ExternalApiError extends ApiError {
  constructor(service: string, originalError?: Error) {
    super(
      `Error communicating with ${service}`,
      502,
      "EXTERNAL_API_ERROR",
      process.env.NODE_ENV === "development" ? originalError?.message : undefined
    );
    this.name = "ExternalApiError";
  }
}
