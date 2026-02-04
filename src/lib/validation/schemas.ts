import { z } from "zod";

// Chat & Messaging Schemas
export const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(10000), // Prevent DoS with length limits
      })
    )
    .min(1)
    .max(50), // Limit conversation length
  model: z.string().regex(/^(gpt|claude|gemini|llama)/),
  conversationId: z.string().optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// Research Schemas
export const ResearchRequestSchema = z.object({
  query: z.string().min(1).max(5000),
  depth: z.enum(["quick", "standard", "deep"]).default("standard"),
  userId: z.string().optional(),
});

export type ResearchRequest = z.infer<typeof ResearchRequestSchema>;

// Slides Generation Schemas
export const SlidesRequestSchema = z.object({
  prompt: z.string().min(10).max(2000),
  slideCount: z.number().int().min(5).max(30).default(20),
  themeId: z.string().optional(),
});

export type SlidesRequest = z.infer<typeof SlidesRequestSchema>;

// Sheets Generation Schemas
export const SheetsRequestSchema = z.object({
  prompt: z.string().min(10).max(2000),
  rowCount: z.number().int().min(1).max(100).default(10),
});

export type SheetsRequest = z.infer<typeof SheetsRequestSchema>;

// Workflow Schemas
export const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["trigger", "llm", "http", "rag", "output"]),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.any()),
});

export const WorkflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  nodes: z.array(WorkflowNodeSchema).max(50), // Limit complexity
  edges: z.array(WorkflowEdgeSchema).max(100),
});

export type Workflow = z.infer<typeof WorkflowSchema>;

export const WorkflowExecutionSchema = z.object({
  workflowId: z.string(),
  input: z.any(),
});

// Knowledge Base Schemas
export const KnowledgeBaseCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  chunkSize: z.number().int().min(100).max(2000).default(500),
  chunkOverlap: z.number().int().min(0).max(500).default(50),
});

export type KnowledgeBaseCreate = z.infer<typeof KnowledgeBaseCreateSchema>;

export const KnowledgeBaseQuerySchema = z.object({
  knowledgeBaseId: z.string(),
  query: z.string().min(1).max(1000),
  topK: z.number().int().min(1).max(20).default(5),
});

export type KnowledgeBaseQuery = z.infer<typeof KnowledgeBaseQuerySchema>;

// File Upload Schema
export const FileUploadSchema = z.object({
  knowledgeBaseId: z.string(),
  chunkSize: z.number().int().min(100).max(2000).default(500),
  chunkOverlap: z.number().int().min(0).max(500).default(50),
});

// API Key Schema
export const ApiKeySchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "perplexity"]),
  apiKey: z.string().min(10).max(200),
});

export type ApiKey = z.infer<typeof ApiKeySchema>;

// Agent Schema
export const AgentCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  prompt: z.string().min(1).max(5000),
  model: z.string(),
  tools: z.array(z.string()).max(20),
  isPublic: z.boolean().default(false),
});

export type AgentCreate = z.infer<typeof AgentCreateSchema>;

// MoA (Mixture of Agents) Schema
export const MoARequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(10000),
      })
    )
    .min(1)
    .max(50),
  enableSearch: z.boolean().default(true),
});

export type MoARequest = z.infer<typeof MoARequestSchema>;
