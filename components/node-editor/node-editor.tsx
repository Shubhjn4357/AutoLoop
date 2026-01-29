"use client";

import { useCallback, useState, useEffect, useRef } from "react";
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
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Save, Play, Copy, Trash2, Undo, Redo, FileText, Loader2, Download, Upload, HelpCircle, BookOpen, Hand, MousePointer2, Sparkles, TerminalIcon, X } from "lucide-react";
import { AiWorkflowDialog } from "./ai-workflow-dialog";
import { ImportWorkflowDialog } from "./import-workflow-dialog";
import { NodeConfigDialog } from "./node-config-dialog";
import { WorkflowNode } from "./workflow-node";
import { WorkflowTemplatesDialog } from "./workflow-templates-dialog";
import { WorkflowGuideDialog } from "./workflow-guide-dialog";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUndoRedo } from "./use-undo-redo";


const nodeTypes = {
  workflowNode: WorkflowNode,
};

export interface NodeData {
  label: string;
  type: "start" | "condition" | "template" | "delay" | "custom" | "gemini" | "apiRequest" | "agent" | "webhook" | "schedule" | "merge" | "splitInBatches" | "filter" | "set" | "scraper" | "linkedinScraper" | "linkedinMessage" | "abSplit" | "whatsappNode" | "database";
  config?: {
    templateId?: string;
    delayHours?: number; // kept for legacy or generic delay
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
    scraperAction?: "summarize" | "extract-emails" | "clean-html" | "markdown" | "fetch-url";
    scraperInputField?: string;
    // Conditional Sending Config
    preventDuplicates?: boolean;
    cooldownDays?: number;
    // LinkedIn Config
    linkedinKeywords?: string;
    linkedinLocation?: string;
    profileUrl?: string; // used for message
    messageBody?: string;
    // A/B Split Config
    abSplitWeight?: number; // percentage for path A (default 50)
    // WhatsApp Config
    templateName?: string;
    variables?: string[];
    // Database Config
    operation?: string;
    tableName?: string;
    data?: string;
  };
  isConnected?: boolean;
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
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId?: string;
    edgeId?: string;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedNodes, setCopiedNodes] = useState<Node<NodeData>[]>([]);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [canvasMode, setCanvasMode] = useState<'drag' | 'select'>('drag');
  const { toast } = useToast();

  // Undo/Redo hook
  const { undo, redo, canUndo, canRedo, takeSnapshot } = useUndoRedo(initialNodes, initialEdges);

  // Undo Handler
  const handleUndo = useCallback(() => {
    const prevState = undo(nodes, edges);
    if (prevState) {
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
    }
  }, [undo, nodes, edges, setNodes, setEdges]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    const nextState = redo(nodes, edges);
    if (nextState) {
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
    }
  }, [redo, nodes, edges, setNodes, setEdges]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        handleRedo();
      }
      // Save: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (onSave) {
          onSave(nodes, edges);
          toast({ title: "Saved", description: "Workflow saved successfully." });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, onSave, nodes, edges, toast]);

  // Auto-Save Removed
  // const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // const [isAutoSaving, setIsAutoSaving] = useState(false);

  // useEffect(() => { ... }) code removed

  // Paste node handler - using ref to avoid hoisting issues
  const handlePasteNodeRef = useRef<(() => void) | null>(null);

  const handlePasteNode = useCallback(() => {
    if (copiedNodes.length === 0) return;

    takeSnapshot(nodes, edges); // Snapshot before pasting

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
  }, [copiedNodes, setNodes, nodes, edges, takeSnapshot]);

  // Delete selected node handler - using ref to avoid hoisting issues
  const handleDeleteSelectedNodeRef = useRef<(() => void) | null>(null);

  const handleDeleteSelectedNode = useCallback(() => {
    if (selectedNodes.length > 0 || selectedNode) {
      takeSnapshot(nodes, edges);

      const idsToDelete = selectedNodes.length > 0
        ? selectedNodes.map(n => n.id)
        : (selectedNode ? [selectedNode.id] : []);

      if (idsToDelete.length > 0) {
        setNodes((nds) => nds.filter((n) => !idsToDelete.includes(n.id)));
        setEdges((eds) =>
          eds.filter((e) => !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target))
        );
        setSelectedNodes([]);
        setSelectedNode(null);
      }
    }
  }, [selectedNode, selectedNodes, setNodes, setEdges, takeSnapshot, nodes, edges]);

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
      takeSnapshot(nodes, edges);
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, takeSnapshot, nodes, edges]
  );

  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const addNode = useCallback(
    (type: NodeData["type"]) => {
      const nodeLabels = {
        start: "Start",
        condition: "Condition",
        template: "Send Email",
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
        linkedinScraper: "LinkedIn Scraper",
        linkedinMessage: "LinkedIn Message",
        abSplit: "A/B Split",
        whatsappNode: "Send WhatsApp",
        database: "Database Operation",
      };

      // Calculate center position
      let position = { x: 250, y: 250 };
      if (rfInstance) {
        const { x, y, zoom } = rfInstance.getViewport();
        // Assuming a container width/height or using window as approximation if unknown, 
        // but reactflow usually fills parent. 
        // A safer bet is just center of the viewport - translation
        // Viewport x/y is the transformation. 
        // Center X in flow = (-viewportX + containerHalfWidth) / zoom
        // We'll approximate container as 1000x800 if not easily accessible, or use window/2
        const centerX = (-x + (window.innerWidth / 2)) / zoom;
        const centerY = (-y + (window.innerHeight / 2)) / zoom;
        position = { x: centerX - 100 + (Math.random() * 50), y: centerY - 50 + (Math.random() * 50) };
      }

      const newNode: Node<NodeData> = {
        id: `${type}-${Date.now()}`,
        type: "workflowNode",
        data: {
          label: nodeLabels[type],
          type,
          config: {},
        },
        position,
      };

      takeSnapshot(nodes, edges);
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, takeSnapshot, rfInstance, nodes, edges]
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

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        edgeId: edge.id,
      });
    },
    []
  );

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: "", // Indicating pane
    });
  }, []);

  const handleDeleteItem = useCallback(() => {
    if (!contextMenu) return;

    if (contextMenu.nodeId) {
      takeSnapshot(nodes, edges);
      setNodes((nds) => nds.filter((n) => n.id !== contextMenu.nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId)
      );
    } else if (contextMenu.edgeId) {
      takeSnapshot(nodes, edges);
      setEdges((eds) => eds.filter((e) => e.id !== contextMenu.edgeId));
    }

    setContextMenu(null);
  }, [contextMenu, setNodes, setEdges, takeSnapshot, nodes, edges]);

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

    takeSnapshot(nodes, edges);
    setNodes((nds) => [...nds, newNode]);
    setContextMenu(null);
  }, [contextMenu, nodes, setNodes, takeSnapshot, edges]);

  const updateNodeConfig = useCallback(
    (nodeId: string, config: NodeData["config"], label?: string) => {
      takeSnapshot(nodes, edges);
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, config, ...(label ? { label } : {}) } }
            : node
        )
      );
    },
    [setNodes, takeSnapshot, nodes, edges]
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

      setExecutionLogs(data.logs || []);
      setShowTerminal(true);

      if (data.success) {
        toast({
          title: "Execution Completed",
          description: `Processed ${data.totalProcessed} businesses. Check terminal for details.`,
        });
      } else {
        toast({
          title: "Execution Failed",
          description: "Check terminal for logs.",
          variant: "destructive",
        });
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
    takeSnapshot(nodes, edges);
    setNodes(templateNodes);
    setEdges(templateEdges);
    setIsTemplatesOpen(false);
  }, [setNodes, setEdges, takeSnapshot, nodes, edges]);

  const handleAiGenerate = useCallback((generatedNodes: Node<NodeData>[], generatedEdges: Edge[]) => {
    takeSnapshot(nodes, edges);
    setNodes(generatedNodes);
    setEdges(generatedEdges);
    toast({
      title: "Workflow Generated",
      description: "AI successfully created the workflow structure.",
    });
  }, [setNodes, setEdges, takeSnapshot, toast, nodes, edges]);

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
                      onClick={() => setIsAiDialogOpen(true)}
                      variant="outline"
                      className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      AI Generate
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Generate workflow with AI</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowTerminal(true)}
                      size="icon"
                      variant="ghost"

                    >
                      <TerminalIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Terminal</TooltipContent>
                </Tooltip>
                <div className="w-px h-6 bg-border mx-1 self-center" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleUndo}
                      size="icon"
                      variant="ghost"
                      disabled={!canUndo}
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
                      disabled={!canRedo}
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
                  {["template", "apiRequest", "gemini", "agent", "set", "scraper", "whatsappNode"].map((type) => (
                    <Tooltip key={type}>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => addNode(type as NodeData["type"])}>
                          <Plus className="h-3 w-3 mr-1" />{type === 'apiRequest' ? 'API' : type === 'whatsappNode' ? 'WhatsApp' : type.charAt(0).toUpperCase() + type.slice(1)}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add {type} node</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">Logic:</span>
                  {["condition", "delay", "merge", "splitInBatches", "filter", "custom", "abSplit"].map((type) => (
                    <Tooltip key={type}>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => addNode(type as NodeData["type"])}>
                          <Plus className="h-3 w-3 mr-1" />{type === 'splitInBatches' ? 'Loop' : type === 'abSplit' ? 'A/B Split' : type.charAt(0).toUpperCase() + type.slice(1)}
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

            onInit={setRfInstance}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
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
                    onClick={handleDeleteItem}
                    className="w-full px-4 py-2 text-left hover:bg-destructive/10 text-destructive flex items-center gap-2 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Node
                  </button>
                </>
              ) : contextMenu.edgeId ? (
                <button
                  onClick={handleDeleteItem}
                  className="w-full px-4 py-2 text-left hover:bg-destructive/10 text-destructive flex items-center gap-2 text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Connection
                </button>
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
            onDelete={() => {
              takeSnapshot(nodes, edges);
              setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
              setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
              setSelectedNode(null);
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
            takeSnapshot(nodes, edges);
            setNodes(n);
            setEdges(e);
            setIsImportOpen(false);
          }}
        />
        <AiWorkflowDialog
          open={isAiDialogOpen}
          onOpenChange={setIsAiDialogOpen}
          onGenerate={handleAiGenerate}
        />
        {/* Terminal Panel */}
        {showTerminal && (
          <div className="fixed bottom-0 left-0 right-0 h-72 bg-slate-950 border-t border-slate-800 shadow-2xl flex flex-col z-200 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-3 text-slate-200">
                <TerminalIcon className="h-5 w-5 text-indigo-400" />
                <span className="text-sm font-mono font-bold tracking-tight">SYSTEM TERMINAL</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {executionLogs.length} Lines
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                  onClick={() => setExecutionLogs([])}
                  title="Clear Logs"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                  onClick={() => setShowTerminal(false)}
                  title="Close Terminal"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-xs md:text-sm text-slate-300 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {executionLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                  <TerminalIcon className="h-8 w-8 opacity-20" />
                  <p>Waiting for execution...</p>
                </div>
              ) : (
                executionLogs.map((log, i) => (
                  <div key={i} className="flex gap-3 border-b border-slate-900/50 pb-1 last:border-0 font-medium">
                    <span className="text-slate-600 select-none min-w-[24px] text-right">{(i + 1).toString().padStart(2, '0')}</span>
                    <span className={
                      log.toLowerCase().includes("error") ? "text-red-400 bg-red-950/20 px-1 rounded" :
                        log.toLowerCase().includes("warning") ? "text-amber-400 bg-amber-950/20 px-1 rounded" :
                          log.toLowerCase().includes("success") || log.toLowerCase().includes("completed") ? "text-emerald-400" :
                            log.toLowerCase().includes("sending") || log.toLowerCase().includes("running") ? "text-blue-400" :
                              log.toLowerCase().includes("response") ? "text-cyan-400" :
                                "text-slate-300"
                    }>
                      {log}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
    </div>
    </TooltipProvider>
  );
}
