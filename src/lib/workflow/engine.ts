import {
  Workflow,
  WorkflowNode,
  ExecutionContext,
  ExecutionLog,
  NodeConfig,
  LLMConfig,
  ConditionConfig,
  HTTPConfig,
  RAGConfig,
  TransformConfig,
} from "./types";
import { getModel } from "@/lib/ai/providers";
import { queryKnowledgeBase } from "@/lib/rag";
import { streamText } from "ai";

// ============================================
// Workflow Engine
// ============================================

export class WorkflowEngine {
  private workflow: Workflow;
  private context: ExecutionContext;
  private nodeMap: Map<string, WorkflowNode>;
  private adjacencyList: Map<string, string[]>;

  constructor(workflow: Workflow) {
    this.workflow = workflow;
    this.nodeMap = new Map(workflow.nodes.map((n) => [n.id, n]));
    this.adjacencyList = this.buildAdjacencyList();
    this.context = this.createContext();
  }

  private buildAdjacencyList(): Map<string, string[]> {
    const adj = new Map<string, string[]>();

    for (const node of this.workflow.nodes) {
      adj.set(node.id, []);
    }

    for (const edge of this.workflow.edges) {
      const targets = adj.get(edge.source) || [];
      targets.push(edge.target);
      adj.set(edge.source, targets);
    }

    return adj;
  }

  private createContext(): ExecutionContext {
    return {
      workflowId: this.workflow.id,
      executionId: Math.random().toString(36).substring(2),
      variables: { ...this.workflow.variables },
      logs: [],
      status: "running",
      startTime: new Date(),
    };
  }

  private log(
    nodeId: string,
    status: ExecutionLog["status"],
    data?: Partial<ExecutionLog>
  ): void {
    const node = this.nodeMap.get(nodeId);
    this.context.logs.push({
      nodeId,
      nodeName: node?.name || "Unknown",
      status,
      timestamp: new Date(),
      ...data,
    });
  }

  private findTriggerNode(): WorkflowNode | undefined {
    return this.workflow.nodes.find((n) => n.type === "trigger");
  }

  private getNextNodes(nodeId: string, outputHandle?: string): string[] {
    const edges = this.workflow.edges.filter(
      (e) =>
        e.source === nodeId &&
        (!outputHandle || e.sourceHandle === outputHandle)
    );
    return edges.map((e) => e.target);
  }

  // ============================================
  // Node Executors
  // ============================================

  private async executeTrigger(
    node: WorkflowNode,
    input: unknown
  ): Promise<unknown> {
    // Trigger node just passes through input or initial data
    return input || this.context.variables.input || {};
  }

  private async executeLLM(
    node: WorkflowNode,
    input: unknown
  ): Promise<string> {
    const config = node.config as LLMConfig;
    const model = getModel(config.model);

    const messages = [
      ...(config.systemPrompt
        ? [{ role: "system" as const, content: config.systemPrompt }]
        : []),
      { role: "user" as const, content: String(input) },
    ];

    const result = await streamText({
      model,
      messages,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    });

    // Collect the full response
    let fullResponse = "";
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
    }

    return fullResponse;
  }

  private executeCondition(
    node: WorkflowNode,
    input: unknown
  ): { result: boolean; handle: string } {
    const config = node.config as ConditionConfig;
    const value = this.resolveVariable(config.conditions[0]?.variable || "");

    for (const condition of config.conditions) {
      let matches = false;

      switch (condition.operator) {
        case "equals":
          matches = value === condition.value;
          break;
        case "notEquals":
          matches = value !== condition.value;
          break;
        case "contains":
          matches = String(value).includes(String(condition.value));
          break;
        case "greaterThan":
          matches = Number(value) > Number(condition.value);
          break;
        case "lessThan":
          matches = Number(value) < Number(condition.value);
          break;
        case "isEmpty":
          matches = !value || (Array.isArray(value) && value.length === 0);
          break;
        case "isNotEmpty":
          matches = !!value && (!Array.isArray(value) || value.length > 0);
          break;
      }

      if (matches) {
        return { result: true, handle: condition.outputHandle };
      }
    }

    return { result: false, handle: config.defaultHandle };
  }

  private async executeHTTP(
    node: WorkflowNode,
    input: unknown
  ): Promise<unknown> {
    const config = node.config as HTTPConfig;

    // Replace variables in URL and body
    let url = this.replaceVariables(config.url);
    let body = config.body ? this.replaceVariables(config.body) : undefined;

    const response = await fetch(url, {
      method: config.method,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: body && config.method !== "GET" ? body : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await response.json();
    }
    return await response.text();
  }

  private async executeRAG(
    node: WorkflowNode,
    input: unknown
  ): Promise<string> {
    const config = node.config as RAGConfig;
    const query = String(input);

    const result = await queryKnowledgeBase(config.knowledgeBaseId, query, {
      topK: config.topK,
    });

    return result.formattedContext;
  }

  private executeTransform(
    node: WorkflowNode,
    input: unknown
  ): unknown {
    const config = node.config as TransformConfig;

    // Create a safe execution context
    const fn = new Function(
      "input",
      "variables",
      `return ${config.transformation}`
    );

    return fn(input, this.context.variables);
  }

  // ============================================
  // Variable Resolution
  // ============================================

  private resolveVariable(path: string): unknown {
    const parts = path.split(".");
    let value: unknown = this.context.variables;

    for (const part of parts) {
      if (value && typeof value === "object") {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private replaceVariables(template: string): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
      const value = this.resolveVariable(path);
      return value !== undefined ? String(value) : "";
    });
  }

  // ============================================
  // Node Execution
  // ============================================

  private async executeNode(
    node: WorkflowNode,
    input: unknown
  ): Promise<{ output: unknown; nextHandle?: string }> {
    const startTime = Date.now();
    this.log(node.id, "started", { input });

    try {
      let output: unknown;
      let nextHandle: string | undefined;

      switch (node.type) {
        case "trigger":
          output = await this.executeTrigger(node, input);
          break;
        case "llm":
          output = await this.executeLLM(node, input);
          break;
        case "condition":
          const condResult = this.executeCondition(node, input);
          output = input;
          nextHandle = condResult.handle;
          break;
        case "http":
          output = await this.executeHTTP(node, input);
          break;
        case "rag":
          output = await this.executeRAG(node, input);
          break;
        case "transform":
          output = this.executeTransform(node, input);
          break;
        case "delay":
          const delay = (node.config as { duration: number }).duration || 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          output = input;
          break;
        case "output":
          output = input;
          break;
        default:
          output = input;
      }

      // Store output in context variables
      if (node.type !== "trigger") {
        this.context.variables[`${node.id}_output`] = output;
      }

      this.log(node.id, "completed", {
        output,
        duration: Date.now() - startTime,
      });

      return { output, nextHandle };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.log(node.id, "failed", {
        error: errorMessage,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  // ============================================
  // Workflow Execution
  // ============================================

  async execute(initialInput?: unknown): Promise<ExecutionContext> {
    try {
      if (initialInput) {
        this.context.variables.input = initialInput;
      }

      // Find trigger node
      const triggerNode = this.findTriggerNode();
      if (!triggerNode) {
        throw new Error("No trigger node found");
      }

      // Execute nodes in order
      const queue: Array<{ nodeId: string; input: unknown }> = [
        { nodeId: triggerNode.id, input: initialInput },
      ];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const { nodeId, input } = queue.shift()!;

        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        const node = this.nodeMap.get(nodeId);
        if (!node) continue;

        this.context.currentNodeId = nodeId;
        const { output, nextHandle } = await this.executeNode(node, input);

        // Get next nodes
        const nextNodeIds = this.getNextNodes(nodeId, nextHandle);
        for (const nextId of nextNodeIds) {
          queue.push({ nodeId: nextId, input: output });
        }
      }

      this.context.status = "completed";
      this.context.endTime = new Date();
    } catch (error) {
      this.context.status = "failed";
      this.context.error =
        error instanceof Error ? error.message : "Unknown error";
      this.context.endTime = new Date();
    }

    return this.context;
  }

  getContext(): ExecutionContext {
    return this.context;
  }
}

// ============================================
// Helper Functions
// ============================================

export async function executeWorkflow(
  workflow: Workflow,
  input?: unknown
): Promise<ExecutionContext> {
  const engine = new WorkflowEngine(workflow);
  return engine.execute(input);
}

export function validateWorkflow(workflow: Workflow): string[] {
  const errors: string[] = [];

  // 트리거 노드 확인
  const triggerNodes = workflow.nodes.filter((n) => n.type === "trigger");
  if (triggerNodes.length === 0) {
    errors.push("워크플로우에 트리거 노드가 필요합니다");
  }
  if (triggerNodes.length > 1) {
    errors.push("워크플로우에 트리거 노드는 하나만 있어야 합니다");
  }

  // 연결되지 않은 노드 확인
  const connectedNodes = new Set<string>();
  for (const edge of workflow.edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }

  for (const node of workflow.nodes) {
    if (node.type !== "trigger" && !connectedNodes.has(node.id)) {
      errors.push(`노드 "${node.name}"이(가) 워크플로우에 연결되어 있지 않습니다`);
    }
  }

  // 순환 참조(사이클) 감지 - DFS 사용
  const hasCycle = detectCycle(workflow);
  if (hasCycle) {
    errors.push("워크플로우에 순환 참조가 있습니다. 순환 구조는 허용되지 않습니다.");
  }

  return errors;
}

// DFS를 사용한 사이클 감지
function detectCycle(workflow: Workflow): boolean {
  const adjacencyList = new Map<string, string[]>();

  // 인접 리스트 생성
  for (const node of workflow.nodes) {
    adjacencyList.set(node.id, []);
  }

  for (const edge of workflow.edges) {
    const targets = adjacencyList.get(edge.source) || [];
    targets.push(edge.target);
    adjacencyList.set(edge.source, targets);
  }

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true; // 사이클 발견
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of workflow.nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        return true;
      }
    }
  }

  return false;
}
