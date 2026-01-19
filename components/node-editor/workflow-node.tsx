import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Settings } from "lucide-react";
import { NodeData } from "./node-editor";

const nodeColors = {
  start: "#10b981",
  condition: "#f59e0b",
  template: "#3b82f6",
  delay: "#8b5cf6",
  custom: "#ec4899",
  gemini: "#06b6d4",
};

const nodeIcons = {
  start: "▶️",
  condition: "❓",
  template: "✉️",
  delay: "⏱️",
  custom: "⚙️",
  gemini: "🤖",
};

export const WorkflowNode = memo(({ data, selected }: NodeProps<NodeData>) => {
  const color = nodeColors[data.type];
  const icon = nodeIcons[data.type];

  return (
    <div
      className="px-4 py-2 shadow-md rounded-lg border-2 bg-white min-w-[150px]"
      style={{
        borderColor: selected ? color : "#e2e8f0",
        backgroundColor: "white",
      }}
    >
      {data.type !== "start" && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3"
          style={{ background: color }}
        />
      )}

      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="font-bold text-sm" style={{ color }}>
            {data.label}
          </div>
          {data.config && Object.keys(data.config).length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              <Settings className="inline h-3 w-3 mr-1" />
              Configured
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3"
        style={{ background: color }}
      />
    </div>
  );
});

WorkflowNode.displayName = "WorkflowNode";
