import { generateText } from "ai";
import { auth } from "@/lib/auth";
import { getApiKey } from "@/lib/ai/get-api-key";
import { getModelWithKey } from "@/lib/ai/providers";
import { validatePrompt } from "@/lib/security/prompt-validator";

export const maxDuration = 300; // 5분 타임아웃

interface ResearchRequest {
  query: string;
  depth: "quick" | "standard" | "deep";
}

// SSE 스트림 헬퍼
function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });

  const sendProgress = (data: object) => {
    controller.enqueue(
      encoder.encode(`event: progress\ndata: ${JSON.stringify(data)}\n\n`)
    );
  };

  const sendArtifact = (content: string) => {
    // 아티팩트 전송
    controller.enqueue(
      encoder.encode(`event: artifact\ndata: ${JSON.stringify({ content })}\n\n`)
    );
  };

  const close = () => {
    controller.close();
  };

  return { stream, sendProgress, sendArtifact, close };
}

// Step 1: Perplexity - 1차 자료 수집
async function perplexityDataCollection(
  query: string,
  depth: string,
  userId?: string
): Promise<string[]> {
  const apiKey = await getApiKey("perplexity", userId);

  const queryCount = depth === "quick" ? 2 : depth === "standard" ? 4 : 6;
  const queries = [
    `${query} - 최신 동향과 트렌드`,
    `${query} - 통계 데이터와 수치`,
    depth !== "quick" ? `${query} - 실제 사례와 예시` : null,
    depth !== "quick" ? `${query} - 전문가 의견과 분석` : null,
    depth === "deep" ? `${query} - 미래 전망과 예측` : null,
    depth === "deep" ? `${query} - 글로벌 비교 분석` : null,
  ].filter(Boolean).slice(0, queryCount) as string[];

  if (!apiKey) {
    console.log("Perplexity API 키 없음");
    return queries.map(() => "");
  }

  const results: string[] = [];

  for (const q of queries) {
    try {
      const model = getModelWithKey("llama-3.1-sonar-large-128k-online", apiKey);
      const result = await generateText({
        model,
        prompt: `다음 주제에 대해 최신 정보를 검색하여 상세히 설명해주세요:

"${q}"

포함할 내용:
- 핵심 개념과 정의
- 최신 통계와 수치 (출처 명시)
- 구체적인 사례
- 전문가 의견
- 관련 트렌드

마크다운 형식으로 작성해주세요.`,
      });
      results.push(result.text);
    } catch (error) {
      console.error("Perplexity 검색 오류:", error);
      results.push("");
    }
  }

  return results;
}

// Step 2: OpenAI - 자료 검증 및 리서치 개요 생성
async function openaiVerifyAndOutline(
  query: string,
  perplexityData: string[],
  depth: string,
  userId?: string
): Promise<{ outline: object; verifiedData: string }> {
  const apiKey = await getApiKey("openai", userId);
  if (!apiKey) throw new Error("OpenAI API 키가 필요합니다");

  const model = getModelWithKey("gpt-4o", apiKey);

  const combinedData = perplexityData
    .filter((d) => d)
    .map((d, i) => `## 자료 ${i + 1}\n${d}`)
    .join("\n\n---\n\n");

  const sectionCount = depth === "quick" ? 3 : depth === "standard" ? 5 : 7;

  const result = await generateText({
    model,
    system: `당신은 리서치 검증 전문가입니다. 수집된 자료를 검증하고 구조화된 개요를 생성합니다.
JSON 형식으로만 응답하세요.`,
    prompt: `## 연구 주제
${query}

## 수집된 자료
${combinedData}

위 자료를 분석하고 다음 JSON 형식으로 출력하세요:

{
  "outline": {
    "title": "보고서 제목",
    "summary": "3줄 요약",
    "sections": [
      {"title": "섹션 제목", "keyPoints": ["포인트1", "포인트2"]},
      ...${sectionCount}개 섹션
    ],
    "keywords": ["핵심키워드1", "핵심키워드2", "핵심키워드3"]
  },
  "verifiedData": "검증되고 정리된 핵심 자료 (마크다운 형식)"
}

verifiedData는 중복 제거, 사실 확인, 핵심 내용 추출한 결과를 포함하세요.`,
  });

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("개요 파싱 오류:", e);
  }

  return {
    outline: {
      title: query,
      summary: "분석 중...",
      sections: [],
      keywords: [],
    },
    verifiedData: combinedData,
  };
}

// Step 3: Gemini - 크롤링 및 구글 검색
async function geminiCrawlAndSearch(
  query: string,
  outline: any,
  userId?: string
): Promise<string> {
  const apiKey = await getApiKey("google", userId);

  if (!apiKey) {
    console.log("Gemini API 키 없음");
    return "";
  }

  try {
    const model = getModelWithKey("gemini-1.5-pro", apiKey);

    // 각 섹션별 추가 검색
    const searchQueries = outline.sections
      .slice(0, 3)
      .map((s: any) => `${query} ${s.title}`)
      .join(", ");

    const result = await generateText({
      model,
      prompt: `다음 주제에 대해 추가 정보를 검색하고 분석해주세요:

주제: ${query}

검색할 내용:
${searchQueries}

다음을 포함해주세요:
- 웹에서 찾을 수 있는 최신 정보
- 관련 뉴스나 발표
- 추가 통계와 데이터
- 구체적인 사례 연구

마크다운 형식으로 작성해주세요.`,
    });

    return result.text;
  } catch (error) {
    console.error("Gemini 검색 오류:", error);
    return "";
  }
}

// Step 4: OpenAI - 자료 검증 및 보고서 초안 작성
async function openaiDraftReport(
  query: string,
  outline: any,
  verifiedData: string,
  geminiData: string,
  depth: string,
  userId?: string
): Promise<string> {
  const apiKey = await getApiKey("openai", userId);
  if (!apiKey) throw new Error("OpenAI API 키가 필요합니다");

  const model = getModelWithKey("gpt-4o", apiKey);

  const lengthGuide = {
    quick: "1000-1500자",
    standard: "2500-3500자",
    deep: "5000자 이상",
  };

  const result = await generateText({
    model,
    system: `당신은 전문 리서치 작성가입니다. 수집된 자료를 바탕으로 체계적인 보고서 초안을 작성합니다.

## 보고서 형식
반드시 마크다운 형식으로 작성하세요:
- # 제목
- ## 섹션 제목
- ### 소제목
- **강조**
- 목록: - 또는 1.
- > 인용문
- 통계는 구체적 수치 포함`,
    prompt: `## 연구 주제
${query}

## 보고서 개요
제목: ${outline.title}
요약: ${outline.summary}
섹션: ${outline.sections.map((s: any) => s.title).join(", ")}
키워드: ${outline.keywords.join(", ")}

## 검증된 1차 자료
${verifiedData}

## 추가 검색 자료 (Gemini)
${geminiData}

---

위 자료를 바탕으로 ${lengthGuide[depth as keyof typeof lengthGuide]} 분량의 보고서 초안을 작성하세요.

구조:
${outline.sections.map((s: any, i: number) => `${i + 1}. ${s.title}\n   - ${s.keyPoints.join("\n   - ")}`).join("\n")}

초안만 작성하세요. 최종 편집은 다음 단계에서 진행됩니다.`,
  });

  return result.text;
}

// Step 5: Claude - 최종 Narrative 역할 (리서치 보고서 완성)
async function claudeNarrative(
  query: string,
  draft: string,
  outline: any,
  userId?: string
): Promise<string> {
  const apiKey = await getApiKey("anthropic", userId);
  if (!apiKey) {
    console.log("Claude API 키 없음, 초안 그대로 반환");
    return draft;
  }

  try {
    const model = getModelWithKey("claude-sonnet-4-5-20250929", apiKey);

    const result = await generateText({
      model,
      system: `당신은 최고의 리서치 편집자이자 스토리텔러입니다.
보고서 초안을 읽기 쉽고 설득력 있는 최종 보고서로 다듬습니다.

## 역할
1. 자연스러운 흐름과 논리 구성
2. 명확하고 간결한 문장으로 개선
3. 핵심 인사이트 강조
4. 독자 관점에서 가독성 향상
5. 마크다운 형식 최적화`,
      prompt: `## 연구 주제
${query}

## 보고서 개요
${outline.title}
${outline.summary}

## 보고서 초안
${draft}

---

위 초안을 최종 보고서로 다듬어주세요.

개선 사항:
1. 도입부를 더 흥미롭게
2. 각 섹션 간 자연스러운 연결
3. 핵심 메시지 명확화
4. 결론에서 actionable insights 제공
5. 마크다운 형식 완벽 적용 (제목, 강조, 목록, 인용 등)

최종 보고서만 출력하세요.`,
    });

    return result.text;
  } catch (error) {
    console.error("Claude 편집 오류:", error);
    return draft;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  try {
    const body: ResearchRequest = await req.json();
    const { query, depth = "standard" } = body;

    if (!query?.trim()) {
      return Response.json({ error: "검색 질문을 입력해주세요" }, { status: 400 });
    }

    // Validate query for prompt injection
    let sanitizedQuery: string;
    try {
      sanitizedQuery = validatePrompt(query, { strict: true });
    } catch (error) {
      return Response.json(
        { error: "Your query contains patterns that could be harmful. Please rephrase your request." },
        { status: 400 }
      );
    }

    const { stream, sendProgress, sendArtifact, close } = createSSEStream();

    // 비동기 협업 워크플로우 실행
    (async () => {
      try {
        // === Step 1: Perplexity - 1차 자료 수집 ===
        sendProgress({
          stage: "perplexity",
          step: 1,
          totalSteps: 5,
          agent: "Perplexity",
          message: "🔍 Perplexity로 1차 자료 수집 중...",
          progress: 5,
        });

        const queryCount = depth === "quick" ? 2 : depth === "standard" ? 4 : 6;
        const perplexityData = await perplexityDataCollection(sanitizedQuery, depth, userId);

        const successCount = perplexityData.filter((d) => d).length;
        sendProgress({
          stage: "perplexity",
          step: 1,
          totalSteps: 5,
          agent: "Perplexity",
          message: `✅ Perplexity 자료 수집 완료\n${successCount}/${queryCount}개 쿼리 검색 완료`,
          progress: 20,
        });

        // === Step 2: OpenAI - 자료 검증 및 개요 생성 ===
        sendProgress({
          stage: "openai-verify",
          step: 2,
          totalSteps: 5,
          agent: "GPT-4o",
          message: "🔬 OpenAI로 자료 검증 및 리서치 개요 생성 중...",
          progress: 25,
        });

        const { outline, verifiedData } = await openaiVerifyAndOutline(
          sanitizedQuery,
          perplexityData,
          depth,
          userId
        );

        sendProgress({
          stage: "openai-verify",
          step: 2,
          totalSteps: 5,
          agent: "GPT-4o",
          message: `✅ OpenAI 검증 및 개요 생성 완료\n- 섹션: ${
            (outline as any).sections?.length || 0
          }개\n- 키워드: ${(outline as any).keywords?.join(", ") || ""}`,
          progress: 40,
          outline,
        });

        // === Step 3: Gemini - 크롤링 및 구글 검색 ===
        sendProgress({
          stage: "gemini",
          step: 3,
          totalSteps: 5,
          agent: "Gemini 1.5 Pro",
          message: "🌐 Gemini로 추가 크롤링 및 구글 검색 중...",
          progress: 45,
        });

        const geminiData = await geminiCrawlAndSearch(sanitizedQuery, outline, userId);

        sendProgress({
          stage: "gemini",
          step: 3,
          totalSteps: 5,
          agent: "Gemini 1.5 Pro",
          message: `✅ Gemini 검색 완료\n추가 자료 ${geminiData ? "수집 성공" : "없음"}`,
          progress: 60,
        });

        // === Step 4: OpenAI - 보고서 초안 작성 ===
        sendProgress({
          stage: "openai-draft",
          step: 4,
          totalSteps: 5,
          agent: "GPT-4o",
          message: "📝 OpenAI로 보고서 초안 작성 중...",
          progress: 65,
        });

        const draft = await openaiDraftReport(
          sanitizedQuery,
          outline,
          verifiedData,
          geminiData,
          depth,
          userId
        );

        sendProgress({
          stage: "openai-draft",
          step: 4,
          totalSteps: 5,
          agent: "GPT-4o",
          message: `✅ OpenAI 초안 작성 완료\n${draft.length}자 보고서 생성`,
          progress: 80,
        });

        // 초안을 아티팩트로 미리 전송
        sendArtifact(draft);

        // === Step 5: Claude - 최종 Narrative ===
        sendProgress({
          stage: "claude",
          step: 5,
          totalSteps: 5,
          agent: "Claude 3.5 Sonnet",
          message: "✨ Claude로 최종 보고서 편집 및 Narrative 작성 중...",
          progress: 85,
        });

        const finalReport = await claudeNarrative(sanitizedQuery, draft, outline, userId);

        sendProgress({
          stage: "complete",
          step: 5,
          totalSteps: 5,
          agent: "Complete",
          message: "✅ 리서치 완료!\n5개 AI 협업으로 보고서 생성 완료",
          progress: 100,
        });

        // 최종 보고서를 아티팩트로 전송
        sendArtifact(finalReport);
      } catch (error) {
        console.error("리서치 파이프라인 오류:", error);
        sendProgress({
          stage: "error",
          message: `❌ 오류: ${(error as Error).message}`,
          progress: 0,
        });
      } finally {
        close();
      }
    })();

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("리서치 API 오류:", error);
    return Response.json({ error: "리서치 중 오류가 발생했습니다" }, { status: 500 });
  }
}
