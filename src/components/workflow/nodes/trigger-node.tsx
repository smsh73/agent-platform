"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";

export const TriggerNode = memo(function TriggerNode({ data }: NodeProps) {
  return (
    <div className="bg-white border-2 border-green-500 rounded-lg shadow-md min-w-[150px]">
      <div className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-t-md">
        <Play className="h-4 w-4" />
        <span className="text-sm font-medium">{data.label as string}</span>
      </div>
      <div className="p-3 text-xs text-muted-foreground">
        Workflow trigger point
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-500"
      />
    </div>
  );
});
