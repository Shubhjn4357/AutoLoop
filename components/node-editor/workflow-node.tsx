import { memo } from "react";
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
  scraper: "#c026d3",
  linkedinScraper: "#0077b5",
  linkedinMessage: "#0077b5",
  abSplit: "#ec4899",
  whatsappNode: "#25D366",
  database: "#60a5fa",
  social_post: "#1877F2", 
  social_reply: "#25D366", 
  social_monitor: "#1877F2", 
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
  scraper: "🕸️",
  linkedinScraper: "👔",
  linkedinMessage: "💬",
  abSplit: "🔀",
  whatsappNode: "📱",
  database: "💾",
  social_post: "📮",
  social_reply: "💬",
  social_monitor:"🔍"
};

export const WorkflowNode = memo(({ data, selected }: NodeProps<NodeData>) => {
  const color = nodeColors[data.type];
  const icon = nodeIcons[data.type];

  return (
    <div
      className="shadow-md rounded-lg border bg-white min-w-[200px] overflow-hidden transition-shadow hover:shadow-lg"
      style={{
        borderColor: selected ? color : "#e2e8f0",
        borderWidth: selected ? "2px" : "1px",
      }}
    >
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: color }}
      />
      <div className="px-4 py-3">
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

      {data.type === "condition" ? (
        <div className="flex justify-between w-full mt-2 relative">
          <div className="relative">
            <Handle
              type="source"
              id="true"
              position={Position.Bottom}
              className="w-3 h-3 left-2"
              style={{ background: "#22c55e" }}
            />
            <span className="text-[10px] text-green-600 absolute top-3 left-0 font-bold">True</span>
          </div>
          <div className="relative">
            <Handle
              type="source"
              id="false"
              position={Position.Bottom}
              className="w-3 h-3 left-auto right-2"
              style={{ background: "#ef4444" }}
            />
            <span className="text-[10px] text-red-600 absolute top-3 right-0 font-bold">False</span>
          </div>
        </div>
        ) : data.type === "abSplit" ? (
          <div className="flex justify-between w-full mt-2 relative min-w-[120px]">
            <div className="relative">
              <Handle
                type="source"
                id="a"
                position={Position.Bottom}
                className="w-3 h-3 left-2"
                style={{ background: "#3b82f6" }}
              />
              <span className="text-[10px] text-blue-600 absolute top-3 left-0 font-bold">Path A</span>
            </div>
            <div className="relative">
              <Handle
                type="source"
                id="b"
                position={Position.Bottom}
                className="w-3 h-3 left-auto right-2"
                style={{ background: "#a855f7" }}
              />
              <span className="text-[10px] text-purple-600 absolute top-3 right-0 font-bold">Path B</span>
            </div>
          </div>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3"
          style={{ background: color }}
        />
      )}
      </div>
    </div>
  );
});

WorkflowNode.displayName = "WorkflowNode";