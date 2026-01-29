import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Loader2, Info, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Node } from "reactflow";
import { NodeData } from "./node-editor";
import { useApi } from "@/hooks/use-api";

interface NodeConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    node: Node<NodeData>;
    onSave: (config: NodeData["config"], label?: string) => void;
    onDelete?: () => void;
}

interface EmailTemplate {
    id: string;
    name: string;
}

const ALL_VARIABLES = [
    "business.name",
    "business.email",
    "business.website",
    "business.phone",
    "business.address",
    "business.rating",
    "business.reviewCount",
    "variables.aiResult",
    "variables.apiResponse",
    "variables.scrapedData",
    "variables.customVar"
];

const NODE_HELPERS = {
    start: {
        description: "The starting point of your workflow.",
        variables: []
    },
    condition: {
        description: "Checks a condition to decide which path to take (True/False).",
        variables: ALL_VARIABLES
    },
    template: {
        description: "Sends an automated email using a selected template.",
        variables: ALL_VARIABLES
    },
    delay: {
        description: "Pauses the workflow for a specified duration.",
        variables: []
    },
    custom: {
        description: "Executes custom JavaScript code for advanced logic.",
        variables: ["business", "variables", "context"]
    },
    gemini: {
        description: "Uses AI to generate text. Result saved to {variables.aiResult}.",
        variables: ALL_VARIABLES
    },
    apiRequest: {
        description: "Makes an HTTP request. Response saved to {variables.apiResponse}.",
        variables: ALL_VARIABLES
    },
    database: {
        description: "Save data to a custom variable list or external DB.",
        variables: ["result"]
    },
    webhook: {
        description: "Triggers the workflow via an external HTTP call.",
        variables: ["query", "body"]
    },
    schedule: {
        description: "Runs the workflow repeatedly on a cron schedule.",
        variables: []
    },
    scraper: {
        description: "Processes scraped data. Result saved to {variables.scrapedData}.",
        variables: ALL_VARIABLES
    },
    filter: {
        description: "Filters items based on a condition; stops execution if false.",
        variables: ["item", ...ALL_VARIABLES]
    },
    set: {
        description: "Defines or updates variables in the workflow context.",
        variables: []
    },
    merge: {
        description: "Merges multiple execution branches back into one.",
        variables: []
    },
    splitInBatches: {
        description: "Iterates over a list of items (Loop).",
        variables: ["items"]
    },
    agent: {
        description: "AI Agent that processes Excel/CSV data. Result saved to {variables.aiResult}.",
        variables: ["row", "context", ...ALL_VARIABLES]
    },
    linkedinScraper: {
        description: "Scrapes LinkedIn profiles via Google. Result saved to {variables.linkedinResults}.",
        variables: ALL_VARIABLES
    },
    linkedinMessage: {
        description: "Sends a connection request or message to a LinkedIn profile.",
        variables: ALL_VARIABLES
    }
};

export function NodeConfigDialog({ open, onOpenChange, node, onSave, onDelete }: NodeConfigDialogProps) {
    const [config, setConfig] = useState<NodeData["config"]>(node.data.config || {});
    const [label, setLabel] = useState(node.data.label);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [whatsappTemplates, setWhatsappTemplates] = useState<{ name: string, language: string }[]>([]);
    const [testInput, setTestInput] = useState("{}");
    const [testOutput, setTestOutput] = useState("");
    const [isTesting, setIsTesting] = useState(false);
    const [activeTab, setActiveTab] = useState("config");

    const { get, loading: loadingTemplates } = useApi<{ templates: EmailTemplate[] }>();

    // Reset state when node changes or dialog opens
    useEffect(() => {
        if (open) {
            setConfig(node.data.config || {});
            setLabel(node.data.label);
            setTestInput(JSON.stringify(node.data.config || {}, null, 2));
            setTestOutput("");
        }
    }, [open, node.id, node.data.config, node.data.label]);

    // Fetch templates when dialog opens and node is template type
    useEffect(() => {
        if (open && node.data.type === "template") {
            const fetchTemplates = async () => {
                const result = await get('/api/templates');
                if (result) {
                    setTemplates(result.templates || []);
                } else {
                    // Fallback to default templates if API fails or returns null
                    setTemplates([
                        { id: 'template-1', name: 'Welcome Email' },
                        { id: 'template-2', name: 'Follow-up Email' },
                        { id: 'template-3', name: 'Custom Pitch' },
                    ]);
                }
            };
            fetchTemplates();
        }
    }, [open, node.data.type, get]);

    // Fetch WhatsApp templates
    useEffect(() => {
        if (open && node.data.type === "whatsappNode") {
            const fetchWaTemplates = async () => {
                const result = await get<{ templates: { name: string; language: string; status: string }[] }>('/api/whatsapp/templates');
                if (result && result.templates) {
                    setWhatsappTemplates(result.templates);
                } else {
                    setWhatsappTemplates([{ name: 'hello_world', language: 'en_US' }]);
                }
            };
            fetchWaTemplates();
        }
    }, [open, node.data.type, get]);

    const handleSave = () => {
        onSave(config, label);
    };

    const VariableInsert = ({ onInsert, variables }: { onInsert: (v: string) => void, variables: string[] }) => {
        if (!variables || variables.length === 0) return null;
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs ml-auto">
                        <Plus className="h-3 w-3" /> Insert Variable
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {variables.map((v) => (
                        <DropdownMenuItem key={v} onClick={() => onInsert(`{${v}}`)}>
                            {`{${v}}`}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    const renderConfigForm = () => {
        const nodeHelpers = NODE_HELPERS[node.data.type as keyof typeof NODE_HELPERS];
        const variables = nodeHelpers?.variables || [];

        switch (node.data.type) {
            case "start":
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            This is the starting point of your workflow.
                        </p>
                    </div>
                );

            case "condition":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="condition">Condition Expression</Label>
                                <VariableInsert
                                    variables={variables}
                                    onInsert={(v) => setConfig({ ...config, condition: (config?.condition || "") + v })}
                                />
                            </div>
                            <Input
                                id="condition"
                                placeholder="!website"
                                value={config?.condition || ""}
                                onChange={(e) => setConfig({ ...config, condition: e.target.value })}
                            />
                            <div className="text-xs text-muted-foreground">
                                <p>Examples: !website (no website), email (has email), category == &quot;restaurant&quot;</p>
                            </div>
                        </div>
                    </div>
                );

            case "template":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="templateId">Email Template</Label>
                            <Select
                                value={config?.templateId || ""}
                                onValueChange={(value) => setConfig({ ...config, templateId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingTemplates ? "Loading templates..." : "Select a template"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map((template) => (
                                        <SelectItem key={template.id} value={template.id}>
                                            {template.name}
                                        </SelectItem>
                                    ))}
                                    {templates.length === 0 && !loadingTemplates && (
                                        <SelectItem value="no-templates" disabled>
                                            No templates found
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Select which email template to send when this node is reached
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md">
                            <input
                                type="checkbox"
                                id="preventDuplicates"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={config?.preventDuplicates !== false} // Default to true
                                onChange={(e) => setConfig({ ...config, preventDuplicates: e.target.checked })}
                            />
                            <div className="space-y-1">
                                <Label htmlFor="preventDuplicates" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Prevent Duplicates
                                </Label>
                                <p className="text-[10px] text-muted-foreground">
                                    Don&apos;t send if this specific template was already sent to this business.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cooldownDays">Fatigue Management (Cool-down)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="cooldownDays"
                                    type="number"
                                    min="0"
                                    max="365"
                                    className="w-24"
                                    placeholder="3"
                                    value={config?.cooldownDays !== undefined ? config.cooldownDays : 3}
                                    onChange={(e) => setConfig({ ...config, cooldownDays: parseInt(e.target.value) || 0 })}
                                />
                                <span className="text-sm text-muted-foreground">days</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Skip if ANY email was sent to this business within this many days. Set to 0 to disable.
                            </p>
                        </div>
                    </div>
                );

            case "delay":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="delayHours">Delay (hours)</Label>
                            <Input
                                id="delayHours"
                                type="number"
                                min="1"
                                max="720"
                                placeholder="24"
                                value={config?.delayHours || ""}
                                onChange={(e) => setConfig({ ...config, delayHours: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Number of hours to wait before continuing to the next node
                            </p>
                        </div>
                    </div>
                );

            case "custom":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="customCode">Custom Function Code</Label>
                                <VariableInsert
                                    variables={variables}
                                    onInsert={(v) => setConfig({ ...config, customCode: (config?.customCode || "") + v })}
                                />
                            </div>
                            <Textarea
                                id="customCode"
                                placeholder="// JavaScript code here&#10;return true;"
                                rows={6}
                                value={config?.customCode || ""}
                                onChange={(e) => setConfig({ ...config, customCode: e.target.value })}
                                className="font-mono text-sm"
                            />
                            <div className="text-xs text-muted-foreground">
                                <p>Write custom JavaScript code. Return true to continue, false to stop.</p>
                            </div>
                        </div>
                    </div>
                );

            case "gemini":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="aiPrompt">AI Prompt</Label>
                                <VariableInsert
                                    variables={variables}
                                    onInsert={(v) => setConfig({ ...config, aiPrompt: (config?.aiPrompt || "") + v })}
                                />
                            </div>
                            <Textarea
                                id="aiPrompt"
                                placeholder="Generate a personalized email subject line for {name}"
                                rows={4}
                                value={config?.aiPrompt || ""}
                                onChange={(e) => setConfig({ ...config, aiPrompt: e.target.value })}
                            />
                            <div className="text-xs text-muted-foreground">
                                <p>Enter a prompt for Gemini AI.</p>
                            </div>
                        </div>
                    </div>
                );

            case "database":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="operation">Operation</Label>
                            <Select
                                value={config?.operation || "upsert"}
                                onValueChange={(value) => setConfig({ ...config, operation: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Upsert" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="upsert">Upsert (Insert or Update)</SelectItem>
                                    <SelectItem value="insert">Insert Only</SelectItem>
                                    <SelectItem value="update">Update Only</SelectItem>
                                    <SelectItem value="delete">Delete</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="tableName">Table / Collection Name</Label>
                                <VariableInsert
                                    variables={variables}
                                    onInsert={(v) => setConfig({ ...config, tableName: (config?.tableName || "") + v })}
                                />
                            </div>
                            <Input
                                id="tableName"
                                placeholder="leads"
                                value={config?.tableName || ""}
                                onChange={(e) => setConfig({ ...config, tableName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="data">Data (JSON)</Label>
                                <VariableInsert
                                    variables={variables}
                                    onInsert={(v) => setConfig({ ...config, data: (config?.data || "") + v })}
                                />
                            </div>
                            <Textarea
                                id="data"
                                placeholder='{ "email": "{business.email}", "status": "processed" }'
                                rows={5}
                                value={config?.data || ""}
                                onChange={(e) => setConfig({ ...config, data: e.target.value })}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                The data to save. For updates, ensure you include the ID or unique key.
                            </p>
                        </div>
                    </div>
                );

            case "apiRequest":
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1 space-y-2">
                                <Label htmlFor="method">Method</Label>
                                <Select
                                    value={config?.method || "GET"}
                                    onValueChange={(value: "GET" | "POST" | "PUT" | "DELETE") => setConfig({ ...config, method: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="GET" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-3 space-y-2">
                                <Label htmlFor="url">URL</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="url"
                                        placeholder="https://api.example.com/v1/resource"
                                        value={config?.url || ""}
                                        onChange={(e) => setConfig({ ...config, url: e.target.value })}
                                    />
                                    <VariableInsert
                                        variables={variables}
                                        onInsert={(v) => setConfig({ ...config, url: (config?.url || "") + v })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="headers">Headers (JSON)</Label>
                            <Textarea
                                id="headers"
                                placeholder='{ "Authorization": "Bearer KEY", "Content-Type": "application/json" }'
                                rows={3}
                                value={config?.headers || ""}
                                onChange={(e) => setConfig({ ...config, headers: e.target.value })}
                                className="font-mono text-sm"
                            />
                        </div>
                        {(config?.method === "POST" || config?.method === "PUT") && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="body">Body (JSON)</Label>
                                    <VariableInsert
                                        variables={variables}
                                        onInsert={(v) => setConfig({ ...config, body: (config?.body || "") + v })}
                                    />
                                </div>
                                <Textarea
                                    id="body"
                                    placeholder='{ "key": "value" }'
                                    rows={4}
                                    value={config?.body || ""}
                                    onChange={(e) => setConfig({ ...config, body: e.target.value })}
                                    className="font-mono text-sm"
                                />
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Make external API requests. Useful for webhooks or data enrichment.
                        </p>
                    </div>
                );

            case "merge":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Merge Logic</Label>
                            <Select disabled value="any">
                                <SelectTrigger><SelectValue placeholder="Wait for ANY branch" /></SelectTrigger>
                                <SelectContent><SelectItem value="any">Wait for ANY branch</SelectItem></SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Currently supports merging when any input arrives.</p>
                        </div>
                    </div>
                );

            case "splitInBatches":
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            loops through an array of items from the previous node. The &apos;Done&apos; output triggers when finished.
                        </p>
                        <div className="bg-muted p-2 rounded text-xs">
                            Ensure the previous node returns an array (e.g., API List or CSV).
                        </div>
                    </div>
                );

            case "agent": // Fixed duplicated case structure
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="agentPrompt">Agent Instructions</Label>
                                <VariableInsert
                                    variables={variables}
                                    onInsert={(v) => setConfig({ ...config, agentPrompt: (config?.agentPrompt || "") + v })}
                                />
                            </div>
                            <Textarea
                                id="agentPrompt"
                                placeholder="Analyze the rows in the excel sheet and extract..."
                                rows={3}
                                value={config?.agentPrompt || ""}
                                onChange={(e) => setConfig({ ...config, agentPrompt: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="agentContext">Excel Data / Context (CSV)</Label>
                            <Textarea
                                id="agentContext"
                                placeholder="Paste CSV content here or data context..."
                                rows={6}
                                value={config?.agentContext || ""}
                                onChange={(e) => setConfig({ ...config, agentContext: e.target.value })}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Paste the content of your Excel sheet (as CSV) here for the agent to process.
                            </p>
                        </div>
                    </div>
                );
            case "webhook":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="webhookMethod">Webhook Method</Label>
                            <Select
                                value={config?.webhookMethod || "POST"}
                                onValueChange={(value: "GET" | "POST") => setConfig({ ...config, webhookMethod: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="POST" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GET">GET</SelectItem>
                                    <SelectItem value="POST">POST</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                This node triggers when the workflow URL is called with this method.
                            </p>
                        </div>
                    </div>
                );
            case "schedule":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="scheduleCron">Cron Expression</Label>
                            <Input
                                id="scheduleCron"
                                placeholder="0 9 * * 1 (Every Monday at 9AM)"
                                value={config?.scheduleCron || ""}
                                onChange={(e) => setConfig({ ...config, scheduleCron: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Standard Cron format.
                            </p>
                        </div>
                    </div>
                );

            case "filter":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="filterCondition">Filter Condition</Label>
                                <VariableInsert
                                    variables={variables}
                                    onInsert={(v) => setConfig({ ...config, filterCondition: (config?.filterCondition || "") + v })}
                                />
                            </div>
                            <Input
                                id="filterCondition"
                                placeholder="item.price > 100"
                                value={config?.filterCondition || ""}
                                onChange={(e) => setConfig({ ...config, filterCondition: e.target.value })}
                            />
                            <div className="text-xs text-muted-foreground">
                                <p>Expression that returns true/false. Use <code>item</code> to access current data.</p>
                            </div>
                        </div>
                    </div>
                );
            case "set":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="setVariables">Variables (JSON)</Label>
                            <Textarea
                                id="setVariables"
                                placeholder='{ "myVar": "value", "count": 1 }'
                                rows={4}
                                value={JSON.stringify(config?.setVariables || {}, null, 2)}
                                onChange={(e) => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        setConfig({ ...config, setVariables: parsed });
                                    } catch {
                                        // Allow editing invalid JSON transiently or use string
                                    }
                                }}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Define variables to append to the workflow execution context.
                            </p>
                        </div>
                    </div>
                );

            case "scraper":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="scraperAction">Scraper Action</Label>
                            <Select
                                value={config?.scraperAction || "extract-emails"}
                                onValueChange={(value) => setConfig({ ...config, scraperAction: value as "fetch-url" | "summarize" | "extract-emails" | "clean-html" | "markdown" })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fetch-url">Fetch URL Content</SelectItem>
                                    <SelectItem value="extract-emails">Extract Emails</SelectItem>
                                    <SelectItem value="summarize">Summarize Content</SelectItem>
                                    <SelectItem value="clean-html">Clean HTML / Remove Tags</SelectItem>
                                    <SelectItem value="markdown">Convert to Markdown</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="scraperInputField">Input Variable (or URL)</Label>
                                <VariableInsert
                                    variables={variables}
                                    onInsert={(v) => setConfig({ ...config, scraperInputField: (config?.scraperInputField || "") + v })}
                                />
                            </div>
                            <Input
                                id="scraperInputField"
                                placeholder="{scrapedContent} or {business.website}"
                                value={config?.scraperInputField || ""}
                                onChange={(e) => setConfig({ ...config, scraperInputField: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                The variable or URL to process. Use <code>{`{business.website}`}</code> for fetching.
                            </p>
                        </div>
                    </div>
                );

            case "linkedinScraper":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="linkedinKeywords">Keywords</Label>
                                <VariableInsert
                                    variables={variables}
                                    onInsert={(v) => setConfig({ ...config, linkedinKeywords: (config?.linkedinKeywords || "") + v })}
                                />
                            </div>
                            <Input
                                id="linkedinKeywords"
                                placeholder="Software Engineer, CTO, Marketing Manager"
                                value={config?.linkedinKeywords || ""}
                                onChange={(e) => setConfig({ ...config, linkedinKeywords: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Comma-separated keywords or variables.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="linkedinLocation">Location</Label>
                                <VariableInsert
                                    variables={variables}
                                    onInsert={(v) => setConfig({ ...config, linkedinLocation: (config?.linkedinLocation || "") + v })}
                                />
                            </div>
                            <Input
                                id="linkedinLocation"
                                placeholder="San Francisco, New York"
                                value={config?.linkedinLocation || ""}
                                onChange={(e) => setConfig({ ...config, linkedinLocation: e.target.value })}
                            />
                        </div>
                    </div>
                );

            case "linkedinMessage":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="profileUrl">LinkedIn Profile URL</Label>
                                <VariableInsert
                                    variables={variables}
                                    onInsert={(v) => setConfig({ ...config, profileUrl: (config?.profileUrl || "") + v })}
                                />
                            </div>
                            <Input
                                id="profileUrl"
                                placeholder="{linkedinResults[0].website} or https://linkedin.com/..."
                                value={config?.profileUrl || ""}
                                onChange={(e) => setConfig({ ...config, profileUrl: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="messageBody">Message Body</Label>
                                <VariableInsert
                                    variables={variables}
                                    onInsert={(v) => setConfig({ ...config, messageBody: (config?.messageBody || "") + v })}
                                />
                            </div>
                            <Textarea
                                id="messageBody"
                                placeholder="Hi {business.name}, I noticed that..."
                                rows={5}
                                value={config?.messageBody || ""}
                                onChange={(e) => setConfig({ ...config, messageBody: e.target.value })}
                            />
                        </div>
                    </div>
                );

            case "whatsappNode":
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="templateName">Template Name</Label>
                            {whatsappTemplates.length > 0 ? (
                                <Select
                                    value={config?.templateName || ""}
                                    onValueChange={(value) => setConfig({ ...config, templateName: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {whatsappTemplates.map((t) => (
                                            <SelectItem key={t.name} value={t.name}>
                                                {t.name} ({t.language})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    id="templateName"
                                    value={config?.templateName || ""}
                                    onChange={(e) => setConfig({ ...config, templateName: e.target.value })}
                                    placeholder="hello_world"
                                />
                            )}
                            <p className="text-xs text-muted-foreground">
                                Select an approved template from Meta.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Variables (comma separated)</Label>
                                <VariableInsert
                                    variables={variables}
                                    onInsert={(v) => {
                                        const current = config?.variables || [];
                                        setConfig({ ...config, variables: [...current, v] });
                                    }}
                                />
                            </div>
                            <Input
                                value={(config?.variables || []).join(", ")}
                                onChange={(e) => {
                                    const vars = e.target.value.split(",").map(v => v.trim()); // Allow empty strings while typing?? Better logic needed or simple text
                                    // For simplicity let's just parse comma separated
                                    setConfig({ ...config, variables: vars });
                                }}
                                placeholder="{{businessName}}, {{firstName}}"
                            />
                            <p className="text-xs text-muted-foreground">
                                Order matters. These map to {`{{1}}`}, {`{{2}}`} in your template.
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Configure {node.data.label}</DialogTitle>
                    <DialogDescription>
                        Set up the configuration and test logic for this node.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 border-b">
                        <TabsList className="bg-transparent p-0 gap-6">
                            <TabsTrigger value="config" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3">Configuration</TabsTrigger>
                            <TabsTrigger value="test" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3">Test & Preview</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 p-6 max-h-[60vh]">
                        <TabsContent value="config" className="mt-0 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="nodeLabel">Node Name</Label>
                                <Input
                                    id="nodeLabel"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                />
                            </div>

                            {/* Helper Section */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                <h4 className="text-sm font-semibold flex items-center gap-2 mb-1">
                                    <Info className="h-4 w-4 text-blue-500" />
                                    How to use this node
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {NODE_HELPERS[node.data.type as keyof typeof NODE_HELPERS]?.description || "Configure this node's settings below."}
                                </p>
                                {NODE_HELPERS[node.data.type as keyof typeof NODE_HELPERS]?.variables?.length > 0 && (
                                    <div className="text-xs">
                                        <span className="font-medium text-blue-600 dark:text-blue-400">Available Variables:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {NODE_HELPERS[node.data.type as keyof typeof NODE_HELPERS]?.variables.map((v) => (
                                                <code key={v} className="bg-background px-1.5 py-0.5 rounded border text-muted-foreground">
                                                    {`{${v}}`}
                                                </code>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {renderConfigForm()}
                        </TabsContent>

                        <TabsContent value="test" className="mt-0 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Test Input (JSON Context)</Label>
                                    <VariableInsert
                                        variables={NODE_HELPERS[node.data.type as keyof typeof NODE_HELPERS]?.variables || []}
                                        onInsert={(v) => setTestInput((prev) => {
                                            // Try to insert cleanly if possible, otherwise append
                                            return prev + ` "${v}"`;
                                        })}
                                    />
                                </div>
                                <Textarea
                                    className="font-mono text-xs"
                                    rows={8}
                                    placeholder={'{\n  "business": {\n    "name": "Test Business",\n    "website": "example.com",\n    "email": "test@example.com"\n  },\n  "variables": {\n    "scrapedData": "<html>...</html>"\n  }\n}'}
                                    value={testInput}
                                    onChange={(e) => setTestInput(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Mock the variables available to this node. Defines <code>business</code>, <code>variables</code> etc.</p>
                            </div>

                            <Button size="sm" onClick={async () => {
                                setIsTesting(true);
                                try {
                                    const input = JSON.parse(testInput || "{}");
                                    const response = await fetch("/api/workflows/test-node", {
                                        method: "POST",
                                        body: JSON.stringify({
                                            nodeType: node.data.type,
                                            config,
                                            inputContext: input
                                        })
                                    });
                                    const result = await response.json();
                                    setTestOutput(JSON.stringify(result, null, 2));
                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                } catch (e) {
                                    setTestOutput("Error: Invalid JSON Input or Test Failed");
                                } finally {
                                    setIsTesting(false);
                                }
                            }} disabled={isTesting}>
                                {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                                Run Test
                            </Button>

                            <div className="space-y-2">
                                <Label>Test Result</Label>
                                <div className="bg-slate-950 text-slate-50 p-3 rounded-md font-mono text-xs whitespace-pre-wrap min-h-[100px]">
                                    {testOutput || "Run a test to see the output..."}
                                </div>
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="mr-6 mb-4 flex justify-between sm:justify-between">
                    {onDelete && (
                        <Button variant="destructive" onClick={onDelete} className="mr-auto">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Node
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            Save Configuration
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
