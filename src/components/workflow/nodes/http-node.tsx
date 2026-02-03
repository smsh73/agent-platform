"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Globe } from "lucide-react";

export const HTTPNode = memo(function HTTPNode({ data }: NodeProps) {
  return (
    <div className="bg-white border-2 border-blue-500 rounded-lg shadow-md min-w-[180px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500"
      />
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-t-md">
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">{data.label as string}</span>
      </div>
      <div className="p-3 space-y-1">
        <div className="text-xs">
          <span className="text-muted-foreground">Method: </span>
          <span className="font-medium">{(data.method as string) || "GET"}</span>
        </div>
        {data.url ? (
          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
            {String(data.url)}
          </div>
        ) : null}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500"
      />
    </div>
  );
});
