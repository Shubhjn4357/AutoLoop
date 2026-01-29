import { BookOpen, Zap, Layers, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WorkflowGuideProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function WorkflowGuideDialog({ open, onOpenChange }: WorkflowGuideProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
                <div className="p-6 pb-2 shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-primary" />
                            Workflow Automation Guide
                        </DialogTitle>
                        <DialogDescription>
                            Master the art of automation with this comprehensive manual.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Tabs defaultValue="getting-started" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 border-b">
                        <TabsList className="w-full justify-start rounded-none border-b-0 p-0 h-auto bg-transparent gap-6">
                            <TabsTrigger value="getting-started" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3">Getting Started</TabsTrigger>
                            <TabsTrigger value="nodes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3">Node Types</TabsTrigger>
                            <TabsTrigger value="variables" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3">Variables & Logic</TabsTrigger>
                            <TabsTrigger value="best-practices" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3">Best Practices</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <TabsContent value="getting-started" className="space-y-6 mt-0">
                            <section className="space-y-4">
                                <h3 className="text-xl font-semibold">How Workflows Work</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Workflows are visual sequences of tasks that automate your business processes.
                                    Each step in the process is represented by a <strong>Node</strong>.
                                    Nodes are connected by <strong>Edges</strong> (lines) which determine the flow of execution.
                                </p>
                                <div className="grid md:grid-cols-3 gap-4 mt-4">
                                    <div className="border rounded-lg p-4 bg-muted/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Zap className="h-5 w-5 text-yellow-500" />
                                            <span className="font-semibold">1. Trigger</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Every workflow starts with a trigger (e.g., &quot;Start Node&quot;, &quot;Webhook&quot;, or &quot;Schedule&quot;). This initiates the process.
                                        </p>
                                    </div>
                                    <div className="border rounded-lg p-4 bg-muted/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Layers className="h-5 w-5 text-blue-500" />
                                            <span className="font-semibold">2. Process</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Data flows through nodes (e.g., &quot;AI Task&quot;, &quot;Condition&quot;). Each node performs an action or decision.
                                        </p>
                                    </div>
                                    <div className="border rounded-lg p-4 bg-muted/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Play className="h-5 w-5 text-green-500" />
                                            <span className="font-semibold">3. Action</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            The workflow results in tangible outcomes like sending emails, updating CRMs, or posting content.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <Separator />

                            <section className="space-y-4">
                                <h3 className="text-xl font-semibold">Creating Your First Workflow</h3>
                                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                                    <li>Drag a <Badge variant="outline">Trigger</Badge> node onto the canvas (or use the default Start node).</li>
                                    <li>Add <Badge variant="outline">Action</Badge> nodes to define what should happen.</li>
                                    <li>Connect the nodes by dragging from the bottom handle of one node to the top handle of another.</li>
                                    <li>Configure each node by clicking on it.</li>
                                    <li>Click <Button size="sm" variant="outline" className="h-6 text-xs mx-1">Save</Button> to persist your changes.</li>
                                    <li>Use <Button size="sm" variant="outline" className="h-6 text-xs mx-1">Test Run</Button> to verify the flow.</li>
                                </ol>
                            </section>
                        </TabsContent>

                        <TabsContent value="nodes" className="space-y-8 mt-0">
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-primary">Triggers</h3>
                                <div className="grid gap-4">
                                    <NodeCard icon="▶️" name="Start" description="The manual entry point. Used for testing or manual triggers." />
                                    <NodeCard icon="🎣" name="Webhook" description="Triggers when a specific URL provides data via POST/GET." />
                                    <NodeCard icon="📅" name="Schedule" description="Runs automatically at set intervals (using Cron syntax)." />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-primary">Actions</h3>
                                <div className="grid gap-4">
                                    <NodeCard icon="✉️" name="Template" description="Sends a pre-defined email template to a user/lead." />
                                    <NodeCard icon="🔗" name="API Request" description="Makes an external HTTP request (GET/POST/PUT/DELETE) to any service." />
                                    <NodeCard icon="🤖" name="AI Task (Gemini)" description="Uses Google Gemini to generate text, summarize data, or make decisions." />
                                    <NodeCard icon="📊" name="Agent" description="Specialized AI agent for processing structured data (Excel/CSV)." />
                                    <NodeCard icon="📝" name="Set Variables" description="Defines or updates variables in the workflow context." />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-primary">Logic & Flow Control</h3>
                                <div className="grid gap-4">
                                    <NodeCard icon="❓" name="Condition" description="Splits the flow into 'Yes/No' paths based on a logical expression." />
                                    <NodeCard icon="⏱️" name="Delay" description="Pauses execution for a set duration (hours)." />
                                    <NodeCard icon="⑃" name="Merge" description="Combines multiple branches back into a single flow." />
                                    <NodeCard icon="🔁" name="Loop (Split)" description="Iterates over a list of items, processing them one by one." />
                                    <NodeCard icon="🔍" name="Filter" description="Stops execution if the data doesn't match criteria." />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="variables" className="space-y-6 mt-0">
                            <section className="space-y-4">
                                <h3 className="text-xl font-semibold">Using Variables</h3>
                                <p className="text-muted-foreground">
                                    Variables allow you to pass data between nodes. You can access variables using the <code className="bg-muted px-1 rounded">{"{variable_name}"}</code> syntax in text fields, or strict JavaScript in code fields.
                                </p>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Common Variables</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-2">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <code className="bg-muted p-1 rounded">{"{email}"}</code>
                                            <span className="text-muted-foreground">The email address of the current contact</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <code className="bg-muted p-1 rounded">{"{name}"}</code>
                                            <span className="text-muted-foreground">The name of the contact/company</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <code className="bg-muted p-1 rounded">{"{website}"}</code>
                                            <span className="text-muted-foreground">Website URL</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Node Outputs</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Nodes also append data to the context. For example, an API Request node might save its response to <code className="bg-muted px-1 rounded">apiResponse</code>.
                                        </p>
                                        <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs">
                                            <span className="text-green-400">{`// Example Context Data`}</span><br />
                                            {`{
  "email": "user@example.com",
  "apiResponse": {
    "status": "success",
    "id": 123
  },
  "geminiResult": "Subject: Hello World"
}`}
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>
                        </TabsContent>

                        <TabsContent value="best-practices" className="space-y-6 mt-0">
                            <ul className="space-y-4 text-muted-foreground">
                                <li className="flex gap-2">
                                    <span className="font-bold text-primary">•</span>
                                    <span><strong>Start Simple:</strong> Build a linear flow first. Add conditions and loops only when necessary.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-primary">•</span>
                                    <span><strong>Test Often:</strong> Use the &quot;Set Variables&quot; node to mock data and test small sections of your workflow.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-primary">•</span>
                                    <span><strong>Name Your Nodes:</strong> Give nodes descriptive names (e.g., &quot;Send Welcome Email&quot; instead of &quot;Template&quot;). Using generic names makes debugging hard.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-primary">•</span>
                                    <span><strong>Handle Failures:</strong> Consider what happens if an API fails. Maybe add a fallback path?</span>
                                </li>
                            </ul>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

function NodeCard({ icon, name, description }: { icon: string, name: string, description: string }) {
    return (
        <div className="flex items-start gap-4 p-4 border rounded-lg bg-card hover:bg-accent/10 transition-colors">
            <div className="text-2xl pt-1">{icon}</div>
            <div>
                <h4 className="font-medium text-foreground">{name}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}
