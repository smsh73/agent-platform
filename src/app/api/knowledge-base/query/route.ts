import { NextRequest, NextResponse } from "next/server";
import { queryKnowledgeBase, RAGQueryOptions } from "@/lib/rag";

// POST /api/knowledge-base/query - Query a knowledge base
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { knowledgeBaseId, query, options } = body;

    if (!knowledgeBaseId || !query) {
      return NextResponse.json(
        { error: "Missing knowledgeBaseId or query" },
        { status: 400 }
      );
    }

    const queryOptions: RAGQueryOptions = {
      topK: options?.topK || 5,
      vectorWeight: options?.vectorWeight,
      keywordWeight: options?.keywordWeight,
      includeMetadata: options?.includeMetadata ?? true,
    };

    const result = await queryKnowledgeBase(knowledgeBaseId, query, queryOptions);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to query knowledge base",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
