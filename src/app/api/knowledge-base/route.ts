import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeBase, listKnowledgeBases, deleteKnowledgeBase } from "@/lib/rag/hybrid-search";
import { ingestDocument, queryKnowledgeBase, deleteDocumentFromKnowledgeBase } from "@/lib/rag";

// GET /api/knowledge-base - List all knowledge bases
export async function GET() {
  try {
    const knowledgeBases = listKnowledgeBases();
    return NextResponse.json({
      success: true,
      knowledgeBases,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to list knowledge bases" },
      { status: 500 }
    );
  }
}

// POST /api/knowledge-base - Create new knowledge base or ingest document
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload for ingestion
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const knowledgeBaseId = formData.get("knowledgeBaseId") as string;
      const chunkSize = parseInt(formData.get("chunkSize") as string) || 500;
      const chunkOverlap = parseInt(formData.get("chunkOverlap") as string) || 50;

      if (!file || !knowledgeBaseId) {
        return NextResponse.json(
          { error: "Missing file or knowledgeBaseId" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await ingestDocument(buffer, file.name, {
        knowledgeBaseId,
        chunkSize,
        chunkOverlap,
      });

      return NextResponse.json(result);
    } else {
      // Handle JSON request for creating knowledge base
      const body = await req.json();
      const { id, name, description } = body;

      if (!id) {
        return NextResponse.json(
          { error: "Missing knowledge base ID" },
          { status: 400 }
        );
      }

      // Get or create knowledge base
      const kb = getKnowledgeBase(id);

      return NextResponse.json({
        success: true,
        knowledgeBase: {
          id,
          name: name || id,
          description: description || "",
        },
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/knowledge-base - Delete knowledge base
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing knowledge base ID" },
        { status: 400 }
      );
    }

    deleteKnowledgeBase(id);

    return NextResponse.json({
      success: true,
      message: `Knowledge base ${id} deleted`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete knowledge base" },
      { status: 500 }
    );
  }
}
