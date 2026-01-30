/**
 * Node Palette Component
 * Categorized, searchable node palette for workflow editor
 */

"use client";

import { useState } from 'react';
import { Search } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NODE_METADATA, NODE_CATEGORIES, type NodeType } from '@/types/workflow-nodes';

interface NodePaletteProps {
    onNodeSelect: (nodeType: NodeType) => void;
}

export function NodePalette({ onNodeSelect }: NodePaletteProps) {
    const [search, setSearch] = useState('');

    // Filter nodes based on search
    const filterNodes = (nodeTypes: readonly string[]) => {
        if (!search) return nodeTypes;

        return nodeTypes.filter(type => {
            const metadata = NODE_METADATA[type as NodeType];
            return (
                metadata.label.toLowerCase().includes(search.toLowerCase()) ||
                metadata.description.toLowerCase().includes(search.toLowerCase())
            );
        });
    };

    return (
        <div className="h-full flex flex-col">
            {/* Search */}
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search nodes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Categorized Tabs */}
            <Tabs defaultValue="ACTIONS" className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b h-auto p-0">
                    <TabsTrigger value="TRIGGERS" className="rounded-none">Triggers</TabsTrigger>
                    <TabsTrigger value="ACTIONS" className="rounded-none">Actions</TabsTrigger>
                    <TabsTrigger value="SOCIAL" className="rounded-none">Social</TabsTrigger>
                    <TabsTrigger value="LOGIC" className="rounded-none">Logic</TabsTrigger>
                    <TabsTrigger value="AI" className="rounded-none">AI</TabsTrigger>
                </TabsList>

                {/* Triggers */}
                <TabsContent value="TRIGGERS" className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filterNodes(NODE_CATEGORIES.TRIGGERS).map(type => (
                        <NodeCard
                            key={type}
                            nodeType={type as NodeType}
                            onClick={() => onNodeSelect(type as NodeType)}
                        />
                    ))}
                </TabsContent>

                {/* Actions */}
                <TabsContent value="ACTIONS" className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filterNodes(NODE_CATEGORIES.ACTIONS).map(type => (
                        <NodeCard
                            key={type}
                            nodeType={type as NodeType}
                            onClick={() => onNodeSelect(type as NodeType)}
                        />
                    ))}
                </TabsContent>

                {/* Social */}
                <TabsContent value="SOCIAL" className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filterNodes(NODE_CATEGORIES.SOCIAL).map(type => (
                        <NodeCard
                            key={type}
                            nodeType={type as NodeType}
                            onClick={() => onNodeSelect(type as NodeType)}
                        />
                    ))}
                </TabsContent>

                {/* Logic */}
                <TabsContent value="LOGIC" className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filterNodes(NODE_CATEGORIES.LOGIC).map(type => (
                        <NodeCard
                            key={type}
                            nodeType={type as NodeType}
                            onClick={() => onNodeSelect(type as NodeType)}
                        />
                    ))}
                </TabsContent>

                {/* AI */}
                <TabsContent value="AI" className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filterNodes(NODE_CATEGORIES.AI).map(type => (
                        <NodeCard
                            key={type}
                            nodeType={type as NodeType}
                            onClick={() => onNodeSelect(type as NodeType)}
                        />
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function NodeCard({ nodeType, onClick }: { nodeType: NodeType; onClick: () => void }) {
    const metadata = NODE_METADATA[nodeType];
    const Icon = Icons[metadata.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;

    return (
        <button
            onClick={onClick}
            className="w-full p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary transition-colors text-left group"
        >
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-md bg-background ${metadata.color}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{metadata.label}</div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {metadata.description}
                    </p>
                </div>
            </div>
        </button>
    );
}
