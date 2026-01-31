"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/use-api";
import { Loader2, Plus, Terminal, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Automation {
    id: string;
    name: string;
    triggerType: string;
    keywords: string[];
    responseTemplate: string;
    isActive: boolean;
    createdAt: string;
}

export default function WhatsAppCommandCenter() {
    const { toast } = useToast();
    const { get, post, del, loading } = useApi<Automation[]>();
    const [commands, setCommands] = useState<Automation[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        command: "/",
        response: ""
    });

    const fetchCommands = useCallback(async () => {
        const data = await get("/api/social/automations");
        if (data) {
            // Filter only commands
            setCommands(data.filter(a => a.triggerType === "whatsapp_command"));
        }
    }, [get]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCommands();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchCommands]);

    const handleCreate = async () => {
        if (!formData.name || !formData.command || !formData.response) {
            toast({ title: "Error", description: "All fields are required", variant: "destructive" });
            return;
        }

        if (!formData.command.startsWith("/")) {
            toast({ title: "Error", description: "Command must start with /", variant: "destructive" });
            return;
        }

        const payload = {
            name: formData.name,
            triggerType: "whatsapp_command",
            actionType: "whatsapp_reply",
            keywords: [formData.command.toLowerCase().trim()],
            responseTemplate: formData.response
        };

        const result = await post("/api/social/automations/create", payload, {
            successMessage: "Command created successfully"
        });

        if (result) {
            setIsDialogOpen(false);
            setFormData({ name: "", command: "/", response: "" });
            fetchCommands();
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this command?")) {
            const result = await del(`/api/social/automations/${id}`, {
                successMessage: "Command deleted"
            });
            if (result) {
                fetchCommands();
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">WhatsApp Command Center</h1>
                    <p className="text-muted-foreground">Manage slash commands for your WhatsApp chatbot.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Command
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create New Command</DialogTitle>
                            <DialogDescription>
                                Define a command that users can send to trigger a specific response.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Friendly Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Start Menu"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="command">Command Trigger</Label>
                                <div className="relative">
                                    <Terminal className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="command"
                                        placeholder="/start"
                                        className="pl-9"
                                        value={formData.command}
                                        onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Must start with /</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="response">Response Message</Label>
                                <Textarea
                                    id="response"
                                    placeholder="Hello! Welcome to our service. Here are the options..."
                                    rows={4}
                                    value={formData.response}
                                    onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Command
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Commands</CardTitle>
                    <CardDescription>
                        {commands.length} active commands available to your users.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Command</TableHead>
                                    <TableHead className="hidden sm:table-cell">Name</TableHead>
                                    <TableHead className="hidden md:table-cell">Response Preview</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {commands.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                            No commands found. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    commands.map((cmd) => (
                                        <TableRow key={cmd.id}>
                                            <TableCell className="font-mono font-medium">{cmd.keywords[0]}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{cmd.name}</TableCell>
                                            <TableCell className="hidden md:table-cell max-w-[300px] truncate" title={cmd.responseTemplate}>
                                                {cmd.responseTemplate}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={cmd.isActive ? "default" : "secondary"}>
                                                    {cmd.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(cmd.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
