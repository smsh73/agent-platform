import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AuthenticationError, AuthorizationError } from "@/lib/errors/api-errors";
import { handleApiError } from "@/lib/errors/error-handler";

/**
 * Session data returned by auth check
 */
export interface AuthSession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    role?: string;
  };
}

/**
 * Require authentication for API route
 * @param req - Next.js request object
 * @returns Session data if authenticated, error response if not
 */
export async function requireAuth(
  req: NextRequest
): Promise<AuthSession | NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new AuthenticationError("Please sign in to continue");
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role || "USER",
      },
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Require specific role for API route
 * @param req - Next.js request object
 * @param allowedRoles - Array of allowed roles
 * @returns Session data if authorized, error response if not
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: string[]
): Promise<AuthSession | NextResponse> {
  const authResult = await requireAuth(req);

  // If auth check returned an error response, return it
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const userRole = authResult.user.role || "USER";

  if (!allowedRoles.includes(userRole)) {
    return handleApiError(
      new AuthorizationError(
        `This action requires one of the following roles: ${allowedRoles.join(", ")}`
      )
    );
  }

  return authResult;
}

/**
 * Require admin role
 * @param req - Next.js request object
 */
export async function requireAdmin(
  req: NextRequest
): Promise<AuthSession | NextResponse> {
  return requireRole(req, ["ADMIN", "OWNER"]);
}

/**
 * Optional authentication (doesn't fail if not authenticated)
 * @param req - Next.js request object
 * @returns Session data if authenticated, null if not
 */
export async function optionalAuth(
  req: NextRequest
): Promise<AuthSession | null> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role || "USER",
      },
    };
  } catch (error) {
    // Log error but don't throw
    console.error("Optional auth error:", error);
    return null;
  }
}

/**
 * Check if user owns a resource
 * @param userId - User ID
 * @param resourceOwnerId - Resource owner ID
 * @param allowAdmin - Allow admins to access (default: true)
 * @throws AuthorizationError if user doesn't own resource
 */
export function requireOwnership(
  userId: string,
  resourceOwnerId: string,
  userRole?: string,
  allowAdmin: boolean = true
): void {
  const isOwner = userId === resourceOwnerId;
  const isAdmin = allowAdmin && (userRole === "ADMIN" || userRole === "OWNER");

  if (!isOwner && !isAdmin) {
    throw new AuthorizationError("You don't have permission to access this resource");
  }
}
