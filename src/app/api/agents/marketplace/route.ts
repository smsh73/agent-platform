import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/error-handler";
import { MARKETPLACE_AGENTS } from "@/types/agents";

/**
 * GET /api/agents/marketplace - Get all marketplace agents
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured") === "true";

    let agents = [...MARKETPLACE_AGENTS];

    // Filter by category
    if (category && category !== "전체") {
      const categoryMap: Record<string, string> = {
        "리서치": "research",
        "개발": "development",
        "마케팅": "marketing",
        "분석": "analytics",
        "지원": "support",
        "법률": "legal",
        "금융": "finance",
        "인사": "hr",
      };
      const categoryKey = categoryMap[category];
      if (categoryKey) {
        agents = agents.filter((a) => a.category === categoryKey);
      }
    }

    // Filter by featured
    if (featured) {
      agents = agents.filter((a) => a.featured);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      agents = agents.filter(
        (a) =>
          a.name.toLowerCase().includes(searchLower) ||
          a.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort by rating and downloads
    agents.sort((a, b) => {
      if (a.rating !== b.rating) {
        return b.rating - a.rating;
      }
      return b.downloads - a.downloads;
    });

    return NextResponse.json({
      success: true,
      agents,
      total: agents.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
