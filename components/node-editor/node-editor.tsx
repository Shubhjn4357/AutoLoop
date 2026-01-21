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
  SelectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Save, Play, Copy, Trash2, Undo, Redo, FileText, Loader2, Download, Upload, HelpCircle, BookOpen, Hand, MousePointer2 } from "lucide-react";
import { ImportWorkflowDialog } from "./import-workflow-dialog";
import { NodeConfigDialog } from "./node-config-dialog";
import { WorkflowNode } from "./workflow-node";
import { WorkflowTemplatesDialog } from "./workflow-templates-dialog";
import { WorkflowGuideDialog } from "./workflow-guide-dialog";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const nodeTypes = {
  workflowNode: WorkflowNode,
};

export interface NodeData {
  label: string;
  type: "start" | "condition" | "template" | "delay" | "custom" | "gemini" | "apiRequest" | "agent" | "webhook" | "schedule" | "merge" | "splitInBatches" | "filter" | "set" | "scraper";
  config?: {
    templateId?: string;
    delayHours?: number;
    condition?: string;
    customCode?: string;
    aiPrompt?: string;
    // API Request config
    url?: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    headers?: string;
    body?: string;
    // Agent config
    agentPrompt?: string;
    agentContext?: string;
    // New Nodes
    webhookMethod?: "GET" | "POST";
    scheduleCron?: string;
    filterCondition?: string;
    setVariables?: Record<string, string>;
    // Scraper config
    scraperAction?: "summarize" | "extract-emails" | "clean-html" | "markdown";
    scraperInputField?: string;
  };
  isConnected?: boolean;
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
  workflowId?: string;
}

export function NodeEditor({
  initialNodes = [],
  initialEdges = [],
  onSave,
  isSaving = false,
  workflowId,
}: NodeEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update node connection status when edges change
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const isConnected = edges.some(
          (edge) => edge.source === node.id || edge.target === node.id
        );
        return {
          ...node,
          data: {
            ...node.data,
            isConnected,
          },
        };
      })
    );
  }, [edges, setNodes]);

  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node<NodeData>[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedNodes, setCopiedNodes] = useState<Node<NodeData>[]>([]);
  const [canvasMode, setCanvasMode] = useState<'drag' | 'select'>('drag');
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
    if (copiedNodes.length === 0) return;

    const newNodes = copiedNodes.map((node) => ({
      ...node,
      id: `${node.data.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      selected: true,
    }));

    setNodes((nds) => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]);
    setSelectedNodes(newNodes);
    saveToHistory();
  }, [copiedNodes, setNodes, saveToHistory]);

  // Delete selected node handler - using ref to avoid hoisting issues
  const handleDeleteSelectedNodeRef = useRef<(() => void) | null>(null);

  const handleDeleteSelectedNode = useCallback(() => {
    if (selectedNodes.length > 0) {
      const selectedIds = selectedNodes.map(n => n.id);
      setNodes((nds) => nds.filter((n) => !selectedIds.includes(n.id)));
      setEdges((eds) =>
        eds.filter((e) => !selectedIds.includes(e.source) && !selectedIds.includes(e.target))
      );
      setSelectedNodes([]);
      setSelectedNode(null);
      saveToHistory();
    } else if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
      );
      setSelectedNode(null);
      saveToHistory();
    }
  }, [selectedNode, selectedNodes, setNodes, setEdges, saveToHistory]);

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
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedNodes.length > 0) {
          e.preventDefault();
          setCopiedNodes(selectedNodes);
        } else if (selectedNode) {
          e.preventDefault();
          setCopiedNodes([selectedNode]);
        }
      }
      // Ctrl/Cmd + V for paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedNodes.length > 0) {
        e.preventDefault();
        handlePasteNodeRef.current?.();
      }
      // Delete key to delete selected node
      if (e.key === 'Delete' && (selectedNode || selectedNodes.length > 0)) {
        e.preventDefault();
        handleDeleteSelectedNodeRef.current?.();
      }
      // Ctrl/Cmd + A for Select All
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
        setSelectedNodes(nodes);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedNodes, copiedNodes, handleUndo, handleRedo, nodes, setNodes]);

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
        apiRequest: "API Request",
        agent: "Agent with Excel",
        webhook: "Webhook",
        schedule: "Schedule",
        merge: "Merge",
        splitInBatches: "Loop",
        filter: "Filter",
        set: "Set Variables",
        scraper: "Scraper Action",
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

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: "", // Indicating pane
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
    (nodeId: string, config: NodeData["config"], label?: string) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, config, ...(label ? { label } : {}) } }
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
    if (!workflowId) {
      toast({
        title: "Error",
        description: "Please save the workflow before running it.",
        variant: "destructive",
      });
      return;
    }

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
    toast({
      title: "Starting Execution",
      description: "Running workflow on pending businesses..."
    });

    try {
      const response = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Execution Completed",
          description: `Processed ${data.totalProcessed} businesses.`,
        });
        console.log("Execution Logs:", data.logs);
      } else {
        toast({
          title: "Execution Failed",
          description: "Check console for logs.",
          variant: "destructive",
        });
        console.error("Execution Logs:", data.logs);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute workflow",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsExecuting(false);
    }
  }, [workflowId, nodes, toast]);

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
    <TooltipProvider>
    <div className="h-full w-full flex flex-col">
      {/* Toolbar */}
      <Card className="mb-4">
        <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span>Workflow Editor</span>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleUndo}
                      size="icon"
                      variant="ghost"
                      disabled={historyIndex <= 0}
                    >
                      <Undo className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleRedo}
                      size="icon"
                      variant="ghost"
                      disabled={historyIndex >= history.length - 1}
                    >
                      <Redo className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
                </Tooltip>

                <div className="w-px h-6 bg-border mx-1 self-center" />

                <div className="flex items-center border rounded-md mr-1 overflow-hidden">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={canvasMode === 'drag' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8 rounded-none"
                        onClick={() => setCanvasMode('drag')}
                      >
                        <Hand className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Pan Mode (Drag to move canvas)</TooltipContent>
                  </Tooltip>
                  <div className="w-px h-full bg-border" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={canvasMode === 'select' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8 rounded-none"
                        onClick={() => setCanvasMode('select')}
                      >
                        <MousePointer2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Select Mode (Drag to select nodes)</TooltipContent>
                  </Tooltip>
                </div>

                <div className="w-px h-6 bg-border mx-1 self-center" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setIsGuideOpen(true)}
                      size="icon"
                      variant="ghost"
                    >
                      <BookOpen className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Workflow Guide</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setIsTemplatesOpen(true)}
                      size="icon"
                      variant="ghost"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Templates</TooltipContent>
                </Tooltip>

                <div className="w-px h-6 bg-border mx-1 self-center" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleSave} size="icon" variant="outline" disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save Workflow</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={executeWorkflow}
                      size="icon"
                      variant="default"
                      disabled={isExecuting}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isExecuting ? "Running..." : "Test Run"}</TooltipContent>
                </Tooltip>

                <div className="w-px h-6 bg-border mx-1 self-center" />

                {/* Export / Import */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        try {
                          const data = JSON.stringify({ nodes, edges }, null, 2);
                          navigator.clipboard.writeText(data);
                          toast({ title: "Copied", description: "Workflow JSON copied to clipboard" });
                        } catch {
                          toast({ title: "Error", description: "Failed to copy workflow", variant: "destructive" });
                        }
                      }}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export JSON</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={() => setIsImportOpen(true)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Import JSON</TooltipContent>
                </Tooltip>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
            {/* Mobile: Scrollable toolbar */}
            <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto sm:max-h-none sm:overflow-visible">
              {/* Bulk Actions Menu if multiple selected */}
              {selectedNodes.length > 1 && (
                <div className="w-full bg-accent/20 p-2 rounded-md mb-2 flex items-center justify-between border border-accent">
                  <span className="text-sm font-medium">{selectedNodes.length} nodes selected</span>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteSelectedNodeRef.current?.()}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
                  </Button>
                </div>
              )}
              {/* Button Groups for better organization */}
              <div className="flex flex-col gap-2 w-full">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">Triggers:</span>
                  {["start", "webhook", "schedule"].map((type) => (
                    <Button key={type} variant="outline" size="sm" onClick={() => addNode(type as NodeData["type"])}>
                      <Plus className="h-3 w-3 mr-1" />{type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">Actions:</span>
                  {["template", "apiRequest", "gemini", "agent", "set", "scraper"].map((type) => (
                    <Tooltip key={type}>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => addNode(type as NodeData["type"])}>
                          <Plus className="h-3 w-3 mr-1" />{type === 'apiRequest' ? 'API' : type.charAt(0).toUpperCase() + type.slice(1)}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add {type} node</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">Logic:</span>
                  {["condition", "delay", "merge", "splitInBatches", "filter", "custom"].map((type) => (
                    <Tooltip key={type}>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => addNode(type as NodeData["type"])}>
                          <Plus className="h-3 w-3 mr-1" />{type === 'splitInBatches' ? 'Loop' : type.charAt(0).toUpperCase() + type.slice(1)}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add {type} node</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <HelpCircle className="h-3 w-3" /> Shortcuts: Ctrl+C/V (copy/paste), Ctrl+Z/Y (undo/redo), Delete (remove node)
          </p>
        </CardContent>
      </Card>

        {/* React Flow Canvas Canvas - Adjusted for mobile height */}
        <div className="flex-1 h-full border rounded-lg overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}

          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
          nodeTypes={nodeTypes}
          fitView
            selectionOnDrag={canvasMode === 'select'}
            selectionMode={SelectionMode.Partial}
            panOnDrag={canvasMode === 'drag'}
            panOnScroll={true}
            onSelectionChange={({ nodes }) => setSelectedNodes(nodes)}
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
          <div className="absolute bottom-2 left-2 z-10 text-[10px] text-muted-foreground opacity-50 pointer-events-none">
            Canvas
          </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-card border rounded-lg shadow-lg z-50 min-w-[180px] py-1"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
              {contextMenu.nodeId ? (
                <>
                  <button
                    onClick={() => {
                      const node = nodes.find(n => n.id === contextMenu.nodeId);
                      if (node) setCopiedNodes([node]);
                      setContextMenu(null);
                      toast({ title: "Copied", description: "Node copied to clipboard" });
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Node
                  </button>
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
                </>
              ) : (
                <>
                  <button
                    disabled={copiedNodes.length === 0}
                    onClick={() => {
                      handlePasteNode();
                      setContextMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                    Paste ({copiedNodes.length})
                  </button>
                </>
              )}
          </div>
        )}
      </div>

      {/* Node Configuration Dialog */}
      {selectedNode && (
        <NodeConfigDialog
          open={isConfigOpen}
          onOpenChange={setIsConfigOpen}
          node={selectedNode}
            onSave={(config, label) => {
              updateNodeConfig(selectedNode.id, config, label);
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
        <WorkflowGuideDialog open={isGuideOpen} onOpenChange={setIsGuideOpen} />
        <ImportWorkflowDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          onImport={(n, e) => {
            setNodes(n);
            setEdges(e);
            saveToHistory();
            setIsImportOpen(false);
          }}
        />
    </div>
    </TooltipProvider>
  );
}
