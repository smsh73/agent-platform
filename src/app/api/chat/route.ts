import { streamText } from "ai";
import { getModel, getAllModels, getProviderFromModel, getModelWithKey } from "@/lib/ai/providers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getApiKey } from "@/lib/ai/get-api-key";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    const { messages, model: modelId, conversationId } = await req.json();

    // Get the appropriate model
    const provider = getProviderFromModel(modelId);

    // API 키 가져오기 (사용자 저장 키 또는 환경변수)
    const apiKey = await getApiKey(provider, session?.user?.id);

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: `API 키가 설정되지 않았습니다. 설정 > API 키에서 ${provider.toUpperCase()} API 키를 입력해주세요.`
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // API 키로 모델 생성
    const model = getModelWithKey(modelId, apiKey);

    // Stream the response
    const result = streamText({
      model,
      messages,
      onFinish: async ({ text, usage }) => {
        // 데이터베이스에 저장 (로그인한 경우)
        if (session?.user?.id) {
          try {
            // 대화 저장
            let convId = conversationId;

            if (!convId) {
              // 새 대화 생성
              const conversation = await prisma.conversation.create({
                data: {
                  userId: session.user.id,
                  model: modelId,
                  provider: provider,
                  title: messages[0]?.content?.substring(0, 50) || "새 대화",
                },
              });
              convId = conversation.id;
            }

            // 사용자 메시지 저장 (마지막 사용자 메시지)
            const lastUserMessage = messages.filter((m: { role: string }) => m.role === "user").pop();
            if (lastUserMessage) {
              await prisma.message.create({
                data: {
                  conversationId: convId,
                  role: "user",
                  content: lastUserMessage.content,
                  model: modelId,
                },
              });
            }

            // AI 응답 저장
            await prisma.message.create({
              data: {
                conversationId: convId,
                role: "assistant",
                content: text,
                model: modelId,
                tokens: usage?.totalTokens,
              },
            });

            // 사용량 기록
            await prisma.usageRecord.create({
              data: {
                userId: session.user.id,
                provider: provider,
                model: modelId,
                type: "CHAT",
                inputTokens: usage?.inputTokens || 0,
                outputTokens: usage?.outputTokens || 0,
                totalTokens: usage?.totalTokens || 0,
                cost: calculateCost(modelId, usage?.inputTokens || 0, usage?.outputTokens || 0),
              },
            });
          } catch (dbError) {
            console.error("데이터베이스 저장 오류:", dbError);
          }
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("채팅 API 오류:", error);
    return new Response(
      JSON.stringify({ error: "채팅 요청을 처리하는 중 오류가 발생했습니다" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// 모델별 비용 계산 (센트 단위)
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  // 1M 토큰당 가격 (USD)
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "claude-3-5-sonnet-latest": { input: 3, output: 15 },
    "claude-3-5-haiku-latest": { input: 0.25, output: 1.25 },
    "gemini-1.5-pro": { input: 1.25, output: 5 },
    "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  };

  const price = pricing[model] || { input: 1, output: 2 };

  // 센트로 변환
  const inputCost = (inputTokens / 1000000) * price.input * 100;
  const outputCost = (outputTokens / 1000000) * price.output * 100;

  return inputCost + outputCost;
}

// 사용 가능한 모델 목록
export async function GET() {
  const models = getAllModels();
  return Response.json({ models });
}
