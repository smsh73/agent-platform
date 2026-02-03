// Mixture of Agents 타입 정의

export interface AgentResponse {
  provider: "openai" | "anthropic" | "google" | "perplexity";
  model: string;
  content: string;
  latency: number; // ms
  tokens?: {
    input: number;
    output: number;
  };
}

export interface AnalysisResult {
  bestParts: {
    provider: string;
    section: string;
    reason: string;
    content: string;
  }[];
  rankings: {
    provider: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  }[];
}

export interface MoAResult {
  finalAnswer: string;
  agentResponses: AgentResponse[];
  analysis: AnalysisResult;
  searchResults?: string; // Perplexity 검색 결과
  totalLatency: number;
  orchestrator: string;
  narrator: string;
}

// MoA 설정
export interface MoAConfig {
  // Orchestrator: 응답 분석 및 최적 파트 선별
  orchestrator: {
    provider: "anthropic";
    model: "claude-3-5-sonnet-latest";
  };
  // Narrator: 최종 답변 합성
  narrator: {
    provider: "openai";
    model: "gpt-4o";
  };
  // Search: 실시간 정보 검색
  searcher: {
    provider: "perplexity";
    model: "llama-3.1-sonar-large-128k-online";
  };
  // Parallel Agents: 동시 실행 에이전트
  agents: {
    provider: "openai" | "anthropic" | "google";
    model: string;
  }[];
}

export const DEFAULT_MOA_CONFIG: MoAConfig = {
  orchestrator: {
    provider: "anthropic",
    model: "claude-3-5-sonnet-latest",
  },
  narrator: {
    provider: "openai",
    model: "gpt-4o",
  },
  searcher: {
    provider: "perplexity",
    model: "llama-3.1-sonar-large-128k-online",
  },
  agents: [
    { provider: "openai", model: "gpt-4o" },
    { provider: "anthropic", model: "claude-3-5-sonnet-latest" },
    { provider: "google", model: "gemini-1.5-pro" },
  ],
};

// 시스템 프롬프트
export const MOA_PROMPTS = {
  // 검색이 필요한지 판단
  needsSearch: `사용자의 질문이 최신 정보나 실시간 데이터가 필요한지 판단하세요.
다음 경우에 "YES"를 반환하세요:
- 최근 뉴스, 이벤트, 발표 관련
- 현재 가격, 주가, 환율 등
- 최신 통계, 순위, 데이터
- 특정 날짜 이후의 정보
- "최근", "현재", "지금", "오늘" 등의 키워드 포함

그 외에는 "NO"를 반환하세요.
오직 "YES" 또는 "NO"만 답하세요.`,

  // Orchestrator: 응답 분석
  orchestrator: `당신은 AI 응답 분석 전문가입니다. 여러 AI 모델의 응답을 분석하여 각 응답의 강점을 파악합니다.

## 분석 기준
1. **정확성**: 사실적으로 올바른 정보인가
2. **완전성**: 질문의 모든 측면을 다루었는가
3. **명확성**: 이해하기 쉽게 설명했는가
4. **구조**: 논리적으로 잘 구성되었는가
5. **실용성**: 실제로 유용한 정보인가

## 출력 형식 (JSON)
{
  "bestParts": [
    {
      "provider": "응답 제공자",
      "section": "섹션 이름 (예: 도입부, 핵심 설명, 예시, 결론)",
      "reason": "이 부분이 우수한 이유",
      "content": "해당 내용 (원문 그대로)"
    }
  ],
  "rankings": [
    {
      "provider": "응답 제공자",
      "score": 85,
      "strengths": ["강점1", "강점2"],
      "weaknesses": ["약점1"]
    }
  ]
}

각 응답에서 가장 우수한 부분을 선별하고, 최종 답변에 포함되어야 할 핵심 내용을 추출하세요.`,

  // Narrator: 최종 답변 합성
  narrator: `당신은 여러 AI 응답의 최고 부분을 조합하여 완벽한 답변을 만드는 전문가입니다.

## 지침
1. 분석 결과에서 선별된 최고의 파트들을 자연스럽게 통합
2. 중복 내용 제거하고 논리적 흐름 유지
3. 일관된 어조와 스타일 유지
4. 원본의 정확한 정보 보존
5. 필요시 검색 결과의 최신 정보 통합

## 주의사항
- 새로운 정보를 추가하지 마세요
- 선별된 내용의 핵심을 유지하세요
- 자연스러운 한국어로 작성하세요
- 마크다운 형식을 적절히 활용하세요

최종 답변만 출력하세요. 메타 설명이나 분석 결과는 포함하지 마세요.`,
};
