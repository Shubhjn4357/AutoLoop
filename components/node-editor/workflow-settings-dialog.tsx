import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AutomationWorkflow } from "@/types";

interface WorkflowSettingsDialogProps {
    workflow: Partial<AutomationWorkflow>;
    onSave: (updates: Partial<AutomationWorkflow>) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const TIMEZONES = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Singapore",
    "Asia/Dubai",
    "Australia/Sydney",
];


function WorkflowSettingsForm({ workflow, onSave }: { workflow: Partial<AutomationWorkflow>, onSave: (updates: Partial<AutomationWorkflow>) => void }) {
    const [name, setName] = useState(workflow.name || "");
    const [description, setDescription] = useState(workflow.description || "");
    const [timezone, setTimezone] = useState(workflow.timezone || "UTC");

    const handleSave = () => {
        onSave({
            name,
            description,
            timezone
        });
    };

    return (
        <>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My Awesome Workflow"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What does this workflow do?"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                            {TIMEZONES.map((tz) => (
                                <SelectItem key={tz} value={tz}>
                                    {tz}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Used for scheduling and delay calculations.
                    </p>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
        </>
    );
}

export function WorkflowSettingsDialog({ workflow, onSave, open, onOpenChange }: WorkflowSettingsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Workflow Settings</DialogTitle>
                    <DialogDescription>
                        Configure global settings for this workflow.
                    </DialogDescription>
                </DialogHeader>
                {/* 
                  We conditionally render the form only when open is true (or relying on Dialog content mounting behavior).
                  However, to guarantee fresh state initialization from props every time it opens, 
                  we force re-mounting by keying it with 'open'. 
                  Actually, if DialogContent unmounts on close, we are good. 
                  Shadcn DialogContent usually stays mounted but hidden? No, it uses Radix Dialog Portal.
                  Let's use a key to be safe.
                */}
                {open && (
                    <WorkflowSettingsForm
                        key={open ? 'open' : 'closed'}
                        workflow={workflow}
                        onSave={(updates) => {
                            onSave(updates);
                            onOpenChange(false);
                        }}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
