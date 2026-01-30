/**
 * Task Monitor API
 * Provides real-time updates on all background tasks
 */

import { NextResponse } from 'next/server';
import { taskQueue } from '@/lib/queue/task-queue';
import { apiSuccess, withErrorHandling } from '@/lib/api-response-helpers';
import { auth } from '@/auth';

/**
 * GET /api/tasks/monitor
 * Get current status of all tasks
 */
export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all active tasks
  const activeTasks = taskQueue.getActiveTasks();
  
  // Get statistics for all queue types
  const stats = taskQueue.getAllStats();

  return apiSuccess({
    tasks: activeTasks.map(task => ({
      id: task.id,
      type: task.type,
      status: task.status,
      priority: task.priority,
      createdAt: task.createdAt,
      startedAt: task.startedAt,
      data: task.data,
    })),
    stats,
    totalActive: activeTasks.length,
    timestamp: new Date().toISOString(),
  });
});
