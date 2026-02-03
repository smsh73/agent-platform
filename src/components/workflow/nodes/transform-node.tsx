"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Shuffle } from "lucide-react";

export const TransformNode = memo(function TransformNode({ data }: NodeProps) {
  return (
    <div className="bg-white border-2 border-orange-500 rounded-lg shadow-md min-w-[150px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-orange-500"
      />
      <div className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-t-md">
        <Shuffle className="h-4 w-4" />
        <span className="text-sm font-medium">{data.label as string}</span>
      </div>
      <div className="p-3 text-xs text-muted-foreground">
        {data.transformation ? (
          <code className="truncate block max-w-[130px]">
            {String(data.transformation)}
          </code>
        ) : (
          "Transform data"
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-orange-500"
      />
    </div>
  );
});
