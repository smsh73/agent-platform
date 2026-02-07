import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/auth-guard";
import { handleApiError } from "@/lib/errors/error-handler";
import { NotFoundError, ForbiddenError } from "@/lib/errors/api-errors";
import { prisma } from "@/lib/db/prisma";

/**
 * POST /api/conversations/[id]/messages - Add message to conversation
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: conversationId } = await params;
    const body = await req.json();
    const { role, content, model, tokens, toolCalls, toolResults } = body;

    // Verify conversation exists and user owns it
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });

    if (!conversation) {
      throw new NotFoundError("Conversation");
    }

    if (conversation.userId !== authResult.user.id) {
      throw new ForbiddenError("add messages to this conversation");
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        model: model || undefined,
        tokens: tokens || undefined,
        toolCalls: toolCalls ? JSON.stringify(toolCalls) : undefined,
        toolResults: toolResults ? JSON.stringify(toolResults) : undefined,
      },
    });

    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(
      {
        success: true,
        message,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/conversations/[id]/messages - Get messages for conversation
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

    const { id: conversationId } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Verify conversation exists and user owns it
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });

    if (!conversation) {
      throw new NotFoundError("Conversation");
    }

    if (conversation.userId !== authResult.user.id) {
      throw new ForbiddenError("access this conversation");
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      skip: offset,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
