"use client";

import { useCallback, useState, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  Panel,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
  Settings2,
} from "lucide-react";
import { NODE_DEFINITIONS, NodeType, Workflow } from "@/lib/workflow/types";

import { TriggerNode } from "./nodes/trigger-node";
import { LLMNode } from "./nodes/llm-node";
import { ConditionNode } from "./nodes/condition-node";
import { HTTPNode } from "./nodes/http-node";
import { RAGNode } from "./nodes/rag-node";
import { TransformNode } from "./nodes/transform-node";
import { OutputNode } from "./nodes/output-node";

// Custom node types mapping
const nodeTypes = {
  trigger: TriggerNode,
  llm: LLMNode,
  condition: ConditionNode,
  http: HTTPNode,
  rag: RAGNode,
  transform: TransformNode,
  output: OutputNode,
};

// Define simpler types for our nodes
type FlowNode = Node<Record<string, unknown>>;
type FlowEdge = Edge;

interface WorkflowBuilderProps {
  workflow?: Workflow;
  onSave?: (workflow: Workflow) => void;
  onRun?: (workflow: Workflow) => void;
}

export function WorkflowBuilder({
  workflow,
  onSave,
  onRun,
}: WorkflowBuilderProps) {
  const initialNodes: FlowNode[] = workflow?.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: { ...n.config, label: n.name },
  })) || [];

  const initialEdges: FlowEdge[] = workflow?.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
  })) || [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: FlowNode) => {
    setSelectedNode(node.id);
  }, []);

  const addNode = useCallback(
    (type: NodeType) => {
      const definition = NODE_DEFINITIONS.find((d) => d.type === type);
      if (!definition) return;

      const newNode: FlowNode = {
        id: `${type}-${Date.now()}`,
        type,
        position: { x: 250, y: nodes.length * 100 + 50 },
        data: {
          label: definition.label,
          ...(definition.defaultConfig || {}),
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [nodes.length, setNodes]
  );

  const buildWorkflowData = useCallback(() => {
    const result = {
      id: workflow?.id || `workflow-${Date.now()}`,
      name: workflow?.name || "New Workflow",
      description: workflow?.description || "",
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type as NodeType,
        name: String(n.data?.label || n.type),
        position: n.position,
        config: n.data,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || undefined,
        targetHandle: e.targetHandle || undefined,
      })),
      variables: workflow?.variables || {},
      createdAt: workflow?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    return result as unknown as Workflow;
  }, [nodes, edges, workflow]);

  const handleSave = useCallback(() => {
    onSave?.(buildWorkflowData());
  }, [buildWorkflowData, onSave]);

  const handleRun = useCallback(() => {
    onRun?.(buildWorkflowData());
  }, [buildWorkflowData, onRun]);

  // Group nodes by category
  const nodeCategories = useMemo(() => {
    const categories: Record<string, typeof NODE_DEFINITIONS> = {};
    NODE_DEFINITIONS.forEach((def) => {
      if (!categories[def.category]) {
        categories[def.category] = [];
      }
      categories[def.category].push(def);
    });
    return categories;
  }, []);

  return (
    <div className="flex h-full w-full">
      {/* Node Palette */}
      <div className="w-64 border-r bg-muted/30 p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Nodes</h3>
        {Object.entries(nodeCategories).map(([category, defs]) => (
          <div key={category} className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
              {category}
            </h4>
            <div className="space-y-2">
              {defs.map((def) => (
                <button
                  key={def.type}
                  onClick={() => addNode(def.type)}
                  className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded flex items-center justify-center bg-secondary text-secondary-foreground text-sm">
                    {def.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{def.label}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {def.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

          {/* Top Toolbar */}
          <Panel position="top-center">
            <Card className="shadow-lg">
              <CardContent className="flex items-center gap-2 p-2">
                <Button variant="ghost" size="icon" title="Undo">
                  <Undo className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Redo">
                  <Redo className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border" />
                <Button variant="ghost" size="icon" title="Zoom In">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Zoom Out">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Fit View">
                  <Maximize className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border" />
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" onClick={handleRun}>
                  <Play className="h-4 w-4 mr-2" />
                  Run
                </Button>
              </CardContent>
            </Card>
          </Panel>
        </ReactFlow>
      </div>

      {/* Node Config Panel */}
      {selectedNode && (
        <div className="w-80 border-l bg-background p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Node Settings</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedNode(null)}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
          <NodeConfigPanel
            node={nodes.find((n) => n.id === selectedNode)}
            onUpdate={(data) => {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === selectedNode
                    ? { ...n, data: { ...n.data, ...data } }
                    : n
                )
              );
            }}
          />
        </div>
      )}
    </div>
  );
}

// Node Configuration Panel Component
function NodeConfigPanel({
  node,
  onUpdate,
}: {
  node?: FlowNode;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  if (!node) return null;

  const definition = NODE_DEFINITIONS.find((d) => d.type === node.type);
  if (!definition) return null;

  return (
    <div className="space-y-4">
      <div>
        <Badge variant="secondary">
          {definition.label}
        </Badge>
      </div>

      <div>
        <label className="text-sm font-medium">Name</label>
        <input
          type="text"
          className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
          value={String(node.data?.label || "")}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
      </div>

      {/* Dynamic config fields based on node type */}
      {node.type === "llm" && (
        <>
          <div>
            <label className="text-sm font-medium">Model</label>
            <select
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              value={String(node.data?.model || "gpt-4o")}
              onChange={(e) => onUpdate({ model: e.target.value })}
            >
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="claude-sonnet-4-5-20250929">Claude 3.5 Sonnet</option>
              <option value="claude-sonnet-4-20250514">Claude 3.5 Haiku</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">System Prompt</label>
            <textarea
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm min-h-[100px]"
              value={String(node.data?.systemPrompt || "")}
              onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
              placeholder="Enter system prompt..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Temperature</label>
            <input
              type="range"
              className="w-full mt-1"
              min="0"
              max="2"
              step="0.1"
              value={Number(node.data?.temperature) || 0.7}
              onChange={(e) =>
                onUpdate({ temperature: parseFloat(e.target.value) })
              }
            />
            <div className="text-xs text-muted-foreground">
              {Number(node.data?.temperature) || 0.7}
            </div>
          </div>
        </>
      )}

      {node.type === "http" && (
        <>
          <div>
            <label className="text-sm font-medium">Method</label>
            <select
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              value={String(node.data?.method || "GET")}
              onChange={(e) => onUpdate({ method: e.target.value })}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">URL</label>
            <input
              type="text"
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              value={String(node.data?.url || "")}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="https://api.example.com/..."
            />
          </div>
        </>
      )}

      {node.type === "condition" && (
        <div>
          <label className="text-sm font-medium">Variable</label>
          <input
            type="text"
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            placeholder="e.g., input.status"
            value={String(node.data?.variable || "")}
            onChange={(e) => onUpdate({ variable: e.target.value })}
          />
        </div>
      )}

      {node.type === "rag" && (
        <>
          <div>
            <label className="text-sm font-medium">Knowledge Base ID</label>
            <input
              type="text"
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              value={String(node.data?.knowledgeBaseId || "")}
              onChange={(e) => onUpdate({ knowledgeBaseId: e.target.value })}
              placeholder="Enter knowledge base ID..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Top K Results</label>
            <input
              type="number"
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              value={Number(node.data?.topK) || 5}
              onChange={(e) => onUpdate({ topK: parseInt(e.target.value) })}
              min="1"
              max="20"
            />
          </div>
        </>
      )}

      {node.type === "transform" && (
        <div>
          <label className="text-sm font-medium">Transformation</label>
          <textarea
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm font-mono min-h-[100px]"
            value={String(node.data?.transformation || "")}
            onChange={(e) => onUpdate({ transformation: e.target.value })}
            placeholder="input.data.map(x => x.value)"
          />
        </div>
      )}
    </div>
  );
}
