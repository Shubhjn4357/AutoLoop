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
  apiRequest: "#6366f1",
  agent: "#10b981",
  webhook: "#ef4444",
  schedule: "#14b8a6",
  merge: "#f97316",
  splitInBatches: "#8b5cf6",
  filter: "#eab308",
  set: "#64748b",
};

const nodeIcons = {
  start: "▶️",
  condition: "❓",
  template: "✉️",
  delay: "⏱️",
  custom: "⚙️",
  gemini: "🤖",
  apiRequest: "🔗",
  agent: "📊",
  webhook: "🎣",
  schedule: "📅",
  merge: "⑃",
  splitInBatches: "🔁",
  filter: "🔍",
  set: "📝",
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
          <div className="flex items-center gap-1 mt-1">
            <div className={`h-2 w-2 rounded-full ${data.isConnected ? 'bg-green-500' : 'bg-gray-300'}`} title={data.isConnected ? "Connected" : "Not Connected"} />
            <span className="text-[10px] text-muted-foreground">{data.isConnected ? "Active" : "Disconnected"}</span>
          </div>
          {data.config && Object.keys(data.config).length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              <Settings className="inline h-3 w-3 mr-1" />
              Configured
            </div>
          )}
        </div>
      </div>

      {data.type !== "end" && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3"
          style={{ background: color }}
        />
      )}
    </div>
  );
});

WorkflowNode.displayName = "WorkflowNode";
