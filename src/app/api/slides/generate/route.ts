import { generateText } from "ai";
import { auth } from "@/lib/auth";
import { getApiKey } from "@/lib/ai/get-api-key";
import { getModelWithKey } from "@/lib/ai/providers";
import {
  Slide,
  SlideElement,
  SlidePlan,
  PresentationOutline,
  Presentation,
  PresentationTheme,
  SlideLayout,
  SlideBackground,
  DEFAULT_THEMES,
  LAYOUT_TEMPLATES,
  SLIDE_DIMENSIONS,
} from "@/types/slides";

export const maxDuration = 300; // 5분 타임아웃

interface GenerateRequest {
  prompt: string;
  slideCount?: number;
  themeId?: string;
}

// Perplexity로 주제 검색
async function searchWithPerplexity(
  query: string,
  userId?: string
): Promise<string | null> {
  try {
    const apiKey = await getApiKey("perplexity", userId);
    if (!apiKey) {
      console.log("Perplexity API 키 없음, 검색 생략");
      return null;
    }

    const model = getModelWithKey("llama-3.1-sonar-large-128k-online", apiKey);
    const result = await generateText({
      model,
      prompt: `다음 주제에 대해 상세히 검색하고 프레젠테이션에 사용할 수 있는 정보를 제공해주세요:

주제: ${query}

다음 정보를 포함해주세요:
1. 주제 개요 및 정의
2. 주요 통계 및 수치 (최신 데이터)
3. 핵심 트렌드 및 동향
4. 주요 사례 및 예시
5. 전문가 의견 또는 인용문
6. 미래 전망

마크다운 형식으로 정리해주세요.`,
    });

    return result.text;
  } catch (error) {
    console.error("Perplexity 검색 오류:", error);
    return null;
  }
}

// 슬라이드별 자료 검색
async function searchForSlide(
  slideTitle: string,
  context: string,
  userId?: string
): Promise<string | null> {
  try {
    const apiKey = await getApiKey("perplexity", userId);
    if (!apiKey) return null;

    const model = getModelWithKey("llama-3.1-sonar-large-128k-online", apiKey);
    const result = await generateText({
      model,
      prompt: `프레젠테이션 슬라이드를 위한 자료를 검색해주세요.

전체 맥락: ${context}
슬라이드 제목: ${slideTitle}

이 슬라이드에 들어갈 내용을 위한 구체적인 정보, 통계, 사례를 찾아주세요.
간결하고 핵심적인 내용만 제공해주세요.`,
    });

    return result.text;
  } catch (error) {
    console.error("슬라이드 검색 오류:", error);
    return null;
  }
}

// 1단계: 의도 분석 및 개요 생성
async function analyzeAndCreateOutline(
  prompt: string,
  researchData: string | null,
  userId?: string
): Promise<PresentationOutline> {
  const apiKey = await getApiKey("openai", userId);
  if (!apiKey) throw new Error("OpenAI API 키가 필요합니다");

  const model = getModelWithKey("gpt-4o", apiKey);

  const systemPrompt = `당신은 프레젠테이션 기획 전문가입니다. 사용자의 요청을 분석하여 프레젠테이션 개요를 생성합니다.

## 출력 형식 (JSON)
{
  "topic": "프레젠테이션 주제",
  "purpose": "프레젠테이션 목적",
  "targetAudience": "대상 청중",
  "keyMessages": ["핵심 메시지 1", "핵심 메시지 2", "핵심 메시지 3"],
  "structure": {
    "introduction": ["도입부 포인트 1", "도입부 포인트 2"],
    "mainSections": [
      {
        "title": "섹션 제목",
        "points": ["포인트 1", "포인트 2", "포인트 3"]
      }
    ],
    "conclusion": ["결론 포인트 1", "결론 포인트 2"]
  }
}`;

  const userPrompt = `## 사용자 요청
${prompt}

${researchData ? `## 검색된 자료
${researchData}` : ""}

위 내용을 바탕으로 전문적인 프레젠테이션 개요를 JSON 형식으로 생성해주세요.
mainSections는 4-6개의 섹션으로 구성해주세요.`;

  const result = await generateText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
  });

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("개요 파싱 오류:", e);
  }

  // 기본 개요 반환
  return {
    topic: prompt,
    purpose: "정보 전달",
    targetAudience: "일반 청중",
    keyMessages: ["핵심 메시지"],
    structure: {
      introduction: ["소개"],
      mainSections: [{ title: "본론", points: ["내용"] }],
      conclusion: ["결론"],
    },
  };
}

// 2단계: 슬라이드 계획 생성 (20장)
async function createSlidePlans(
  outline: PresentationOutline,
  slideCount: number,
  userId?: string
): Promise<SlidePlan[]> {
  const apiKey = await getApiKey("openai", userId);
  if (!apiKey) throw new Error("OpenAI API 키가 필요합니다");

  const model = getModelWithKey("gpt-4o", apiKey);

  const systemPrompt = `당신은 프레젠테이션 슬라이드 구성 전문가입니다.
개요를 바탕으로 ${slideCount}장의 슬라이드 계획을 생성합니다.

## 사용 가능한 레이아웃
- title: 타이틀 슬라이드 (첫 번째 슬라이드)
- section: 섹션 구분 슬라이드
- title-content: 제목 + 본문 (가장 일반적)
- title-two-column: 2열 레이아웃 (비교, 대조)
- title-image-left: 왼쪽 이미지 + 오른쪽 텍스트
- title-image-right: 왼쪽 텍스트 + 오른쪽 이미지
- quote: 인용문 슬라이드
- comparison: 비교 슬라이드
- timeline: 타임라인/연혁
- stats: 통계/숫자 강조

## 출력 형식 (JSON 배열)
[
  {
    "slideNumber": 1,
    "title": "슬라이드 제목",
    "layout": "title",
    "contentPlan": "이 슬라이드에 들어갈 내용 설명",
    "researchQuery": "추가 검색이 필요하면 검색 쿼리 (선택)"
  }
]`;

  const result = await generateText({
    model,
    system: systemPrompt,
    prompt: `## 프레젠테이션 개요
주제: ${outline.topic}
목적: ${outline.purpose}
대상: ${outline.targetAudience}
핵심 메시지: ${outline.keyMessages.join(", ")}

도입부: ${outline.structure.introduction.join(", ")}
본론 섹션: ${outline.structure.mainSections.map((s) => `${s.title}: ${s.points.join(", ")}`).join(" | ")}
결론: ${outline.structure.conclusion.join(", ")}

위 개요를 바탕으로 정확히 ${slideCount}장의 슬라이드 계획을 JSON 배열로 생성해주세요.
1번은 타이틀, 마지막은 감사/Q&A 슬라이드로 구성해주세요.`,
  });

  try {
    const jsonMatch = result.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("슬라이드 계획 파싱 오류:", e);
  }

  // 기본 계획 반환
  return Array.from({ length: slideCount }, (_, i) => ({
    slideNumber: i + 1,
    title: i === 0 ? outline.topic : `슬라이드 ${i + 1}`,
    layout: (i === 0 ? "title" : "title-content") as SlideLayout,
    contentPlan: "내용 생성 예정",
  }));
}

// 3단계: 슬라이드 콘텐츠 생성
async function generateSlideContent(
  plan: SlidePlan,
  outline: PresentationOutline,
  research: string | null,
  theme: PresentationTheme,
  userId?: string
): Promise<Slide> {
  const apiKey = await getApiKey("openai", userId);
  if (!apiKey) throw new Error("OpenAI API 키가 필요합니다");

  const model = getModelWithKey("gpt-4o", apiKey);

  const layoutTemplate = LAYOUT_TEMPLATES[plan.layout];

  const systemPrompt = `당신은 프레젠테이션 콘텐츠 작성 전문가입니다.
슬라이드 규격: ${SLIDE_DIMENSIONS.width}x${SLIDE_DIMENSIONS.height}px (16:9)
레이아웃: ${plan.layout} - ${layoutTemplate.description}

## 출력 형식 (JSON)
{
  "title": "슬라이드 제목",
  "subtitle": "부제목 (선택)",
  "elements": [
    {
      "type": "heading|subheading|text|list|quote",
      "content": "실제 내용 (리스트는 줄바꿈으로 구분)"
    }
  ],
  "notes": "발표자 노트"
}

## 콘텐츠 작성 가이드
- 제목: 간결하고 임팩트 있게 (20자 이내)
- 본문: 핵심만 간결하게, 불릿 포인트 활용
- 리스트: 3-5개 항목, 각 항목 1-2줄
- 숫자/통계: 가능한 구체적 수치 포함
- 인용문: 출처 명시`;

  const result = await generateText({
    model,
    system: systemPrompt,
    prompt: `## 슬라이드 정보
번호: ${plan.slideNumber}
제목: ${plan.title}
레이아웃: ${plan.layout}
계획: ${plan.contentPlan}

## 전체 맥락
주제: ${outline.topic}
목적: ${outline.purpose}

${research ? `## 검색된 자료\n${research}` : ""}

위 정보를 바탕으로 슬라이드 콘텐츠를 JSON 형식으로 생성해주세요.
프로페셔널하고 임팩트 있는 내용을 작성해주세요.`,
  });

  let content: {
    title: string;
    subtitle?: string;
    elements: { type: string; content: string }[];
    notes?: string;
  };

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("JSON 파싱 실패");
    }
  } catch (e) {
    content = {
      title: plan.title,
      elements: [{ type: "text", content: plan.contentPlan }],
    };
  }

  // 요소 생성
  const elements: SlideElement[] = [];
  const templateElements = layoutTemplate.defaultElements;

  // 제목 요소
  const headingTemplate = templateElements.find((e) => e.type === "heading");
  if (headingTemplate) {
    elements.push({
      id: crypto.randomUUID(),
      type: "heading",
      content: content.title,
      style: {
        position: headingTemplate.style?.position || { x: 60, y: 40 },
        size: headingTemplate.style?.size || { width: 1160, height: 80 },
        fontSize: headingTemplate.style?.fontSize || theme.styles.headingSize,
        fontWeight: "bold",
        color: theme.colors.text,
        textAlign: headingTemplate.style?.textAlign || "left",
      },
    });
  }

  // 부제목 (있으면)
  if (content.subtitle) {
    const subheadingTemplate = templateElements.find((e) => e.type === "subheading");
    elements.push({
      id: crypto.randomUUID(),
      type: "subheading",
      content: content.subtitle,
      style: {
        position: subheadingTemplate?.style?.position || { x: 60, y: 130 },
        size: subheadingTemplate?.style?.size || { width: 1160, height: 50 },
        fontSize: subheadingTemplate?.style?.fontSize || theme.styles.subheadingSize,
        color: theme.colors.muted,
        textAlign: subheadingTemplate?.style?.textAlign || "left",
      },
    });
  }

  // 콘텐츠 요소들
  let yOffset = content.subtitle ? 200 : 140;
  for (const elem of content.elements) {
    const textTemplate = templateElements.find(
      (e) => e.type === "text" || e.type === "list"
    );

    elements.push({
      id: crypto.randomUUID(),
      type: elem.type as SlideElement["type"],
      content: elem.content,
      style: {
        position: textTemplate?.style?.position || { x: 60, y: yOffset },
        size: textTemplate?.style?.size || { width: 1160, height: 480 },
        fontSize: theme.styles.bodySize,
        color: theme.colors.text,
        textAlign: "left",
      },
    });
    yOffset += 200;
  }

  // 배경 설정
  const background: SlideBackground =
    plan.layout === "title" || plan.layout === "section"
      ? {
          type: "gradient",
          gradient: {
            from: theme.colors.primary,
            to: theme.colors.secondary,
            direction: "to-br",
          },
        }
      : {
          type: "solid",
          color: theme.colors.background,
        };

  return {
    id: crypto.randomUUID(),
    slideNumber: plan.slideNumber,
    title: content.title,
    subtitle: content.subtitle,
    layout: plan.layout,
    elements,
    background,
    notes: content.notes,
    research: research || undefined,
  };
}

// 스트리밍 응답을 위한 인코더
function createProgressStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });

  const sendProgress = (data: object) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  const close = () => {
    controller.close();
  };

  return { stream, sendProgress, close };
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  try {
    const body: GenerateRequest = await req.json();
    const { prompt, slideCount = 20, themeId = "modern-dark" } = body;

    if (!prompt) {
      return Response.json({ error: "프롬프트가 필요합니다" }, { status: 400 });
    }

    // 테마 선택
    const theme = DEFAULT_THEMES.find((t) => t.id === themeId) || DEFAULT_THEMES[0];

    // 스트리밍 응답 설정
    const { stream, sendProgress, close } = createProgressStream();

    // 비동기 파이프라인 실행
    (async () => {
      try {
        // 1단계: 의도 분석
        sendProgress({
          stage: "analyzing",
          message: "프롬프트 의도 분석 중...",
          progress: 5,
        });

        // 2단계: Perplexity로 주제 검색
        sendProgress({
          stage: "researching-topic",
          message: "Perplexity로 주제 검색 중...",
          progress: 10,
        });

        const topicResearch = await searchWithPerplexity(prompt, userId);

        // 3단계: 개요 생성
        sendProgress({
          stage: "creating-outline",
          message: "프레젠테이션 개요 생성 중...",
          progress: 20,
        });

        const outline = await analyzeAndCreateOutline(prompt, topicResearch, userId);

        sendProgress({
          stage: "creating-outline",
          message: `개요 생성 완료: ${outline.structure.mainSections.length}개 섹션`,
          progress: 30,
          outline,
        });

        // 4단계: 슬라이드 계획 생성
        sendProgress({
          stage: "planning-slides",
          message: `${slideCount}장 슬라이드 계획 수립 중...`,
          progress: 35,
        });

        const slidePlans = await createSlidePlans(outline, slideCount, userId);

        sendProgress({
          stage: "planning-slides",
          message: `${slidePlans.length}장 슬라이드 계획 완료`,
          progress: 40,
          plans: slidePlans.map((p) => ({ number: p.slideNumber, title: p.title })),
        });

        // 5단계: 슬라이드별 검색 및 콘텐츠 생성
        const slides: Slide[] = [];
        const totalSlides = slidePlans.length;

        for (let i = 0; i < slidePlans.length; i++) {
          const plan = slidePlans[i];
          const baseProgress = 40 + (i / totalSlides) * 55;

          // 검색이 필요한 슬라이드만 검색
          let slideResearch: string | null = null;
          if (plan.researchQuery) {
            sendProgress({
              stage: "researching-slides",
              currentSlide: i + 1,
              totalSlides,
              message: `슬라이드 ${i + 1}/${totalSlides} 자료 검색 중...`,
              progress: Math.round(baseProgress),
            });

            slideResearch = await searchForSlide(
              plan.researchQuery,
              outline.topic,
              userId
            );
          }

          // 콘텐츠 생성
          sendProgress({
            stage: "generating-content",
            currentSlide: i + 1,
            totalSlides,
            message: `슬라이드 ${i + 1}/${totalSlides}: "${plan.title}" 생성 중...`,
            progress: Math.round(baseProgress + 2),
          });

          const slide = await generateSlideContent(
            plan,
            outline,
            slideResearch || topicResearch,
            theme,
            userId
          );

          slides.push(slide);

          sendProgress({
            stage: "generating-content",
            currentSlide: i + 1,
            totalSlides,
            message: `슬라이드 ${i + 1}/${totalSlides} 완료`,
            progress: Math.round(baseProgress + 4),
            slide: {
              number: slide.slideNumber,
              title: slide.title,
              layout: slide.layout,
            },
          });
        }

        // 최종 프레젠테이션 생성
        const presentation: Presentation = {
          id: crypto.randomUUID(),
          title: outline.topic,
          description: outline.purpose,
          theme,
          slides,
          outline,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // 완료
        sendProgress({
          stage: "complete",
          message: `${slides.length}장 프레젠테이션 생성 완료!`,
          progress: 100,
          presentation,
        });
      } catch (error) {
        sendProgress({
          stage: "error",
          message: (error as Error).message,
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
    console.error("슬라이드 생성 오류:", error);
    return Response.json(
      { error: (error as Error).message || "슬라이드 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
