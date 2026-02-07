import { Workflow } from "./types";

/**
 * 예제 워크플로우 모음
 */
export const EXAMPLE_WORKFLOWS: Record<string, Workflow> = {
  // 1. 간단한 AI 응답 워크플로우
  "simple-ai": {
    id: "example-simple-ai",
    name: "간단한 AI 응답",
    description: "트리거 → AI 모델 → 출력의 기본 워크플로우",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        name: "시작",
        position: { x: 100, y: 100 },
        config: {
          type: "manual",
        },
      },
      {
        id: "llm-1",
        type: "llm",
        name: "AI 응답 생성",
        position: { x: 400, y: 100 },
        config: {
          model: "gpt-4o",
          provider: "openai",
          systemPrompt: "당신은 친절한 AI 어시스턴트입니다. 사용자의 질문에 명확하고 간결하게 답변하세요.",
          temperature: 0.7,
          inputVariable: "trigger.input",
          outputVariable: "llm_response",
        },
      },
      {
        id: "output-1",
        type: "output",
        name: "결과 출력",
        position: { x: 700, y: 100 },
        config: {
          variable: "llm_response",
          format: "text",
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "trigger-1",
        target: "llm-1",
      },
      {
        id: "e2-3",
        source: "llm-1",
        target: "output-1",
      },
    ],
    variables: {
      trigger: {
        input: "인공지능이란 무엇인가요?",
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // 2. 조건 분기 워크플로우
  "conditional-branch": {
    id: "example-conditional",
    name: "조건 분기 처리",
    description: "입력에 따라 다른 AI 모델로 분기",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        name: "시작",
        position: { x: 100, y: 250 },
        config: {
          type: "manual",
        },
      },
      {
        id: "condition-1",
        type: "condition",
        name: "질문 유형 판단",
        position: { x: 350, y: 250 },
        config: {
          conditions: [
            {
              variable: "trigger.type",
              operator: "equals",
              value: "technical",
              outputHandle: "true",
            },
          ],
          defaultHandle: "false",
        },
      },
      {
        id: "llm-1",
        type: "llm",
        name: "기술 전문 AI",
        position: { x: 600, y: 100 },
        config: {
          model: "gpt-4o",
          provider: "openai",
          systemPrompt: "당신은 기술 전문가입니다. 기술적인 질문에 전문적으로 답변하세요.",
          temperature: 0.5,
          inputVariable: "trigger.input",
          outputVariable: "technical_response",
        },
      },
      {
        id: "llm-2",
        type: "llm",
        name: "일반 대화 AI",
        position: { x: 600, y: 400 },
        config: {
          model: "gpt-4o-mini",
          provider: "openai",
          systemPrompt: "당신은 친근한 대화 상대입니다. 일상적인 질문에 편안하게 답변하세요.",
          temperature: 0.8,
          inputVariable: "trigger.input",
          outputVariable: "general_response",
        },
      },
      {
        id: "output-1",
        type: "output",
        name: "결과",
        position: { x: 900, y: 250 },
        config: {
          variable: "response",
          format: "text",
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "trigger-1",
        target: "condition-1",
      },
      {
        id: "e2-3",
        source: "condition-1",
        target: "llm-1",
        sourceHandle: "true",
      },
      {
        id: "e2-4",
        source: "condition-1",
        target: "llm-2",
        sourceHandle: "false",
      },
      {
        id: "e3-5",
        source: "llm-1",
        target: "output-1",
      },
      {
        id: "e4-5",
        source: "llm-2",
        target: "output-1",
      },
    ],
    variables: {
      trigger: {
        type: "technical",
        input: "REST API와 GraphQL의 차이점을 설명해주세요",
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // 3. 멀티모델 비교 워크플로우
  "multi-model": {
    id: "example-multi-model",
    name: "멀티모델 비교",
    description: "여러 AI 모델로 동시 실행하고 결과 통합",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        name: "시작",
        position: { x: 100, y: 250 },
        config: {
          type: "manual",
        },
      },
      {
        id: "llm-1",
        type: "llm",
        name: "GPT-4o",
        position: { x: 400, y: 100 },
        config: {
          model: "gpt-4o",
          provider: "openai",
          systemPrompt: "당신은 전문 작가입니다. 창의적이고 설득력 있는 글을 작성하세요.",
          temperature: 0.7,
          inputVariable: "trigger.input",
          outputVariable: "gpt4_response",
        },
      },
      {
        id: "llm-2",
        type: "llm",
        name: "Claude",
        position: { x: 400, y: 250 },
        config: {
          model: "claude-sonnet-4-5-20250929",
          provider: "anthropic",
          systemPrompt: "당신은 전문 작가입니다. 창의적이고 설득력 있는 글을 작성하세요.",
          temperature: 0.7,
          inputVariable: "trigger.input",
          outputVariable: "claude_response",
        },
      },
      {
        id: "llm-3",
        type: "llm",
        name: "Gemini",
        position: { x: 400, y: 400 },
        config: {
          model: "gemini-2.0-flash-exp",
          provider: "google",
          systemPrompt: "당신은 전문 작가입니다. 창의적이고 설득력 있는 글을 작성하세요.",
          temperature: 0.7,
          inputVariable: "trigger.input",
          outputVariable: "gemini_response",
        },
      },
      {
        id: "llm-4",
        type: "llm",
        name: "결과 통합",
        position: { x: 700, y: 250 },
        config: {
          model: "gpt-4o",
          provider: "openai",
          systemPrompt: "당신은 에디터입니다. 여러 AI의 응답을 분석하고 최고의 요소들을 결합하여 최종 답변을 만드세요.",
          temperature: 0.5,
          inputVariable: "all_responses",
          outputVariable: "final_response",
        },
      },
      {
        id: "output-1",
        type: "output",
        name: "최종 결과",
        position: { x: 1000, y: 250 },
        config: {
          variable: "final_response",
          format: "text",
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "trigger-1",
        target: "llm-1",
      },
      {
        id: "e1-3",
        source: "trigger-1",
        target: "llm-2",
      },
      {
        id: "e1-4",
        source: "trigger-1",
        target: "llm-3",
      },
      {
        id: "e2-5",
        source: "llm-1",
        target: "llm-4",
      },
      {
        id: "e3-5",
        source: "llm-2",
        target: "llm-4",
      },
      {
        id: "e4-5",
        source: "llm-3",
        target: "llm-4",
      },
      {
        id: "e5-6",
        source: "llm-4",
        target: "output-1",
      },
    ],
    variables: {
      trigger: {
        input: "AI 기술의 미래에 대한 짧은 에세이를 작성해주세요",
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // 4. RAG 기반 질의응답 워크플로우
  "rag-qa": {
    id: "example-rag",
    name: "RAG 질의응답",
    description: "지식베이스 검색 후 AI로 답변 생성",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        name: "질문 입력",
        position: { x: 100, y: 200 },
        config: {
          type: "manual",
        },
      },
      {
        id: "rag-1",
        type: "rag",
        name: "지식 검색",
        position: { x: 350, y: 200 },
        config: {
          knowledgeBaseId: "kb-default",
          queryVariable: "trigger.question",
          outputVariable: "context",
          topK: 5,
        },
      },
      {
        id: "transform-1",
        type: "transform",
        name: "컨텍스트 포맷",
        position: { x: 600, y: 200 },
        config: {
          inputVariable: "context",
          outputVariable: "formatted_context",
          transformation: "context.map(c => c.text).join('\\n\\n')",
        },
      },
      {
        id: "llm-1",
        type: "llm",
        name: "답변 생성",
        position: { x: 850, y: 200 },
        config: {
          model: "gpt-4o",
          provider: "openai",
          systemPrompt: "당신은 지식베이스를 기반으로 정확한 답변을 제공하는 AI입니다. 제공된 컨텍스트를 참고하여 답변하세요.",
          temperature: 0.3,
          inputVariable: "formatted_context",
          outputVariable: "answer",
        },
      },
      {
        id: "output-1",
        type: "output",
        name: "답변 출력",
        position: { x: 1100, y: 200 },
        config: {
          variable: "answer",
          format: "text",
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "trigger-1",
        target: "rag-1",
      },
      {
        id: "e2-3",
        source: "rag-1",
        target: "transform-1",
      },
      {
        id: "e3-4",
        source: "transform-1",
        target: "llm-1",
      },
      {
        id: "e4-5",
        source: "llm-1",
        target: "output-1",
      },
    ],
    variables: {
      trigger: {
        question: "우리 제품의 주요 기능은 무엇인가요?",
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // 5. HTTP API 호출 워크플로우
  "api-integration": {
    id: "example-api",
    name: "API 데이터 처리",
    description: "외부 API 호출 → 데이터 변환 → AI 분석",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        name: "시작",
        position: { x: 100, y: 200 },
        config: {
          type: "manual",
        },
      },
      {
        id: "http-1",
        type: "http",
        name: "API 호출",
        position: { x: 350, y: 200 },
        config: {
          method: "GET",
          url: "https://api.github.com/repos/vercel/next.js",
          headers: {
            "Accept": "application/vnd.github.v3+json",
          },
          outputVariable: "api_data",
        },
      },
      {
        id: "transform-1",
        type: "transform",
        name: "데이터 추출",
        position: { x: 600, y: 200 },
        config: {
          inputVariable: "api_data",
          outputVariable: "repo_info",
          transformation: `{
  name: api_data.name,
  stars: api_data.stargazers_count,
  description: api_data.description,
  language: api_data.language
}`,
        },
      },
      {
        id: "llm-1",
        type: "llm",
        name: "데이터 분석",
        position: { x: 850, y: 200 },
        config: {
          model: "gpt-4o",
          provider: "openai",
          systemPrompt: "당신은 데이터 분석가입니다. GitHub 레포지토리 정보를 분석하고 간단한 리포트를 작성하세요.",
          temperature: 0.5,
          inputVariable: "repo_info",
          outputVariable: "analysis",
        },
      },
      {
        id: "output-1",
        type: "output",
        name: "분석 결과",
        position: { x: 1100, y: 200 },
        config: {
          variable: "analysis",
          format: "text",
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "trigger-1",
        target: "http-1",
      },
      {
        id: "e2-3",
        source: "http-1",
        target: "transform-1",
      },
      {
        id: "e3-4",
        source: "transform-1",
        target: "llm-1",
      },
      {
        id: "e4-5",
        source: "llm-1",
        target: "output-1",
      },
    ],
    variables: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

/**
 * 예제 목록 (UI 표시용)
 */
export const EXAMPLE_LIST = [
  {
    id: "simple-ai",
    name: "간단한 AI 응답",
    description: "트리거 → AI 모델 → 출력의 기본 워크플로우",
    difficulty: "초급",
    tags: ["기본", "AI"],
  },
  {
    id: "conditional-branch",
    name: "조건 분기 처리",
    description: "입력에 따라 다른 AI 모델로 분기",
    difficulty: "중급",
    tags: ["조건", "분기", "AI"],
  },
  {
    id: "multi-model",
    name: "멀티모델 비교",
    description: "여러 AI 모델로 동시 실행하고 결과 통합",
    difficulty: "고급",
    tags: ["멀티모델", "병렬", "통합"],
  },
  {
    id: "rag-qa",
    name: "RAG 질의응답",
    description: "지식베이스 검색 후 AI로 답변 생성",
    difficulty: "중급",
    tags: ["RAG", "검색", "AI"],
  },
  {
    id: "api-integration",
    name: "API 데이터 처리",
    description: "외부 API 호출 → 데이터 변환 → AI 분석",
    difficulty: "중급",
    tags: ["API", "HTTP", "변환"],
  },
];
