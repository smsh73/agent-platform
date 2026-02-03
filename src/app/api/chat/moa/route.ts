import { generateText, streamText } from "ai";
import { auth } from "@/lib/auth";
import { getApiKey } from "@/lib/ai/get-api-key";
import { getModelWithKey, getProviderFromModel } from "@/lib/ai/providers";
import {
  AgentResponse,
  AnalysisResult,
  DEFAULT_MOA_CONFIG,
  MOA_PROMPTS,
} from "@/types/mixture-of-agents";

export const maxDuration = 180; // 3분 타임아웃

interface MoARequest {
  messages: { role: string; content: string }[];
  enableSearch?: boolean;
}

// 병렬로 여러 AI 모델 실행
async function runAgentsInParallel(
  prompt: string,
  userId?: string
): Promise<AgentResponse[]> {
  const agents = DEFAULT_MOA_CONFIG.agents;
  const startTime = Date.now();

  const promises = agents.map(async (agent) => {
    const agentStart = Date.now();
    try {
      const apiKey = await getApiKey(agent.provider, userId);
      if (!apiKey) {
        return {
          provider: agent.provider,
          model: agent.model,
          content: `[${agent.provider} API 키가 설정되지 않았습니다]`,
          latency: Date.now() - agentStart,
        } as AgentResponse;
      }

      const model = getModelWithKey(agent.model, apiKey);
      const result = await generateText({
        model,
        prompt,
      });

      return {
        provider: agent.provider,
        model: agent.model,
        content: result.text,
        latency: Date.now() - agentStart,
        tokens: {
          input: result.usage?.inputTokens || 0,
          output: result.usage?.outputTokens || 0,
        },
      } as AgentResponse;
    } catch (error) {
      console.error(`${agent.provider} 에러:`, error);
      return {
        provider: agent.provider,
        model: agent.model,
        content: `[${agent.provider} 오류: ${(error as Error).message}]`,
        latency: Date.now() - agentStart,
      } as AgentResponse;
    }
  });

  return Promise.all(promises);
}

// Perplexity로 최신 정보 검색
async function searchWithPerplexity(
  query: string,
  userId?: string
): Promise<string | null> {
  try {
    const apiKey = await getApiKey("perplexity", userId);
    if (!apiKey) return null;

    const model = getModelWithKey(
      DEFAULT_MOA_CONFIG.searcher.model,
      apiKey
    );

    const result = await generateText({
      model,
      prompt: `다음 질문에 대해 최신 정보를 검색하여 답변해주세요: ${query}`,
    });

    return result.text;
  } catch (error) {
    console.error("Perplexity 검색 오류:", error);
    return null;
  }
}

// 검색이 필요한지 판단
async function needsSearch(
  prompt: string,
  userId?: string
): Promise<boolean> {
  try {
    const apiKey = await getApiKey("openai", userId);
    if (!apiKey) return false;

    const model = getModelWithKey("gpt-4o-mini", apiKey);
    const result = await generateText({
      model,
      system: MOA_PROMPTS.needsSearch,
      prompt,
    });

    return result.text.trim().toUpperCase() === "YES";
  } catch {
    return false;
  }
}

// Orchestrator: 응답 분석
async function analyzeResponses(
  prompt: string,
  responses: AgentResponse[],
  searchResults: string | null,
  userId?: string
): Promise<AnalysisResult> {
  const apiKey = await getApiKey(
    DEFAULT_MOA_CONFIG.orchestrator.provider,
    userId
  );

  if (!apiKey) {
    throw new Error("Orchestrator API 키가 설정되지 않았습니다");
  }

  const model = getModelWithKey(
    DEFAULT_MOA_CONFIG.orchestrator.model,
    apiKey
  );

  const responsesText = responses
    .map(
      (r) => `## ${r.provider.toUpperCase()} (${r.model})
${r.content}`
    )
    .join("\n\n---\n\n");

  const analysisPrompt = `# 사용자 질문
${prompt}

${searchResults ? `# 최신 검색 결과 (Perplexity)
${searchResults}

---

` : ""}# AI 모델 응답들

${responsesText}

---

위 응답들을 분석하고 각 응답의 최고 부분을 선별해주세요.`;

  const result = await generateText({
    model,
    system: MOA_PROMPTS.orchestrator,
    prompt: analysisPrompt,
  });

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("분석 결과 파싱 오류:", e);
  }

  // 기본 분석 결과 반환
  return {
    bestParts: responses.map((r) => ({
      provider: r.provider,
      section: "전체",
      reason: "자동 분석",
      content: r.content.substring(0, 500),
    })),
    rankings: responses.map((r, i) => ({
      provider: r.provider,
      score: 80 - i * 5,
      strengths: ["응답 생성됨"],
      weaknesses: [],
    })),
  };
}

// Narrator: 최종 답변 합성
async function synthesizeFinalAnswer(
  prompt: string,
  analysis: AnalysisResult,
  searchResults: string | null,
  userId?: string
): Promise<string> {
  const apiKey = await getApiKey(
    DEFAULT_MOA_CONFIG.narrator.provider,
    userId
  );

  if (!apiKey) {
    throw new Error("Narrator API 키가 설정되지 않았습니다");
  }

  const model = getModelWithKey(DEFAULT_MOA_CONFIG.narrator.model, apiKey);

  const bestPartsText = analysis.bestParts
    .map(
      (p) => `### ${p.provider} - ${p.section}
**선정 이유**: ${p.reason}
**내용**:
${p.content}`
    )
    .join("\n\n");

  const synthesisPrompt = `# 사용자 질문
${prompt}

${searchResults ? `# 최신 정보 (Perplexity 검색)
${searchResults}

` : ""}# 분석에서 선별된 최고의 파트들

${bestPartsText}

---

위 내용을 바탕으로 완벽한 최종 답변을 작성해주세요.`;

  const result = await generateText({
    model,
    system: MOA_PROMPTS.narrator,
    prompt: synthesisPrompt,
  });

  return result.text;
}

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const session = await auth();
    const body: MoARequest = await req.json();
    const { messages, enableSearch = true } = body;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return Response.json(
        { error: "사용자 메시지가 필요합니다" },
        { status: 400 }
      );
    }

    const userPrompt = lastMessage.content;
    const userId = session?.user?.id;

    // 1. 검색 필요 여부 판단 & 검색 실행
    let searchResults: string | null = null;
    if (enableSearch) {
      const shouldSearch = await needsSearch(userPrompt, userId);
      if (shouldSearch) {
        console.log("🔍 Perplexity 검색 실행...");
        searchResults = await searchWithPerplexity(userPrompt, userId);
      }
    }

    // 2. 모든 에이전트 병렬 실행
    console.log("🤖 에이전트 병렬 실행...");
    const agentResponses = await runAgentsInParallel(userPrompt, userId);

    // 3. Orchestrator: 응답 분석
    console.log("🎯 Orchestrator 분석 중...");
    const analysis = await analyzeResponses(
      userPrompt,
      agentResponses,
      searchResults,
      userId
    );

    // 4. Narrator: 최종 답변 합성
    console.log("✍️ Narrator 합성 중...");
    const finalAnswer = await synthesizeFinalAnswer(
      userPrompt,
      analysis,
      searchResults,
      userId
    );

    const totalLatency = Date.now() - startTime;

    // 결과 반환
    return Response.json({
      finalAnswer,
      agentResponses,
      analysis,
      searchResults,
      totalLatency,
      orchestrator: `${DEFAULT_MOA_CONFIG.orchestrator.provider}/${DEFAULT_MOA_CONFIG.orchestrator.model}`,
      narrator: `${DEFAULT_MOA_CONFIG.narrator.provider}/${DEFAULT_MOA_CONFIG.narrator.model}`,
    });
  } catch (error) {
    console.error("MoA 오류:", error);
    return Response.json(
      { error: (error as Error).message || "Mixture of Agents 실행 중 오류" },
      { status: 500 }
    );
  }
}

// 스트리밍 버전 (진행 상황 표시)
export async function OPTIONS(req: Request) {
  return Response.json({
    config: DEFAULT_MOA_CONFIG,
    prompts: Object.keys(MOA_PROMPTS),
  });
}
