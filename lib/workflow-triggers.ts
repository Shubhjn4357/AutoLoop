import { db } from "@/db";
import { workflowTriggers, workflowTriggerExecutions, automationWorkflows, businesses } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { CronExpressionParser } from "cron-parser";
import { executeWorkflowLoopWithLogging } from "./workflow-executor";

interface TriggerConfig {
    cronExpression?: string;
    targetBusinessTypes?: string[];
    minRating?: number;
    delayHours?: number;
}

export class WorkflowTriggerService {
    /**
     * Execute all triggers that are due
     */
    async processDueTriggers() {
        const now = new Date();
        const dueTriggers = await db.query.workflowTriggers.findMany({
            where: and(
                eq(workflowTriggers.isActive, true),
                lte(workflowTriggers.nextRunAt, now)
            ),
        });

        for (const trigger of dueTriggers) {
            await this.executeTrigger(trigger);
        }
    }

    private async executeTrigger(trigger: typeof workflowTriggers.$inferSelect) {
        const workflow = await db.query.automationWorkflows.findFirst({
            where: eq(automationWorkflows.id, trigger.workflowId),
        });

        if (!workflow) return;

        try {
            switch (trigger.triggerType) {
                case "schedule":
                    await this.executeScheduleTrigger(trigger, workflow);
                    break;
                case "new_business":
                    await this.executeNewBusinessTrigger(trigger, workflow);
                    break;
                case "delay_completion":
                    await this.executeDelayTrigger(trigger, workflow);
                    break;
            }

            // Update next run time
            const nextRunAt = this.calculateNextRun(trigger);
            await db
                .update(workflowTriggers)
                .set({
                    lastRunAt: new Date(),
                    nextRunAt,
                })
                .where(eq(workflowTriggers.id, trigger.id));
        } catch (error) {
            console.error(`Error executing trigger ${trigger.id}:`, error);
        }
    }

    private async executeScheduleTrigger(trigger: typeof workflowTriggers.$inferSelect, workflow: typeof automationWorkflows.$inferSelect) {
        const targetBusinessTypes = workflow.targetBusinessType ? [workflow.targetBusinessType] : [];
        const matchingBusinesses = await db.query.businesses.findMany({
            where: and(
                eq(businesses.userId, workflow.userId),
                eq(businesses.emailSent, false),
                // Simplification: In real world we filter by types if array is present
            ),
            limit: 50,
        });

        const businessesToProcess = targetBusinessTypes.length > 0
            ? matchingBusinesses.filter((b) => targetBusinessTypes.includes(b.category))
            : matchingBusinesses;

        for (const business of businessesToProcess) {
            const result = await executeWorkflowLoopWithLogging(
                workflow.id,
                workflow.userId,
                business.id
            );

            await db.insert(workflowTriggerExecutions).values({
                triggerId: trigger.id,
                workflowId: workflow.id,
                businessId: business.id,
                status: result.success ? "success" : "failed",
                executedAt: new Date(),
            });
        }
    }

    private async executeNewBusinessTrigger(trigger: typeof workflowTriggers.$inferSelect, workflow: typeof automationWorkflows.$inferSelect) {
        const config = (trigger.config || {}) as TriggerConfig;
        const targetBusinessTypes = config.targetBusinessTypes || [workflow.targetBusinessType];

        // In a real scenario, "New Business" trigger might need to track "last processed business" 
        // or rely on a "processed" flag. Here we just pick up unsent businesses.
        // To make it distinct from Schedule, maybe we only pick businesses created recently?
        // For now, logic is similar to schedule but maybe triggered differently.

        const newBusinesses = await db.query.businesses.findMany({
            where: and(
                eq(businesses.userId, workflow.userId),
                eq(businesses.emailSent, false),
            ),
            limit: 50,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const business of newBusinesses as any[]) {
            if (targetBusinessTypes.includes(business.category)) {
                const result = await executeWorkflowLoopWithLogging(
                    workflow.id,
                    workflow.userId,
                    business.id
                );

                await db.insert(workflowTriggerExecutions).values({
                    triggerId: trigger.id,
                    workflowId: workflow.id,
                    businessId: business.id,
                    status: result.success ? "success" : "failed",
                    executedAt: new Date(),
                });
            }
        }
    }

    private async executeDelayTrigger(trigger: typeof workflowTriggers.$inferSelect, workflow: typeof automationWorkflows.$inferSelect) {
        // This would execute workflows that have completed delays
        // Implementation depends on tracking node execution state
        console.log("Delay trigger for", workflow.id, trigger.id);
    }

    private calculateNextRun(trigger: typeof workflowTriggers.$inferSelect): Date {
        const config = (trigger.config || {}) as TriggerConfig;
        if (config.cronExpression) {
            try {
                const interval = CronExpressionParser.parse(config.cronExpression);
                return interval.next().toDate();
            } catch (error) {
                console.error("Invalid cron expression:", error);
                return new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to 24h
            }
        }
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
}

// Singleton instance
let triggerService: WorkflowTriggerService | null = null;

export function getTriggerService() {
    if (!triggerService) {
        triggerService = new WorkflowTriggerService();
    }
    return triggerService;
}

// Start background job to process triggers
export function startTriggerProcessor(intervalMs = 60000) {
    const service = getTriggerService();

    setInterval(() => {
        service.processDueTriggers().catch(error => {
            console.error("Error in trigger processor:", error);
        });
    }, intervalMs);

    console.log("✅ Workflow trigger processor started (checking every", intervalMs / 1000, "seconds)");
}
