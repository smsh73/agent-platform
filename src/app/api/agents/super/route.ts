import { NextRequest, NextResponse } from "next/server";
import { runAgentTask, AgentTask } from "@/lib/agents/super-agent";

// POST /api/agents/super - Execute a super agent task
export async function POST(req: NextRequest) {
  try {
    const task: AgentTask = await req.json();

    if (!task.type || !task.input) {
      return NextResponse.json(
        { error: "Missing required fields: type and input" },
        { status: 400 }
      );
    }

    const result = await runAgentTask(task);

    // Handle binary outputs (documents)
    if (Buffer.isBuffer(result.output)) {
      const contentTypes: Record<string, string> = {
        generate_document: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        generate_slides: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        generate_spreadsheet: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };

      const contentType = contentTypes[task.type] || "application/octet-stream";

      return new NextResponse(new Uint8Array(result.output), {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="generated.${getFileExtension(task.type)}"`,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function getFileExtension(taskType: string): string {
  switch (taskType) {
    case "generate_document":
      return "docx";
    case "generate_slides":
      return "pptx";
    case "generate_spreadsheet":
      return "xlsx";
    default:
      return "bin";
  }
}
