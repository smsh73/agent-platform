import { generateText, streamText } from "ai";
import { getModel } from "@/lib/ai/providers";
import { queryKnowledgeBase } from "@/lib/rag";
import { parseDocument } from "@/lib/documents/parsers";
import {
  generateDocx,
  generatePptx,
  generateXlsx,
  DocxSection,
  PptxSlide,
  XlsxSheet,
  markdownToDocxSections,
} from "@/lib/documents/generators";

// ============================================
// Super Agent Types
// ============================================

export interface AgentTask {
  type:
    | "research"
    | "summarize"
    | "translate"
    | "analyze"
    | "generate_document"
    | "generate_slides"
    | "generate_spreadsheet"
    | "answer_with_rag";
  input: string;
  options?: Record<string, unknown>;
}

export interface AgentResult {
  success: boolean;
  output: unknown;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    duration?: number;
    sources?: string[];
  };
  error?: string;
}

export interface ResearchOptions {
  depth?: "quick" | "standard" | "deep";
  sources?: string[];
  maxResults?: number;
  model?: string;
}

export interface DocumentOptions {
  format: "docx" | "pptx" | "xlsx" | "markdown";
  title?: string;
  template?: string;
  model?: string;
}

// ============================================
// Super Agent Class
// ============================================

export class SuperAgent {
  private defaultModel: string;

  constructor(defaultModel: string = "gpt-4o") {
    this.defaultModel = defaultModel;
  }

  // ----------------------------------------
  // Main Task Router
  // ----------------------------------------

  async executeTask(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      let result: AgentResult;

      switch (task.type) {
        case "research":
          result = await this.doResearch(
            task.input,
            task.options as unknown as ResearchOptions
          );
          break;
        case "summarize":
          result = await this.summarize(task.input, task.options);
          break;
        case "translate":
          result = await this.translate(
            task.input,
            task.options?.targetLanguage as string
          );
          break;
        case "analyze":
          result = await this.analyzeDocument(task.input, task.options);
          break;
        case "generate_document":
          result = await this.generateDocument(
            task.input,
            task.options as unknown as DocumentOptions
          );
          break;
        case "generate_slides":
          result = await this.generateSlides(task.input, task.options);
          break;
        case "generate_spreadsheet":
          result = await this.generateSpreadsheet(task.input, task.options);
          break;
        case "answer_with_rag":
          result = await this.answerWithRAG(
            task.input,
            task.options?.knowledgeBaseId as string,
            task.options
          );
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      result.metadata = {
        ...result.metadata,
        duration: Date.now() - startTime,
      };

      return result;
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: { duration: Date.now() - startTime },
      };
    }
  }

  // ----------------------------------------
  // Research Agent
  // ----------------------------------------

  private async doResearch(
    query: string,
    options?: ResearchOptions
  ): Promise<AgentResult> {
    const model = getModel(options?.model || this.defaultModel);
    const depth = options?.depth || "standard";

    // Research prompt based on depth
    const systemPrompt = `You are an expert research assistant. Conduct thorough research on the given topic.

Research Depth: ${depth}
${depth === "quick" ? "Provide a brief overview with key points." : ""}
${depth === "standard" ? "Provide comprehensive analysis with multiple perspectives." : ""}
${depth === "deep" ? "Provide exhaustive analysis with detailed sources, statistics, and expert opinions." : ""}

Structure your response with:
1. Executive Summary
2. Key Findings
3. Detailed Analysis
4. Conclusions
5. Recommended Actions (if applicable)

Be factual, cite sources where possible, and maintain objectivity.`;

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: query,
      maxOutputTokens: depth === "deep" ? 8000 : depth === "standard" ? 4000 : 2000,
    });

    return {
      success: true,
      output: result.text,
      metadata: {
        model: options?.model || this.defaultModel,
        tokensUsed: result.usage?.totalTokens,
      },
    };
  }

  // ----------------------------------------
  // Summarization Agent
  // ----------------------------------------

  private async summarize(
    content: string,
    options?: Record<string, unknown>
  ): Promise<AgentResult> {
    const model = getModel((options?.model as string) || this.defaultModel);
    const length = (options?.length as string) || "medium";

    const lengthGuide =
      length === "short"
        ? "2-3 sentences"
        : length === "medium"
        ? "1-2 paragraphs"
        : "detailed summary with key points";

    const result = await generateText({
      model,
      system: `You are a summarization expert. Create a ${lengthGuide} summary of the provided content.
Focus on:
- Main ideas and key points
- Important facts and figures
- Conclusions and implications
Maintain the original meaning while being concise.`,
      prompt: content,
    });

    return {
      success: true,
      output: result.text,
      metadata: {
        model: (options?.model as string) || this.defaultModel,
        tokensUsed: result.usage?.totalTokens,
      },
    };
  }

  // ----------------------------------------
  // Translation Agent
  // ----------------------------------------

  private async translate(
    content: string,
    targetLanguage: string = "English"
  ): Promise<AgentResult> {
    const model = getModel(this.defaultModel);

    const result = await generateText({
      model,
      system: `You are a professional translator. Translate the following content to ${targetLanguage}.
Maintain:
- Original meaning and context
- Appropriate tone and style
- Cultural nuances where applicable
Only output the translation, no explanations.`,
      prompt: content,
    });

    return {
      success: true,
      output: result.text,
      metadata: {
        model: this.defaultModel,
        tokensUsed: result.usage?.totalTokens,
      },
    };
  }

  // ----------------------------------------
  // Document Analysis Agent
  // ----------------------------------------

  private async analyzeDocument(
    content: string,
    options?: Record<string, unknown>
  ): Promise<AgentResult> {
    const model = getModel((options?.model as string) || this.defaultModel);
    const analysisType = (options?.type as string) || "general";

    const prompts: Record<string, string> = {
      general: `Analyze the following document and provide:
1. Document type and purpose
2. Key themes and topics
3. Main arguments or points
4. Notable data or statistics
5. Overall assessment`,
      sentiment: `Perform sentiment analysis on the following content:
1. Overall sentiment (positive/negative/neutral)
2. Sentiment breakdown by section/topic
3. Key emotional triggers
4. Tone analysis`,
      entities: `Extract and categorize all entities from the following content:
1. People/Names
2. Organizations
3. Locations
4. Dates/Times
5. Products/Services
6. Key concepts`,
      financial: `Analyze the following financial document:
1. Key financial metrics
2. Revenue and expense analysis
3. Trends and patterns
4. Risk factors
5. Recommendations`,
    };

    const result = await generateText({
      model,
      system: prompts[analysisType] || prompts.general,
      prompt: content,
    });

    return {
      success: true,
      output: result.text,
      metadata: {
        model: (options?.model as string) || this.defaultModel,
        tokensUsed: result.usage?.totalTokens,
      },
    };
  }

  // ----------------------------------------
  // Document Generation Agent
  // ----------------------------------------

  private async generateDocument(
    prompt: string,
    options?: DocumentOptions
  ): Promise<AgentResult> {
    const model = getModel(options?.model || this.defaultModel);
    const format = options?.format || "markdown";
    const title = options?.title || "Generated Document";

    // First, generate the content in markdown
    const contentResult = await generateText({
      model,
      system: `You are a professional document writer. Create a well-structured document based on the user's request.
Use markdown formatting:
- # for main title
- ## for sections
- ### for subsections
- Lists with - or *
- **bold** for emphasis

Create comprehensive, professional content.`,
      prompt: `Title: ${title}\n\nRequest: ${prompt}`,
    });

    const markdownContent = contentResult.text;

    // Convert to requested format
    let output: unknown;

    switch (format) {
      case "markdown":
        output = markdownContent;
        break;
      case "docx":
        const sections = markdownToDocxSections(markdownContent);
        output = await generateDocx(title, sections);
        break;
      default:
        output = markdownContent;
    }

    return {
      success: true,
      output,
      metadata: {
        model: options?.model || this.defaultModel,
        tokensUsed: contentResult.usage?.totalTokens,
      },
    };
  }

  // ----------------------------------------
  // Slides Generation Agent
  // ----------------------------------------

  private async generateSlides(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<AgentResult> {
    const model = getModel((options?.model as string) || this.defaultModel);
    const title = (options?.title as string) || "Presentation";
    const slideCount = (options?.slideCount as number) || 10;

    // Generate slide structure
    const structureResult = await generateText({
      model,
      system: `You are a presentation expert. Create a JSON structure for a ${slideCount}-slide presentation.

Output format (JSON array):
[
  {"type": "title", "title": "Main Title", "subtitle": "Subtitle"},
  {"type": "bullets", "title": "Section Title", "bullets": ["Point 1", "Point 2", "Point 3"]},
  {"type": "content", "title": "Topic", "content": "Detailed content here"},
  {"type": "twoColumn", "title": "Comparison", "leftContent": ["Left 1"], "rightContent": ["Right 1"]},
  {"type": "table", "title": "Data", "tableData": [["Header1", "Header2"], ["Row1Col1", "Row1Col2"]]}
]

Create engaging, well-organized slides. Only output valid JSON.`,
      prompt: `Topic: ${title}\n\nRequest: ${prompt}`,
    });

    try {
      const slides: PptxSlide[] = JSON.parse(structureResult.text);
      const buffer = await generatePptx(title, slides);

      return {
        success: true,
        output: buffer,
        metadata: {
          model: (options?.model as string) || this.defaultModel,
          tokensUsed: structureResult.usage?.totalTokens,
        },
      };
    } catch (error) {
      // Fallback: generate simple slides
      const defaultSlides: PptxSlide[] = [
        { type: "title", title, subtitle: "Generated Presentation" },
        {
          type: "bullets",
          title: "Overview",
          bullets: ["AI-generated content", "Based on: " + prompt],
        },
      ];
      const buffer = await generatePptx(title, defaultSlides);

      return {
        success: true,
        output: buffer,
        metadata: {
          model: (options?.model as string) || this.defaultModel,
        },
      };
    }
  }

  // ----------------------------------------
  // Spreadsheet Generation Agent
  // ----------------------------------------

  private async generateSpreadsheet(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<AgentResult> {
    const model = getModel((options?.model as string) || this.defaultModel);

    // Generate spreadsheet structure
    const structureResult = await generateText({
      model,
      system: `You are a data analyst. Create a JSON structure for an Excel spreadsheet.

Output format (JSON array of sheets):
[
  {
    "name": "Sheet Name",
    "headers": ["Column1", "Column2", "Column3"],
    "rows": [
      ["Value1", "Value2", "Value3"],
      ["Value4", "Value5", "Value6"]
    ]
  }
]

Create relevant, well-organized data. Only output valid JSON.`,
      prompt,
    });

    try {
      const sheets: XlsxSheet[] = JSON.parse(structureResult.text);
      const buffer = await generateXlsx(sheets);

      return {
        success: true,
        output: buffer,
        metadata: {
          model: (options?.model as string) || this.defaultModel,
          tokensUsed: structureResult.usage?.totalTokens,
        },
      };
    } catch (error) {
      // Fallback: generate simple spreadsheet
      const defaultSheets: XlsxSheet[] = [
        {
          name: "Data",
          headers: ["Item", "Value", "Notes"],
          rows: [["Generated data", "N/A", "Based on: " + prompt]],
        },
      ];
      const buffer = await generateXlsx(defaultSheets);

      return {
        success: true,
        output: buffer,
        metadata: {
          model: (options?.model as string) || this.defaultModel,
        },
      };
    }
  }

  // ----------------------------------------
  // RAG-enhanced Answer Agent
  // ----------------------------------------

  private async answerWithRAG(
    query: string,
    knowledgeBaseId: string,
    options?: Record<string, unknown>
  ): Promise<AgentResult> {
    const model = getModel((options?.model as string) || this.defaultModel);

    // Query knowledge base
    const ragResult = await queryKnowledgeBase(knowledgeBaseId, query, {
      topK: (options?.topK as number) || 5,
    });

    // Generate answer with context
    const result = await generateText({
      model,
      system: `You are a helpful assistant with access to a knowledge base.
Answer the user's question based on the provided context.
If the context doesn't contain relevant information, say so.
Always cite your sources using [Source N] format.

## Context from Knowledge Base:
${ragResult.formattedContext}`,
      prompt: query,
    });

    return {
      success: true,
      output: result.text,
      metadata: {
        model: (options?.model as string) || this.defaultModel,
        tokensUsed: result.usage?.totalTokens,
        sources: ragResult.contexts.map((c) => c.source),
      },
    };
  }
}

// ============================================
// Helper Functions
// ============================================

export function createSuperAgent(model?: string): SuperAgent {
  return new SuperAgent(model);
}

export async function runAgentTask(task: AgentTask): Promise<AgentResult> {
  const agent = new SuperAgent();
  return agent.executeTask(task);
}
