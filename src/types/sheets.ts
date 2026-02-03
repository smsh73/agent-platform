// AI 시트 타입 정의

export interface CellValue {
  type: "text" | "number" | "date" | "boolean" | "formula" | "link";
  value: string | number | boolean | null;
  displayValue?: string;
  formula?: string;
}

export interface Cell {
  id: string;
  value: CellValue;
  style?: CellStyle;
}

export interface CellStyle {
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: "normal" | "bold";
  textAlign?: "left" | "center" | "right";
  fontSize?: number;
}

export interface Column {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "boolean" | "link";
  width?: number;
}

export interface Row {
  id: string;
  cells: Record<string, CellValue>;
}

export interface Sheet {
  id: string;
  name: string;
  columns: Column[];
  rows: Row[];
  createdAt: string;
  updatedAt: string;
}

export interface Spreadsheet {
  id: string;
  title: string;
  description?: string;
  sheets: Sheet[];
  createdAt: string;
  updatedAt: string;
}

// 차트 타입
export type ChartType = "bar" | "line" | "pie" | "area" | "scatter";

export interface ChartConfig {
  type: ChartType;
  title: string;
  xAxis: string; // column id
  yAxis: string[]; // column ids
  colors?: string[];
}

// 시트 템플릿
export interface SheetTemplate {
  id: string;
  name: string;
  description: string;
  category: "business" | "finance" | "marketing" | "data" | "personal";
  columns: Column[];
  samplePrompt: string;
}

export const SHEET_TEMPLATES: SheetTemplate[] = [
  {
    id: "competitor-analysis",
    name: "경쟁사 분석",
    description: "경쟁사 정보 비교 분석표",
    category: "business",
    columns: [
      { id: "company", name: "회사명", type: "text" },
      { id: "product", name: "주요 제품", type: "text" },
      { id: "marketShare", name: "시장 점유율", type: "text" },
      { id: "strengths", name: "강점", type: "text" },
      { id: "weaknesses", name: "약점", type: "text" },
    ],
    samplePrompt: "한국 전기차 시장 주요 경쟁사 분석",
  },
  {
    id: "market-research",
    name: "시장 조사",
    description: "시장 규모 및 트렌드 분석",
    category: "marketing",
    columns: [
      { id: "segment", name: "세그먼트", type: "text" },
      { id: "size", name: "시장 규모", type: "text" },
      { id: "growth", name: "성장률", type: "text" },
      { id: "trend", name: "주요 트렌드", type: "text" },
    ],
    samplePrompt: "2025년 AI 소프트웨어 시장 규모 조사",
  },
  {
    id: "financial-comparison",
    name: "재무 비교",
    description: "기업 재무 지표 비교",
    category: "finance",
    columns: [
      { id: "company", name: "기업", type: "text" },
      { id: "revenue", name: "매출액", type: "text" },
      { id: "profit", name: "영업이익", type: "text" },
      { id: "margin", name: "이익률", type: "text" },
      { id: "growth", name: "성장률", type: "text" },
    ],
    samplePrompt: "국내 IT 대기업 5개사 재무 비교",
  },
  {
    id: "product-comparison",
    name: "제품 비교",
    description: "제품 스펙 및 가격 비교",
    category: "data",
    columns: [
      { id: "product", name: "제품명", type: "text" },
      { id: "price", name: "가격", type: "text" },
      { id: "specs", name: "주요 스펙", type: "text" },
      { id: "rating", name: "평점", type: "text" },
      { id: "pros", name: "장점", type: "text" },
    ],
    samplePrompt: "2025년 최신 스마트폰 비교",
  },
  {
    id: "task-tracker",
    name: "프로젝트 추적",
    description: "프로젝트 작업 관리",
    category: "personal",
    columns: [
      { id: "task", name: "작업", type: "text" },
      { id: "status", name: "상태", type: "text" },
      { id: "priority", name: "우선순위", type: "text" },
      { id: "deadline", name: "마감일", type: "date" },
      { id: "assignee", name: "담당자", type: "text" },
    ],
    samplePrompt: "웹사이트 리뉴얼 프로젝트 작업 목록 생성",
  },
  {
    id: "swot-analysis",
    name: "SWOT 분석",
    description: "강점/약점/기회/위협 분석",
    category: "business",
    columns: [
      { id: "category", name: "구분", type: "text" },
      { id: "item", name: "항목", type: "text" },
      { id: "description", name: "설명", type: "text" },
      { id: "impact", name: "영향도", type: "text" },
    ],
    samplePrompt: "스타트업 SWOT 분석",
  },
];

// 차트 색상 팔레트
export const CHART_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];
