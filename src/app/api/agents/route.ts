import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/auth-guard";
import { handleApiError } from "@/lib/errors/error-handler";
import { MARKETPLACE_AGENTS } from "@/types/agents";
import type { Agent } from "@/types/agents";

// In-memory storage for user-installed agents (replace with database in production)
const userAgents: Map<string, Agent[]> = new Map();

/**
 * GET /api/agents - Get user's installed agents
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.user.id;
    const agents = userAgents.get(userId) || [];

    return NextResponse.json({
      success: true,
      agents,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/agents - Install agent from marketplace or create custom agent
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.user.id;
    const body = await req.json();
    const { agentId, type = "install" } = body;

    if (type === "install") {
      // Install from marketplace
      const marketplaceAgent = MARKETPLACE_AGENTS.find((a) => a.id === agentId);
      if (!marketplaceAgent) {
        return NextResponse.json(
          { error: "Agent not found in marketplace" },
          { status: 404 }
        );
      }

      // Check if already installed
      const existing = userAgents.get(userId) || [];
      if (existing.some((a) => a.id === agentId)) {
        return NextResponse.json(
          { error: "Agent already installed" },
          { status: 400 }
        );
      }

      // Create user agent from marketplace agent
      const userAgent: Agent = {
        ...marketplaceAgent,
        userId,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userAgents.set(userId, [...existing, userAgent]);

      // Update downloads count (in real app, update database)
      const marketplaceAgentIndex = MARKETPLACE_AGENTS.findIndex(
        (a) => a.id === agentId
      );
      if (marketplaceAgentIndex !== -1) {
        MARKETPLACE_AGENTS[marketplaceAgentIndex].downloads += 1;
      }

      return NextResponse.json({
        success: true,
        message: `${userAgent.name} 에이전트가 설치되었습니다`,
        agent: userAgent,
      }, { status: 201 });
    }

    // Create custom agent (future feature)
    return NextResponse.json(
      { error: "Custom agent creation not yet implemented" },
      { status: 501 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/agents - Uninstall agent
 */
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.user.id;
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("id");

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    const existing = userAgents.get(userId) || [];
    const updated = existing.filter((a) => a.id !== agentId);

    if (existing.length === updated.length) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    userAgents.set(userId, updated);

    return NextResponse.json({
      success: true,
      message: "에이전트가 제거되었습니다",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
