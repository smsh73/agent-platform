import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/auth-guard";
import { handleApiError } from "@/lib/errors/error-handler";
import { NotFoundError, ForbiddenError } from "@/lib/errors/api-errors";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/conversations/[id] - Get conversation with messages
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        agent: {
          select: {
            id: true,
            name: true,
            icon: true,
            systemPrompt: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError("Conversation");
    }

    if (conversation.userId !== authResult.user.id) {
      throw new ForbiddenError("access this conversation");
    }

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/conversations/[id] - Update conversation
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const body = await req.json();
    const { title, isArchived, isPinned } = body;

    // Verify ownership
    const existing = await prisma.conversation.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      throw new NotFoundError("Conversation");
    }

    if (existing.userId !== authResult.user.id) {
      throw new ForbiddenError("update this conversation");
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(isArchived !== undefined && { isArchived }),
        ...(isPinned !== undefined && { isPinned }),
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

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/conversations/[id] - Delete conversation
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.conversation.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      throw new NotFoundError("Conversation");
    }

    if (existing.userId !== authResult.user.id) {
      throw new ForbiddenError("delete this conversation");
    }

    await prisma.conversation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
