"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Clock, Mail } from "lucide-react";
import { EmailSequenceStep } from "@/lib/sequence-builder";

export function SequenceBuilder() {
  const [steps, setSteps] = useState<EmailSequenceStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const addStep = () => {
    const newStep: EmailSequenceStep = {
      id: `step-${Date.now()}`,
      order: steps.length + 1,
      subject: "",
      body: "",
      delayDays: steps.length === 0 ? 0 : 1,
      delayHours: 0,
    };
    setSteps([...steps, newStep]);
    setSelectedStep(steps.length);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps.map((step, i) => ({ ...step, order: i + 1 })));
    setSelectedStep(null);
  };

  const updateStep = (index: number, updates: Partial<EmailSequenceStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Sequences</h2>
          <p className="text-muted-foreground">
            Create automated follow-up sequences
          </p>
        </div>
        <Button onClick={addStep}>
          <Plus className="mr-2 h-4 w-4" />
          Add Step
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sequence Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Sequence Timeline</CardTitle>
            <CardDescription>
              {steps.length} step{steps.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>No steps yet. Click &quot;Add Step&quot; to begin.</p>
              </div>
            ) : (
              steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedStep === index
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedStep(index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">Step {step.order}</span>
                        {index > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Wait {step.delayDays}d {step.delayHours || 0}h
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">
                        {step.subject || 'Untitled email'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStep(index);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Step Editor */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedStep !== null ? `Edit Step ${steps[selectedStep].order}` : 'Select a Step'}
            </CardTitle>
            <CardDescription>
              Configure email content and timing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedStep !== null ? (
              <div className="space-y-4">
                {selectedStep > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delayDays">Delay (Days)</Label>
                      <Input
                        id="delayDays"
                        type="number"
                        min="0"
                        value={steps[selectedStep].delayDays}
                        onChange={(e) =>
                          updateStep(selectedStep, {
                            delayDays: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delayHours">Delay (Hours)</Label>
                      <Input
                        id="delayHours"
                        type="number"
                        min="0"
                        max="23"
                        value={steps[selectedStep].delayHours || 0}
                        onChange={(e) =>
                          updateStep(selectedStep, {
                            delayHours: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    placeholder="Enter email subject..."
                    value={steps[selectedStep].subject}
                    onChange={(e) =>
                      updateStep(selectedStep, { subject: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Email Body</Label>
                  <Textarea
                    id="body"
                    placeholder="Write your email content..."
                    rows={8}
                    value={steps[selectedStep].body}
                    onChange={(e) =>
                      updateStep(selectedStep, { body: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Use variables: {'{'}name{'}'}, {'{'}company{'}'}, {'{'}email{'}'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Select a step from the timeline to edit</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {steps.length > 0 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline">Save as Draft</Button>
          <Button>Activate Sequence</Button>
        </div>
      )}
    </div>
  );
}
