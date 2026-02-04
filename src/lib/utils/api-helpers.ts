import { getApiKey } from "@/lib/ai/get-api-key";
import { ApiKeyError } from "@/lib/errors/api-errors";

/**
 * Get provider API key with proper error handling
 * @param provider - AI provider name
 * @param userId - Optional user ID
 * @returns API key
 * @throws ApiKeyError if key not found
 */
export async function getProviderApiKey(
  provider: string,
  userId?: string
): Promise<string> {
  const apiKey = await getApiKey(provider, userId);

  if (!apiKey) {
    throw new ApiKeyError(provider, false);
  }

  return apiKey;
}

/**
 * Execute database operation with error handling
 * @param operation - Database operation function
 * @param context - Context for error logging
 * @returns Result of operation
 */
export async function withDbErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`Database error in ${context}:`, error);
    throw error; // Re-throw for handleApiError to catch
  }
}

/**
 * Paginate results
 * @param page - Page number (1-indexed)
 * @param pageSize - Items per page
 * @returns Prisma skip and take values
 */
export function getPagination(page: number = 1, pageSize: number = 20) {
  const validPage = Math.max(1, page);
  const validPageSize = Math.min(Math.max(1, pageSize), 100); // Max 100 items

  return {
    skip: (validPage - 1) * validPageSize,
    take: validPageSize,
    page: validPage,
    pageSize: validPageSize,
  };
}

/**
 * Parse request body safely
 * @param req - Request object
 * @returns Parsed JSON body
 */
export async function parseRequestBody<T = any>(req: Request): Promise<T> {
  try {
    return await req.json();
  } catch (error) {
    throw new Error("Invalid JSON in request body");
  }
}

/**
 * Create success response with consistent format
 * @param data - Response data
 * @param message - Optional success message
 * @returns Response object
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
) {
  return Response.json(
    {
      success: true,
      ...(message && { message }),
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Sanitize user input to prevent XSS
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove < and >
    .trim();
}

/**
 * Validate file type
 * @param filename - File name
 * @param allowedTypes - Allowed file extensions
 * @returns True if valid
 */
export function validateFileType(
  filename: string,
  allowedTypes: string[]
): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? allowedTypes.includes(ext) : false;
}

/**
 * Validate file size
 * @param size - File size in bytes
 * @param maxSize - Max size in bytes (default 10MB)
 * @returns True if valid
 */
export function validateFileSize(
  size: number,
  maxSize: number = 10 * 1024 * 1024 // 10MB
): boolean {
  return size > 0 && size <= maxSize;
}
