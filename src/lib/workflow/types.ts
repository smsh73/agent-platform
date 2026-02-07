// ============================================
// Workflow Types
// ============================================

export type NodeType =
  | "trigger"
  | "llm"
  | "condition"
  | "http"
  | "code"
  | "document"
  | "rag"
  | "email"
  | "delay"
  | "transform"
  | "output";

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  config: NodeConfig;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Node Configurations
// ============================================

export interface TriggerConfig {
  type: "manual" | "schedule" | "webhook" | "event";
  schedule?: string; // cron expression
  webhookPath?: string;
  eventName?: string;
}

export interface LLMConfig {
  model: string;
  provider: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  inputVariable: string;
  outputVariable: string;
}

export interface ConditionConfig {
  conditions: Array<{
    variable: string;
    operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan" | "isEmpty" | "isNotEmpty";
    value: unknown;
    outputHandle: string;
  }>;
  defaultHandle: string;
}

export interface HTTPConfig {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  headers?: Record<string, string>;
  body?: string;
  outputVariable: string;
}

export interface CodeConfig {
  language: "javascript";
  code: string;
  inputVariables: string[];
  outputVariable: string;
}

export interface DocumentConfig {
  action: "parse" | "generate";
  format: "docx" | "xlsx" | "pptx" | "pdf";
  inputVariable: string;
  outputVariable: string;
  template?: string;
}

export interface RAGConfig {
  knowledgeBaseId: string;
  queryVariable: string;
  outputVariable: string;
  topK?: number;
}

export interface EmailConfig {
  to: string;
  subject: string;
  body: string;
  attachmentVariable?: string;
}

export interface DelayConfig {
  duration: number; // milliseconds
}

export interface TransformConfig {
  inputVariable: string;
  outputVariable: string;
  transformation: string; // JavaScript expression
}

export interface OutputConfig {
  variable: string;
  format?: "text" | "json" | "file";
}

export type NodeConfig =
  | TriggerConfig
  | LLMConfig
  | ConditionConfig
  | HTTPConfig
  | CodeConfig
  | DocumentConfig
  | RAGConfig
  | EmailConfig
  | DelayConfig
  | TransformConfig
  | OutputConfig;

// ============================================
// Execution Context
// ============================================

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  variables: Record<string, unknown>;
  logs: ExecutionLog[];
  status: "running" | "completed" | "failed" | "paused";
  currentNodeId?: string;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export interface ExecutionLog {
  nodeId: string;
  nodeName: string;
  status: "started" | "completed" | "failed" | "skipped";
  input?: unknown;
  output?: unknown;
  error?: string;
  timestamp: Date;
  duration?: number;
}

// ============================================
// Node Definitions for UI
// ============================================

export interface NodeDefinition {
  type: NodeType;
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  category: "trigger" | "ai" | "logic" | "action" | "data" | "output";
  inputs: Array<{
    name: string;
    type: "string" | "number" | "boolean" | "object" | "array" | "any";
    required: boolean;
  }>;
  outputs: Array<{
    name: string;
    type: "string" | "number" | "boolean" | "object" | "array" | "any";
  }>;
  configFields: Array<{
    name: string;
    label: string;
    type: "text" | "textarea" | "number" | "select" | "boolean" | "code";
    options?: Array<{ label: string; value: string }>;
    required: boolean;
    default?: unknown;
  }>;
  defaultConfig?: Record<string, unknown>;
}

export const NODE_DEFINITIONS: NodeDefinition[] = [
  {
    type: "trigger",
    name: "trigger",
    label: "Trigger",
    description: "Start the workflow",
    icon: "⚡",
    color: "#22c55e",
    category: "trigger",
    inputs: [],
    outputs: [{ name: "output", type: "any" }],
    configFields: [
      {
        name: "type",
        label: "Trigger Type",
        type: "select",
        options: [
          { label: "Manual", value: "manual" },
          { label: "Schedule", value: "schedule" },
          { label: "Webhook", value: "webhook" },
        ],
        required: true,
        default: "manual",
      },
    ],
    defaultConfig: { type: "manual" },
  },
  {
    type: "llm",
    name: "llm",
    label: "AI Model",
    description: "Call an AI model",
    icon: "🧠",
    color: "#a855f7",
    category: "ai",
    inputs: [{ name: "input", type: "string", required: true }],
    outputs: [{ name: "output", type: "string" }],
    configFields: [
      {
        name: "model",
        label: "Model",
        type: "select",
        options: [
          { label: "GPT-4o", value: "gpt-4o" },
          { label: "Claude 3.5 Sonnet", value: "claude-sonnet-4-5-20250929" },
          { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
        ],
        required: true,
        default: "gpt-4o",
      },
      {
        name: "systemPrompt",
        label: "System Prompt",
        type: "textarea",
        required: false,
      },
      {
        name: "temperature",
        label: "Temperature",
        type: "number",
        required: false,
        default: 0.7,
      },
    ],
    defaultConfig: { model: "gpt-4o", temperature: 0.7 },
  },
  {
    type: "condition",
    name: "condition",
    label: "Condition",
    description: "Branch based on conditions",
    icon: "🔀",
    color: "#eab308",
    category: "logic",
    inputs: [{ name: "input", type: "any", required: true }],
    outputs: [
      { name: "true", type: "any" },
      { name: "false", type: "any" },
    ],
    configFields: [
      {
        name: "variable",
        label: "Variable",
        type: "text",
        required: true,
      },
      {
        name: "operator",
        label: "Operator",
        type: "select",
        options: [
          { label: "Equals", value: "equals" },
          { label: "Not Equals", value: "notEquals" },
          { label: "Contains", value: "contains" },
          { label: "Is Empty", value: "isEmpty" },
        ],
        required: true,
        default: "equals",
      },
    ],
    defaultConfig: { operator: "equals" },
  },
  {
    type: "http",
    name: "http",
    label: "HTTP Request",
    description: "Make an HTTP request",
    icon: "🌐",
    color: "#3b82f6",
    category: "action",
    inputs: [{ name: "input", type: "any", required: false }],
    outputs: [{ name: "output", type: "object" }],
    configFields: [
      {
        name: "method",
        label: "Method",
        type: "select",
        options: [
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
          { label: "PUT", value: "PUT" },
          { label: "DELETE", value: "DELETE" },
        ],
        required: true,
        default: "GET",
      },
      {
        name: "url",
        label: "URL",
        type: "text",
        required: true,
      },
    ],
    defaultConfig: { method: "GET" },
  },
  {
    type: "rag",
    name: "rag",
    label: "Knowledge Search",
    description: "Search knowledge base",
    icon: "📚",
    color: "#06b6d4",
    category: "data",
    inputs: [{ name: "query", type: "string", required: true }],
    outputs: [{ name: "context", type: "string" }],
    configFields: [
      {
        name: "knowledgeBaseId",
        label: "Knowledge Base",
        type: "text",
        required: true,
      },
      {
        name: "topK",
        label: "Number of Results",
        type: "number",
        required: false,
        default: 5,
      },
    ],
    defaultConfig: { topK: 5 },
  },
  {
    type: "transform",
    name: "transform",
    label: "Transform",
    description: "Transform data",
    icon: "🔄",
    color: "#f97316",
    category: "data",
    inputs: [{ name: "input", type: "any", required: true }],
    outputs: [{ name: "output", type: "any" }],
    configFields: [
      {
        name: "transformation",
        label: "Transformation (JS)",
        type: "code",
        required: true,
      },
    ],
    defaultConfig: { transformation: "input" },
  },
  {
    type: "output",
    name: "output",
    label: "Output",
    description: "Workflow output",
    icon: "🏁",
    color: "#ef4444",
    category: "output",
    inputs: [{ name: "input", type: "any", required: true }],
    outputs: [],
    configFields: [
      {
        name: "format",
        label: "Output Format",
        type: "select",
        options: [
          { label: "Text", value: "text" },
          { label: "JSON", value: "json" },
        ],
        required: false,
        default: "text",
      },
    ],
    defaultConfig: { format: "text" },
  },
];
