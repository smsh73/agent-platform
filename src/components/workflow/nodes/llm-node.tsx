"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { FileText } from "lucide-react";

export const LLMNode = memo(function LLMNode({ data }: NodeProps) {
  return (
    <div className="bg-white border-2 border-purple-500 rounded-lg shadow-md min-w-[180px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500"
      />
      <div className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-t-md">
        <FileText className="h-4 w-4" />
        <span className="text-sm font-medium">{data.label as string}</span>
      </div>
      <div className="p-3 space-y-1">
        <div className="text-xs">
          <span className="text-muted-foreground">Model: </span>
          <span className="font-medium">{(data.model as string) || "gpt-4o"}</span>
        </div>
        {data.systemPrompt ? (
          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
            {String(data.systemPrompt)}
          </div>
        ) : null}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-purple-500"
      />
    </div>
  );
});
