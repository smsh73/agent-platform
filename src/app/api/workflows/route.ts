import { NextRequest, NextResponse } from "next/server";
import { validateWorkflow } from "@/lib/workflow/engine";
import { Workflow } from "@/lib/workflow/types";
import { requireAuth } from "@/lib/middleware/auth-guard";
import { handleApiError } from "@/lib/errors/error-handler";

// In-memory storage for demo (use database in production)
const workflows: Map<string, Workflow> = new Map();

// GET /api/workflows - List all workflows
export async function GET(req: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const allWorkflows = Array.from(workflows.values());
    return NextResponse.json({ workflows: allWorkflows });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/workflows - Create or update workflow
export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const workflow: Workflow = await req.json();

    // Validate workflow
    const errors = validateWorkflow(workflow);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Invalid workflow", details: errors },
        { status: 400 }
      );
    }

    // Save workflow
    workflow.updatedAt = new Date();
    workflows.set(workflow.id, workflow);

    return NextResponse.json({
      success: true,
      workflow,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
