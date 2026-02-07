import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/auth-guard";
import { handleApiError } from "@/lib/errors/error-handler";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/conversations - List user's conversations
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(req.url);
    const archived = searchParams.get("archived") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: authResult.user.id,
        isArchived: archived,
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        agent: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: [
        { isPinned: "desc" },
        { updatedAt: "desc" },
      ],
      take: limit,
    });

    return NextResponse.json({
      success: true,
      conversations,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/conversations - Create new conversation
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();
    const { title, model = "gpt-4o", provider = "OPENAI", agentId } = body;

    const conversation = await prisma.conversation.create({
      data: {
        title: title || "새 대화",
        model,
        provider,
        userId: authResult.user.id,
        agentId: agentId || undefined,
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        conversation,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
