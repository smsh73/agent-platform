import { NextRequest, NextResponse } from "next/server";
import { parseDocument } from "@/lib/documents/parsers";
import {
  generateDocx,
  generatePptx,
  generateXlsx,
  DocxSection,
  PptxSlide,
  XlsxSheet,
} from "@/lib/documents/generators";

// POST /api/documents/parse - Parse uploaded document
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const action = formData.get("action") as string || "parse";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;

    if (action === "parse") {
      // Parse document
      const result = await parseDocument(buffer, filename);
      return NextResponse.json({
        success: true,
        filename,
        ...result,
      });
    }

    return NextResponse.json(
      { error: "Unknown action" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
