import { NextRequest, NextResponse } from "next/server";
import { executeWorkflow, validateWorkflow } from "@/lib/workflow/engine";
import { Workflow } from "@/lib/workflow/types";

// POST /api/workflows/execute - Execute a workflow
export async function POST(req: NextRequest) {
  try {
    const { workflow, input }: { workflow: Workflow; input?: unknown } =
      await req.json();

    // Validate workflow
    const errors = validateWorkflow(workflow);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Invalid workflow", details: errors },
        { status: 400 }
      );
    }

    // Execute workflow
    const context = await executeWorkflow(workflow, input);

    return NextResponse.json({
      success: context.status === "completed",
      status: context.status,
      executionId: context.executionId,
      logs: context.logs,
      variables: context.variables,
      error: context.error,
      duration: context.endTime
        ? context.endTime.getTime() - context.startTime.getTime()
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Workflow execution failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
