import { NextRequest, NextResponse } from "next/server";
import {
  generateDocx,
  generatePptx,
  generateXlsx,
  DocxSection,
  PptxSlide,
  XlsxSheet,
} from "@/lib/documents/generators";

// POST /api/documents/generate - Generate document
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, title, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Missing required fields: type and data" },
        { status: 400 }
      );
    }

    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    switch (type) {
      case "docx":
        buffer = await generateDocx(title || "Document", data as DocxSection[]);
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        filename = `${title || "document"}.docx`;
        break;

      case "pptx":
        buffer = await generatePptx(title || "Presentation", data as PptxSlide[]);
        contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        filename = `${title || "presentation"}.pptx`;
        break;

      case "xlsx":
        buffer = await generateXlsx(data as XlsxSheet[]);
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = `${title || "spreadsheet"}.xlsx`;
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported document type" },
          { status: 400 }
        );
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
