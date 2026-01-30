/**
 * Workflow Server Actions
 * Handles all workflow-related data fetching and mutations
 */

"use server";

import { db } from "@/db";
import { workflowExecutionLogs, automationWorkflows, workflowTriggerExecutions } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";

export async function getWorkflowExecutions(limit = 20, offset = 0) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const executions = await db.select({
    id: workflowExecutionLogs.id,
    workflowName: automationWorkflows.name,
    status: workflowExecutionLogs.status,
    startedAt: workflowExecutionLogs.startedAt,
    completedAt: workflowExecutionLogs.completedAt,
    duration: sql<string>`${workflowExecutionLogs.completedAt} - ${workflowExecutionLogs.startedAt}`,
    error: workflowExecutionLogs.error,
    logs: workflowExecutionLogs.logs,
  })
    .from(workflowExecutionLogs)
    .leftJoin(automationWorkflows, eq(workflowExecutionLogs.workflowId, automationWorkflows.id))
    .where(eq(workflowExecutionLogs.userId, session.user.id))
    .orderBy(desc(workflowExecutionLogs.startedAt))
    .limit(limit)
    .offset(offset);

  return executions;
}

export async function getWorkflowStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const stats = await db.select({
    total: sql<number>`count(*)`,
    success: sql<number>`sum(case when ${workflowExecutionLogs.status} = 'success' then 1 else 0 end)`,
    failed: sql<number>`sum(case when ${workflowExecutionLogs.status} = 'failed' then 1 else 0 end)`,
    running: sql<number>`sum(case when ${workflowExecutionLogs.status} = 'running' then 1 else 0 end)`,
  })
    .from(workflowExecutionLogs)
    .where(eq(workflowExecutionLogs.userId, session.user.id));

  return stats[0];
}

export async function getRecentTriggerExecutions(limit = 10) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const triggers = await db.select({
    id: workflowTriggerExecutions.id,
    workflowName: automationWorkflows.name,
    triggerId: workflowTriggerExecutions.triggerId,
    status: workflowTriggerExecutions.status,
    executedAt: workflowTriggerExecutions.executedAt,
    error: workflowTriggerExecutions.error,
  })
    .from(workflowTriggerExecutions)
    .leftJoin(automationWorkflows, eq(workflowTriggerExecutions.workflowId, automationWorkflows.id))
    .where(eq(automationWorkflows.userId, session.user.id))
    .orderBy(desc(workflowTriggerExecutions.executedAt))
    .limit(limit);

  return triggers;
}

export async function getWorkflowPerformance() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const performance = await db.execute(sql`
    SELECT 
      aw.name as workflow_name,
      COUNT(el.id) as emails_sent,
      SUM(CASE WHEN el.status = 'opened' THEN 1 ELSE 0 END) as opened,
      SUM(CASE WHEN el.status = 'clicked' THEN 1 ELSE 0 END) as clicked
    FROM automation_workflows aw
    LEFT JOIN email_logs el ON aw.id = (
      SELECT workflow_id FROM workflow_execution_logs WHERE business_id = el.business_id LIMIT 1
    )
    WHERE aw.user_id = ${session.user.id}
    GROUP BY aw.id, aw.name
    HAVING COUNT(el.id) > 0
    ORDER BY emails_sent DESC
    LIMIT 5
  `);

  return performance.rows as unknown as Array<{ workflow_name: string; emails_sent: number; opened: number; clicked: number }>;
}
