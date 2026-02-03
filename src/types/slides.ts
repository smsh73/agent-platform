// AI 슬라이드 타입 정의 - HTML/CSS 기반 디자인

// 슬라이드 규격
export const SLIDE_DIMENSIONS = {
  width: 1280,
  height: 720,
  aspectRatio: "16:9",
} as const;

// 슬라이드 요소 타입
export interface SlideElement {
  id: string;
  type: "text" | "heading" | "subheading" | "list" | "image" | "chart" | "quote" | "code";
  content: string;
  style: {
    position: { x: number; y: number }; // px
    size: { width: number; height: number }; // px
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: "left" | "center" | "right";
    padding?: number;
    borderRadius?: number;
    opacity?: number;
  };
}

// 개별 슬라이드
export interface Slide {
  id: string;
  slideNumber: number;
  title: string;
  subtitle?: string;
  layout: SlideLayout;
  elements: SlideElement[];
  background: SlideBackground;
  notes?: string; // 발표자 노트
  research?: string; // Perplexity 검색 결과
}

// 슬라이드 레이아웃 타입
export type SlideLayout =
  | "title" // 타이틀 슬라이드
  | "title-content" // 제목 + 본문
  | "title-two-column" // 제목 + 2열
  | "title-image-left" // 제목 + 왼쪽 이미지
  | "title-image-right" // 제목 + 오른쪽 이미지
  | "section" // 섹션 구분
  | "quote" // 인용문
  | "comparison" // 비교
  | "timeline" // 타임라인
  | "stats" // 통계/숫자
  | "blank"; // 빈 슬라이드

// 슬라이드 배경
export interface SlideBackground {
  type: "solid" | "gradient" | "image";
  color?: string;
  gradient?: {
    from: string;
    to: string;
    direction: "to-r" | "to-b" | "to-br" | "to-bl";
  };
  imageUrl?: string;
  overlay?: string; // 오버레이 색상
}

// 프레젠테이션 테마
export interface PresentationTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  styles: {
    headingSize: number;
    subheadingSize: number;
    bodySize: number;
    borderRadius: number;
  };
}

// 전체 프레젠테이션
export interface Presentation {
  id: string;
  title: string;
  description?: string;
  theme: PresentationTheme;
  slides: Slide[];
  outline: PresentationOutline;
  createdAt: Date;
  updatedAt: Date;
}

// 프레젠테이션 개요 (파이프라인 1단계)
export interface PresentationOutline {
  topic: string;
  purpose: string;
  targetAudience: string;
  keyMessages: string[];
  structure: {
    introduction: string[];
    mainSections: {
      title: string;
      points: string[];
    }[];
    conclusion: string[];
  };
}

// 슬라이드 계획 (파이프라인 2단계)
export interface SlidePlan {
  slideNumber: number;
  title: string;
  layout: SlideLayout;
  contentPlan: string;
  researchQuery?: string; // Perplexity 검색 쿼리
}

// 슬라이드 생성 진행 상태
export interface SlideGenerationProgress {
  stage:
    | "analyzing" // 의도 분석
    | "researching-topic" // 주제 검색
    | "creating-outline" // 개요 생성
    | "planning-slides" // 슬라이드 계획
    | "researching-slides" // 슬라이드별 검색
    | "generating-content" // 콘텐츠 생성
    | "designing-layout" // 레이아웃 디자인
    | "complete" // 완료
    | "error"; // 오류
  currentSlide?: number;
  totalSlides?: number;
  message: string;
  progress: number; // 0-100
}

// 기본 테마들
export const DEFAULT_THEMES: PresentationTheme[] = [
  {
    id: "modern-dark",
    name: "모던 다크",
    colors: {
      primary: "#3B82F6",
      secondary: "#8B5CF6",
      accent: "#10B981",
      background: "#0F172A",
      text: "#F8FAFC",
      muted: "#64748B",
    },
    fonts: {
      heading: "Pretendard, sans-serif",
      body: "Pretendard, sans-serif",
    },
    styles: {
      headingSize: 48,
      subheadingSize: 32,
      bodySize: 24,
      borderRadius: 12,
    },
  },
  {
    id: "modern-light",
    name: "모던 라이트",
    colors: {
      primary: "#2563EB",
      secondary: "#7C3AED",
      accent: "#059669",
      background: "#FFFFFF",
      text: "#1E293B",
      muted: "#94A3B8",
    },
    fonts: {
      heading: "Pretendard, sans-serif",
      body: "Pretendard, sans-serif",
    },
    styles: {
      headingSize: 48,
      subheadingSize: 32,
      bodySize: 24,
      borderRadius: 12,
    },
  },
  {
    id: "corporate-blue",
    name: "비즈니스 블루",
    colors: {
      primary: "#1E40AF",
      secondary: "#3730A3",
      accent: "#0891B2",
      background: "#F8FAFC",
      text: "#1E293B",
      muted: "#64748B",
    },
    fonts: {
      heading: "Pretendard, sans-serif",
      body: "Pretendard, sans-serif",
    },
    styles: {
      headingSize: 44,
      subheadingSize: 28,
      bodySize: 22,
      borderRadius: 8,
    },
  },
  {
    id: "gradient-purple",
    name: "그라데이션 퍼플",
    colors: {
      primary: "#A855F7",
      secondary: "#EC4899",
      accent: "#F472B6",
      background: "#18181B",
      text: "#FAFAFA",
      muted: "#A1A1AA",
    },
    fonts: {
      heading: "Pretendard, sans-serif",
      body: "Pretendard, sans-serif",
    },
    styles: {
      headingSize: 52,
      subheadingSize: 36,
      bodySize: 24,
      borderRadius: 16,
    },
  },
  {
    id: "nature-green",
    name: "네이처 그린",
    colors: {
      primary: "#059669",
      secondary: "#0D9488",
      accent: "#84CC16",
      background: "#ECFDF5",
      text: "#064E3B",
      muted: "#6B7280",
    },
    fonts: {
      heading: "Pretendard, sans-serif",
      body: "Pretendard, sans-serif",
    },
    styles: {
      headingSize: 46,
      subheadingSize: 30,
      bodySize: 22,
      borderRadius: 10,
    },
  },
  {
    id: "minimal-mono",
    name: "미니멀 모노",
    colors: {
      primary: "#18181B",
      secondary: "#3F3F46",
      accent: "#EF4444",
      background: "#FAFAFA",
      text: "#18181B",
      muted: "#71717A",
    },
    fonts: {
      heading: "Pretendard, sans-serif",
      body: "Pretendard, sans-serif",
    },
    styles: {
      headingSize: 48,
      subheadingSize: 32,
      bodySize: 24,
      borderRadius: 4,
    },
  },
];

// 레이아웃별 기본 요소 위치 템플릿
export const LAYOUT_TEMPLATES: Record<
  SlideLayout,
  {
    name: string;
    description: string;
    defaultElements: Partial<SlideElement>[];
  }
> = {
  title: {
    name: "타이틀",
    description: "프레젠테이션 시작 슬라이드",
    defaultElements: [
      {
        type: "heading",
        style: {
          position: { x: 80, y: 260 },
          size: { width: 1120, height: 100 },
          fontSize: 64,
          fontWeight: "bold",
          textAlign: "center",
        },
      },
      {
        type: "subheading",
        style: {
          position: { x: 80, y: 380 },
          size: { width: 1120, height: 60 },
          fontSize: 28,
          textAlign: "center",
        },
      },
    ],
  },
  "title-content": {
    name: "제목 + 본문",
    description: "가장 일반적인 레이아웃",
    defaultElements: [
      {
        type: "heading",
        style: {
          position: { x: 60, y: 40 },
          size: { width: 1160, height: 80 },
          fontSize: 44,
          fontWeight: "bold",
          textAlign: "left",
        },
      },
      {
        type: "text",
        style: {
          position: { x: 60, y: 140 },
          size: { width: 1160, height: 520 },
          fontSize: 24,
          textAlign: "left",
        },
      },
    ],
  },
  "title-two-column": {
    name: "2열 레이아웃",
    description: "비교나 대조에 적합",
    defaultElements: [
      {
        type: "heading",
        style: {
          position: { x: 60, y: 40 },
          size: { width: 1160, height: 80 },
          fontSize: 44,
          fontWeight: "bold",
          textAlign: "left",
        },
      },
      {
        type: "text",
        style: {
          position: { x: 60, y: 140 },
          size: { width: 560, height: 520 },
          fontSize: 22,
          textAlign: "left",
        },
      },
      {
        type: "text",
        style: {
          position: { x: 660, y: 140 },
          size: { width: 560, height: 520 },
          fontSize: 22,
          textAlign: "left",
        },
      },
    ],
  },
  "title-image-left": {
    name: "왼쪽 이미지",
    description: "이미지와 텍스트 조합",
    defaultElements: [
      {
        type: "heading",
        style: {
          position: { x: 580, y: 40 },
          size: { width: 640, height: 80 },
          fontSize: 40,
          fontWeight: "bold",
          textAlign: "left",
        },
      },
      {
        type: "image",
        style: {
          position: { x: 60, y: 60 },
          size: { width: 480, height: 600 },
        },
      },
      {
        type: "text",
        style: {
          position: { x: 580, y: 140 },
          size: { width: 640, height: 520 },
          fontSize: 22,
          textAlign: "left",
        },
      },
    ],
  },
  "title-image-right": {
    name: "오른쪽 이미지",
    description: "텍스트와 이미지 조합",
    defaultElements: [
      {
        type: "heading",
        style: {
          position: { x: 60, y: 40 },
          size: { width: 640, height: 80 },
          fontSize: 40,
          fontWeight: "bold",
          textAlign: "left",
        },
      },
      {
        type: "text",
        style: {
          position: { x: 60, y: 140 },
          size: { width: 640, height: 520 },
          fontSize: 22,
          textAlign: "left",
        },
      },
      {
        type: "image",
        style: {
          position: { x: 740, y: 60 },
          size: { width: 480, height: 600 },
        },
      },
    ],
  },
  section: {
    name: "섹션 구분",
    description: "새로운 섹션 시작",
    defaultElements: [
      {
        type: "heading",
        style: {
          position: { x: 80, y: 300 },
          size: { width: 1120, height: 120 },
          fontSize: 56,
          fontWeight: "bold",
          textAlign: "center",
        },
      },
    ],
  },
  quote: {
    name: "인용문",
    description: "중요한 인용구 강조",
    defaultElements: [
      {
        type: "quote",
        style: {
          position: { x: 120, y: 200 },
          size: { width: 1040, height: 320 },
          fontSize: 36,
          textAlign: "center",
        },
      },
    ],
  },
  comparison: {
    name: "비교",
    description: "두 가지 비교",
    defaultElements: [
      {
        type: "heading",
        style: {
          position: { x: 60, y: 40 },
          size: { width: 1160, height: 80 },
          fontSize: 44,
          fontWeight: "bold",
          textAlign: "center",
        },
      },
      {
        type: "subheading",
        style: {
          position: { x: 60, y: 140 },
          size: { width: 560, height: 50 },
          fontSize: 28,
          fontWeight: "bold",
          textAlign: "center",
        },
      },
      {
        type: "subheading",
        style: {
          position: { x: 660, y: 140 },
          size: { width: 560, height: 50 },
          fontSize: 28,
          fontWeight: "bold",
          textAlign: "center",
        },
      },
      {
        type: "list",
        style: {
          position: { x: 60, y: 200 },
          size: { width: 560, height: 460 },
          fontSize: 22,
          textAlign: "left",
        },
      },
      {
        type: "list",
        style: {
          position: { x: 660, y: 200 },
          size: { width: 560, height: 460 },
          fontSize: 22,
          textAlign: "left",
        },
      },
    ],
  },
  timeline: {
    name: "타임라인",
    description: "시간순 흐름 표시",
    defaultElements: [
      {
        type: "heading",
        style: {
          position: { x: 60, y: 40 },
          size: { width: 1160, height: 80 },
          fontSize: 44,
          fontWeight: "bold",
          textAlign: "center",
        },
      },
      {
        type: "text",
        style: {
          position: { x: 60, y: 140 },
          size: { width: 1160, height: 520 },
          fontSize: 22,
          textAlign: "left",
        },
      },
    ],
  },
  stats: {
    name: "통계",
    description: "숫자와 통계 강조",
    defaultElements: [
      {
        type: "heading",
        style: {
          position: { x: 60, y: 40 },
          size: { width: 1160, height: 80 },
          fontSize: 44,
          fontWeight: "bold",
          textAlign: "center",
        },
      },
      {
        type: "text",
        style: {
          position: { x: 60, y: 160 },
          size: { width: 380, height: 500 },
          fontSize: 64,
          fontWeight: "bold",
          textAlign: "center",
        },
      },
      {
        type: "text",
        style: {
          position: { x: 460, y: 160 },
          size: { width: 380, height: 500 },
          fontSize: 64,
          fontWeight: "bold",
          textAlign: "center",
        },
      },
      {
        type: "text",
        style: {
          position: { x: 860, y: 160 },
          size: { width: 380, height: 500 },
          fontSize: 64,
          fontWeight: "bold",
          textAlign: "center",
        },
      },
    ],
  },
  blank: {
    name: "빈 슬라이드",
    description: "자유 구성",
    defaultElements: [],
  },
};

// 슬라이드 생성 요청
export interface SlideGenerationRequest {
  prompt: string;
  slideCount?: number; // 기본 20장
  theme?: string;
  language?: string;
}

// 슬라이드 생성 응답
export interface SlideGenerationResponse {
  presentation: Presentation;
  progress: SlideGenerationProgress;
}
