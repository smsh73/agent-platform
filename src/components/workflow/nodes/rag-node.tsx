"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Database } from "lucide-react";

export const RAGNode = memo(function RAGNode({ data }: NodeProps) {
  return (
    <div className="bg-white border-2 border-cyan-500 rounded-lg shadow-md min-w-[180px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-cyan-500"
      />
      <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500 text-white rounded-t-md">
        <Database className="h-4 w-4" />
        <span className="text-sm font-medium">{data.label as string}</span>
      </div>
      <div className="p-3 space-y-1">
        <div className="text-xs">
          <span className="text-muted-foreground">KB: </span>
          <span className="font-medium truncate">
            {(data.knowledgeBaseId as string) || "Not set"}
          </span>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">Top K: </span>
          <span className="font-medium">{(data.topK as number) || 5}</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-cyan-500"
      />
    </div>
  );
});
