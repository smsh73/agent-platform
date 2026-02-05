import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { requireAuth } from "@/lib/middleware/auth-guard";
import { handleApiError } from "@/lib/errors/error-handler";
import { ApiKeyError } from "@/lib/errors/api-errors";
import { getApiKey } from "@/lib/ai/get-api-key";
import { getModelWithKey } from "@/lib/ai/providers";
import { MARKETPLACE_AGENTS } from "@/types/agents";

export const maxDuration = 60;

/**
 * POST /api/agents/[id]/execute - Execute agent with user input
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

    const { id: agentId } = await params;
    const body = await req.json();
    const { input, conversationHistory = [] } = body;

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "Input is required" },
        { status: 400 }
      );
    }

    // Find agent
    const agent = MARKETPLACE_AGENTS.find((a) => a.id === agentId);
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Get API key for agent's provider
    const apiKey = await getApiKey(agent.provider, authResult.user.id);
    if (!apiKey) {
      throw new ApiKeyError(agent.provider, false);
    }

    // Build messages with agent's system prompt
    const messages: any[] = [
      {
        role: "system",
        content: agent.systemPrompt,
      },
      ...conversationHistory,
      {
        role: "user",
        content: input,
      },
    ];

    // Create model with API key
    const model = getModelWithKey(agent.model, apiKey);

    // Stream the response
    const result = streamText({
      model,
      messages,
      temperature: agent.temperature || 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
