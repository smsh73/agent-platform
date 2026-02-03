import { generateText } from "ai";
import { auth } from "@/lib/auth";
import { getApiKey } from "@/lib/ai/get-api-key";
import { getModelWithKey, getProviderFromModel } from "@/lib/ai/providers";
import { Column, Row, Sheet, Spreadsheet } from "@/types/sheets";

export const maxDuration = 120;

interface GenerateRequest {
  prompt: string;
  rowCount?: number;
  columns?: Column[];
  templateId?: string;
  model?: string;
}

const SHEET_GENERATION_PROMPT = `당신은 데이터 분석 전문가입니다. 사용자의 요청에 따라 스프레드시트 데이터를 생성합니다.

다음 JSON 형식으로 데이터를 생성하세요:

{
  "title": "스프레드시트 제목",
  "description": "스프레드시트 설명",
  "columns": [
    { "id": "col1", "name": "열 이름", "type": "text" }
  ],
  "rows": [
    { "id": "row-1", "cells": { "col1": { "type": "text", "value": "데이터" } } }
  ]
}

열 타입:
- "text": 텍스트 데이터
- "number": 숫자 데이터 (value는 숫자)
- "date": 날짜 데이터 (YYYY-MM-DD 형식)
- "boolean": 불리언 (true/false)
- "link": URL 링크

규칙:
1. 열 ID는 영문 소문자로 작성 (camelCase)
2. 모든 행에 모든 열의 데이터 포함
3. 숫자 데이터는 실제 숫자 타입 사용
4. 현실적이고 정확한 데이터 생성
5. 한국어로 데이터 작성 (영문 고유명사 제외)
6. JSON만 출력 (추가 설명 없음)`;

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body: GenerateRequest = await req.json();

    const {
      prompt,
      rowCount = 10,
      columns,
      model: modelId = "gpt-4o"
    } = body;

    if (!prompt || prompt.trim().length === 0) {
      return Response.json(
        { error: "프롬프트를 입력해주세요" },
        { status: 400 }
      );
    }

    // API 키 가져오기
    const provider = getProviderFromModel(modelId);
    const apiKey = await getApiKey(provider, session?.user?.id);

    if (!apiKey) {
      return Response.json(
        { error: `API 키가 설정되지 않았습니다. 설정 > API 키에서 ${provider.toUpperCase()} API 키를 입력해주세요.` },
        { status: 400 }
      );
    }

    const model = getModelWithKey(modelId, apiKey);

    // 사용자 프롬프트 구성
    let userPrompt = `다음 주제로 스프레드시트 데이터를 생성해주세요:

주제: ${prompt}

요구사항:
- 데이터 행 수: ${rowCount}개 이상`;

    if (columns && columns.length > 0) {
      userPrompt += `\n- 열 구성:\n${columns.map(c => `  - ${c.name} (${c.type})`).join("\n")}`;
    } else {
      userPrompt += `\n- 주제에 적합한 열 구성을 자동으로 결정해주세요 (5-8개 열 권장)`;
    }

    userPrompt += `\n\n웹 리서치를 통해 얻을 수 있는 실제 데이터를 기반으로 작성해주세요.`;

    const result = await generateText({
      model,
      system: SHEET_GENERATION_PROMPT,
      prompt: userPrompt,
    });

    // JSON 파싱
    let sheetData;
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        sheetData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON을 찾을 수 없습니다");
      }
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError);
      return Response.json(
        { error: "데이터 생성 결과를 파싱하는데 실패했습니다. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // 시트 구성
    const sheet: Sheet = {
      id: `sheet-${Date.now()}`,
      name: "Sheet 1",
      columns: sheetData.columns.map((col: Column, idx: number) => ({
        ...col,
        id: col.id || `col-${idx}`,
        width: 150,
      })),
      rows: sheetData.rows.map((row: Row, idx: number) => ({
        ...row,
        id: row.id || `row-${idx}`,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const spreadsheet: Spreadsheet = {
      id: `spreadsheet-${Date.now()}`,
      title: sheetData.title || "새 스프레드시트",
      description: sheetData.description || "",
      sheets: [sheet],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return Response.json(spreadsheet);
  } catch (error) {
    console.error("시트 생성 오류:", error);
    return Response.json(
      { error: "스프레드시트를 생성하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
