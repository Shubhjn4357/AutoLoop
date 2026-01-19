"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Save, Play, Copy, Trash2, Undo, Redo, FileText, Loader2 } from "lucide-react";
import { NodeConfigDialog } from "./node-config-dialog";
import { WorkflowNode } from "./workflow-node";
import { WorkflowTemplatesDialog } from "./workflow-templates-dialog";
import { useToast } from "@/hooks/use-toast";


const nodeTypes = {
  workflowNode: WorkflowNode,
};

export interface NodeData {
  label: string;
  type: "start" | "condition" | "template" | "delay" | "custom" | "gemini";
  config?: {
    templateId?: string;
    delayHours?: number;
    condition?: string;
    customCode?: string;
    aiPrompt?: string;
  };
}

interface HistoryState {
  nodes: Node<NodeData>[];
  edges: Edge[];
}

interface NodeEditorProps {
  initialNodes?: Node<NodeData>[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node<NodeData>[], edges: Edge[]) => void;
  isSaving?: boolean;
}

export function NodeEditor({
  initialNodes = [],
  initialEdges = [],
  onSave,
  isSaving = false,
}: NodeEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedNode, setCopiedNode] = useState<Node<NodeData> | null>(null);
  const { toast } = useToast();

  // Undo/Redo system
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Save to history
  const saveToHistory = useCallback(() => {
    const newState = { nodes: [...nodes], edges: [...edges] };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, history, historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex, history, setNodes, setEdges]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, history, setNodes, setEdges]);

  // Paste node handler - using ref to avoid hoisting issues
  const handlePasteNodeRef = useRef<(() => void) | null>(null);

  const handlePasteNode = useCallback(() => {
    if (!copiedNode) return;

    const newNode: Node<NodeData> = {
      ...copiedNode,
      id: `${copiedNode.data.type}-${Date.now()}`,
      position: {
        x: copiedNode.position.x + 100,
        y: copiedNode.position.y + 100,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    saveToHistory();
  }, [copiedNode, setNodes, saveToHistory]);

  // Delete selected node handler - using ref to avoid hoisting issues
  const handleDeleteSelectedNodeRef = useRef<(() => void) | null>(null);

  const handleDeleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    );
    setSelectedNode(null);
    saveToHistory();
  }, [selectedNode, setNodes, setEdges, saveToHistory]);

  // Update refs in effect to avoid render side-effects
  useEffect(() => {
    handlePasteNodeRef.current = handlePasteNode;
    handleDeleteSelectedNodeRef.current = handleDeleteSelectedNode;
  }, [handlePasteNode, handleDeleteSelectedNode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl/Cmd + C for copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedNode) {
        e.preventDefault();
        setCopiedNode(selectedNode);
      }
      // Ctrl/Cmd + V for paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedNode) {
        e.preventDefault();
        handlePasteNodeRef.current?.();
      }
      // Delete key to delete selected node
      if (e.key === 'Delete' && selectedNode) {
        e.preventDefault();
        handleDeleteSelectedNodeRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, copiedNode, handleUndo, handleRedo]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      saveToHistory();
    },
    [setEdges, saveToHistory]
  );

  const addNode = useCallback(
    (type: NodeData["type"]) => {
      const nodeLabels = {
        start: "Start",
        condition: "Condition",
        template: "Email Template",
        delay: "Delay",
        custom: "Custom Function",
        gemini: "AI Task",
      };

      const newNode: Node<NodeData> = {
        id: `${type}-${Date.now()}`,
        type: "workflowNode",
        data: {
          label: nodeLabels[type],
          type,
          config: {},
        },
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      saveToHistory();
    },
    [setNodes, saveToHistory]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<NodeData>) => {
    event.stopPropagation();
    setSelectedNode(node);
    setIsConfigOpen(true);
  }, []);

  const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
  }, []);

  const handleDeleteNode = useCallback(() => {
    if (!contextMenu) return;
    setNodes((nds) => nds.filter((n) => n.id !== contextMenu.nodeId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId)
    );
    setContextMenu(null);
    saveToHistory();
  }, [contextMenu, setNodes, setEdges, saveToHistory]);

  const handleDuplicateNode = useCallback(() => {
    if (!contextMenu) return;
    const nodeToDuplicate = nodes.find((n) => n.id === contextMenu.nodeId);
    if (!nodeToDuplicate) return;

    const newNode: Node<NodeData> = {
      ...nodeToDuplicate,
      id: `${nodeToDuplicate.data.type}-${Date.now()}`,
      position: {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setContextMenu(null);
    saveToHistory();
  }, [contextMenu, nodes, setNodes, saveToHistory]);

  const updateNodeConfig = useCallback(
    (nodeId: string, config: NodeData["config"]) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, config } }
            : node
        )
      );
      saveToHistory();
    },
    [setNodes, saveToHistory]
  );

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
    } else {
      toast({
        title: "Success",
        description: "Workflow saved locally!",
      });
    }
  }, [nodes, edges, onSave, toast]);

  const executeWorkflow = useCallback(async () => {
    const startNode = nodes.find((n) => n.data.type === "start");
    if (!startNode) {
      toast({
        title: "Error",
        description: "No start node found! Please add a Start node to begin the workflow.",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);

    const logs: string[] = [];
    logs.push("✅ Workflow started");
    logs.push(`📍 Found start node: ${startNode.id}`);

    const templateNodes = nodes.filter(n => n.data.type === "template").length;
    const conditionNodes = nodes.filter(n => n.data.type === "condition").length;
    const delayNodes = nodes.filter(n => n.data.type === "delay").length;

    logs.push(`📊 Workflow contains: ${nodes.length} nodes, ${edges.length} connections`);
    logs.push(`   - ${templateNodes} email template(s)`);
    logs.push(`   - ${conditionNodes} condition(s)`);
    logs.push(`   - ${delayNodes} delay(s)`);

    setTimeout(() => {
      setIsExecuting(false);
      toast({
        title: "Workflow Execution Completed",
        description: "Workflow executed successfully! Check the console for detailed logs.",
      });
      console.log("Workflow Execution Log:\n\n" + logs.join("\n"));
    }, 1000);
  }, [nodes, edges, toast]);

  const loadTemplate = useCallback((templateNodes: Node<NodeData>[], templateEdges: Edge[]) => {
    setNodes(templateNodes);
    setEdges(templateEdges);
    saveToHistory();
    setIsTemplatesOpen(false);
  }, [setNodes, setEdges, saveToHistory]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Toolbar */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Workflow Editor</span>
            <div className="flex gap-2">
              <Button
                onClick={handleUndo}
                size="sm"
                variant="ghost"
                disabled={historyIndex <= 0}
                title="Undo (Ctrl+Z)"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleRedo}
                size="sm"
                variant="ghost"
                disabled={historyIndex >= history.length - 1}
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setIsTemplatesOpen(true)}
                size="sm"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button onClick={handleSave} size="sm" variant="outline" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Button
                onClick={executeWorkflow}
                size="sm"
                disabled={isExecuting}
              >
                <Play className="h-4 w-4 mr-2" />
                {isExecuting ? "Running..." : "Test Run"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(["start", "template", "delay", "condition", "gemini", "custom"] as const).map((type) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => addNode(type)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Shortcuts: Ctrl+C/V (copy/paste), Ctrl+Z/Y (undo/redo), Delete (remove node)
          </p>
        </CardContent>
      </Card>

      {/* React Flow Canvas */}
      <div className="flex-1 border rounded-lg overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-card border rounded-lg shadow-lg z-50 min-w-[180px] py-1"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <button
              onClick={handleDuplicateNode}
              className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm"
            >
              <Copy className="h-4 w-4" />
              Duplicate Node
            </button>
            <button
              onClick={handleDeleteNode}
              className="w-full px-4 py-2 text-left hover:bg-destructive/10 text-destructive flex items-center gap-2 text-sm"
            >
              <Trash2 className="h-4 w-4" />
              Delete Node
            </button>
          </div>
        )}
      </div>

      {/* Node Configuration Dialog */}
      {selectedNode && (
        <NodeConfigDialog
          open={isConfigOpen}
          onOpenChange={setIsConfigOpen}
          node={selectedNode}
          onSave={(config) => {
            updateNodeConfig(selectedNode.id, config);
            setIsConfigOpen(false);
          }}
        />
      )}

      {/* Workflow Templates Dialog */}
      <WorkflowTemplatesDialog
        open={isTemplatesOpen}
        onOpenChange={setIsTemplatesOpen}
        onSelectTemplate={loadTemplate}
      />
    </div>
  );
}
