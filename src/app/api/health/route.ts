import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Health check endpoint for container orchestration
 * Returns 200 if the application and database are healthy
 */
export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1 FROM DUAL`;

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
