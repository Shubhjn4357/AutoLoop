"use client";

import { useState, useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import { NodeData } from './node-editor';

interface HistoryState {
    nodes: Node<NodeData>[];
    edges: Edge[];
}

export function useUndoRedo(
    initialNodes: Node<NodeData>[],
    initialEdges: Edge[],
    maxHistory: number = 50
) {
    // Past stack: Array of states
    const [past, setPast] = useState<HistoryState[]>([]);
    // Future stack: Array of states (for redo)
    const [future, setFuture] = useState<HistoryState[]>([]);

    // Current state is typically held in the parent component (controlled by ReactFlow)
    // But to manage history efficiently, we need to know when to "push" to history.

    // Helper to take a snapshot
    const takeSnapshot = useCallback((nodes: Node<NodeData>[], edges: Edge[]) => {
        setPast((p) => {
            // Don't push if the last state is identical (deep check might be expensive, 
            // but for now relying on user interactions is key. 
            // We assume this is called only on significant changes like 'onNodesChange' end)
            const newPast = [...p, { nodes, edges }];
            if (newPast.length > maxHistory) {
                newPast.shift(); // Remove oldest
            }
            return newPast;
        });
        setFuture([]); // Clear future on new action
    }, [maxHistory]);

    const undo = useCallback((currentNodes: Node<NodeData>[], currentEdges: Edge[]) => {
        setPast((p) => {
            if (p.length === 0) return p;

            // const previous = p[p.length - 1]; // Unused
            const newPast = p.slice(0, p.length - 1);

            // Push current to future so we can redo
            setFuture((f) => [...f, { nodes: currentNodes, edges: currentEdges }]);

            return newPast;
        });

        // Return the state to restore
        return past.length > 0 ? past[past.length - 1] : null;
    }, [past]);

    const redo = useCallback((currentNodes: Node<NodeData>[], currentEdges: Edge[]) => {
        setFuture((f) => {
            if (f.length === 0) return f;

            // const next = f[f.length - 1]; // Unused
            const newFuture = f.slice(0, f.length - 1);

            // Push current to past
            setPast((p) => [...p, { nodes: currentNodes, edges: currentEdges }]);

            return newFuture;
        });

        return future.length > 0 ? future[future.length - 1] : null;
    }, [future]);

    return {
        undo,
        redo,
        takeSnapshot,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        past,
        future
    };
}
