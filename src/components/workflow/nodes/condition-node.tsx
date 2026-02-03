"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";

export const ConditionNode = memo(function ConditionNode({ data }: NodeProps) {
  return (
    <div className="bg-white border-2 border-yellow-500 rounded-lg shadow-md min-w-[150px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-yellow-500"
      />
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500 text-white rounded-t-md">
        <GitBranch className="h-4 w-4" />
        <span className="text-sm font-medium">{data.label as string}</span>
      </div>
      <div className="p-3 text-xs text-muted-foreground">
        Conditional branching
      </div>
      <div className="flex justify-between px-2 pb-2">
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          className="w-3 h-3 !bg-green-500 !relative !left-auto !transform-none"
          style={{ left: "25%" }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className="w-3 h-3 !bg-red-500 !relative !left-auto !transform-none"
          style={{ left: "75%" }}
        />
      </div>
    </div>
  );
});
