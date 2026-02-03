"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Flag } from "lucide-react";

export const OutputNode = memo(function OutputNode({ data }: NodeProps) {
  return (
    <div className="bg-white border-2 border-red-500 rounded-lg shadow-md min-w-[150px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-red-500"
      />
      <div className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-t-md">
        <Flag className="h-4 w-4" />
        <span className="text-sm font-medium">{data.label as string}</span>
      </div>
      <div className="p-3 text-xs text-muted-foreground">
        Workflow output
      </div>
    </div>
  );
});
