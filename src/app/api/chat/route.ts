import { streamText } from "ai";
import {
  getModel,
  getAllModels,
  getProviderFromModel,
  getModelWithKey,
} from "@/lib/ai/providers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getApiKey } from "@/lib/ai/get-api-key";
import { ChatRequestSchema } from "@/lib/validation/schemas";
import {
  handleApiError,
  logError,
} from "@/lib/errors/error-handler";
import {
  ApiKeyError,
  DatabaseError,
  ExternalApiError,
} from "@/lib/errors/api-errors";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();

    // Validate request with Zod schema
    const validatedData = ChatRequestSchema.parse(body);
    const { messages, model: modelId, conversationId } = validatedData;

    // Get the appropriate provider
    const provider = getProviderFromModel(modelId);

    // Get API key (user's saved key or environment variable)
    const apiKey = await getApiKey(provider, session?.user?.id);

    if (!apiKey) {
      throw new ApiKeyError(provider, false);
    }

    // Create model with API key
    const model = getModelWithKey(modelId, apiKey);

    // Stream the response
    const result = streamText({
      model,
      messages,
      onFinish: async ({ text, usage }) => {
        // Save to database (if logged in)
        if (session?.user?.id) {
          try {
            await saveConversation({
              userId: session.user.id,
              conversationId,
              messages: validatedData.messages,
              modelId,
              provider,
              text,
              usage: {
                inputTokens: usage?.inputTokens || 0,
                outputTokens: usage?.outputTokens || 0,
                totalTokens: usage?.totalTokens || 0,
              },
            });
          } catch (dbError) {
            // Log but don't throw - conversation completed, DB save failed
            logError("Chat DB save", dbError, {
              userId: session.user.id,
              conversationId,
              modelId,
            });
            // TODO: Add to retry queue or alert admin
          }
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Save conversation to database
 */
async function saveConversation(data: {
  userId: string;
  conversationId?: string;
  messages: Array<{ role: string; content: string }>;
  modelId: string;
  provider: string;
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}): Promise<void> {
  try {
    let convId = data.conversationId;

    // Create new conversation if needed
    if (!convId) {
      const conversation = await prisma.conversation.create({
        data: {
          userId: data.userId,
          model: data.modelId,
          provider: data.provider,
          title:
            data.messages[0]?.content?.substring(0, 50) || "새 대화",
        },
      });
      convId = conversation.id;
    }

    // Save user message (last user message)
    const lastUserMessage = data.messages
      .filter((m) => m.role === "user")
      .pop();

    if (lastUserMessage) {
      await prisma.message.create({
        data: {
          conversationId: convId,
          role: "user",
          content: lastUserMessage.content,
          model: data.modelId,
        },
      });
    }

    // Save AI response
    await prisma.message.create({
      data: {
        conversationId: convId,
        role: "assistant",
        content: data.text,
        model: data.modelId,
        tokens: data.usage.totalTokens,
      },
    });

    // Record usage
    await prisma.usageRecord.create({
      data: {
        userId: data.userId,
        provider: data.provider,
        model: data.modelId,
        type: "CHAT",
        inputTokens: data.usage.inputTokens,
        outputTokens: data.usage.outputTokens,
        totalTokens: data.usage.totalTokens,
        cost: calculateCost(
          data.modelId,
          data.usage.inputTokens,
          data.usage.outputTokens
        ),
      },
    });
  } catch (error) {
    throw new DatabaseError("save conversation", error as Error);
  }
}

/**
 * Calculate cost per model (in cents)
 */
function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Price per 1M tokens (USD)
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "claude-3-5-sonnet-latest": { input: 3, output: 15 },
    "claude-3-5-haiku-latest": { input: 0.25, output: 1.25 },
    "gemini-1.5-pro": { input: 1.25, output: 5 },
    "gemini-1.5-flash": { input: 0.075, output: 0.3 },
    "gemini-2.0-flash-exp": { input: 0.075, output: 0.3 },
  };

  const price = pricing[model] || { input: 1, output: 2 };

  // Convert to cents
  const inputCost = (inputTokens / 1000000) * price.input * 100;
  const outputCost = (outputTokens / 1000000) * price.output * 100;

  return inputCost + outputCost;
}

/**
 * Get available models
 */
export async function GET() {
  try {
    const models = getAllModels();
    return NextResponse.json({ models });
  } catch (error) {
    return handleApiError(error);
  }
}
