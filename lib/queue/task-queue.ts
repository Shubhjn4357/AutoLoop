/**
 * Task Queue System
 * Manages multiple task queues with type-specific processing
 */

export type TaskType = 'workflow' | 'scraper' | 'email' | 'social';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  data: Record<string, unknown>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface QueueStats {
  type: TaskType;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  avgProcessingTime: number;
}

export interface QueueConfig {
  maxConcurrent: number;
  processingInterval: number;
  maxRetries: number;
}

/**
 * In-memory task queue manager
 */
export class TaskQueue {
  private tasks: Map<string, Task> = new Map();
  private queues: Map<TaskType, Task[]> = new Map();
  private running: Map<TaskType, Set<string>> = new Map();
  private config: Map<TaskType, QueueConfig> = new Map();

  constructor() {
    // Initialize queues for each type
    const types: TaskType[] = ['workflow', 'scraper', 'email', 'social'];
    types.forEach(type => {
      this.queues.set(type, []);
      this.running.set(type, new Set());
      
      // Default configs
      this.config.set(type, {
        maxConcurrent: type === 'scraper' ? 2 : 5, // Limit concurrent scrapers
        processingInterval: 1000,
        maxRetries: 3,
      });
    });
  }

  /**
   * Add task to queue
   */
  async addTask(task: Omit<Task, 'id' | 'createdAt' | 'status' | 'retryCount'>): Promise<string> {
    const id = `${task.type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    const fullTask: Task = {
      ...task,
      id,
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0,
    };

    this.tasks.set(id, fullTask);
    
    const queue = this.queues.get(task.type);
    if (queue) {
      // Insert based on priority
      const insertIndex = queue.findIndex(t => 
        this.getPriorityValue(t.priority) < this.getPriorityValue(task.priority)
      );
      
      if (insertIndex === -1) {
        queue.push(fullTask);
      } else {
        queue.splice(insertIndex, 0, fullTask);
      }
    }

    console.log(`✅ Task ${id} added to ${task.type} queue`);
    return id;
  }

  /**
   * Get next task to process
   */
  getNextTask(type: TaskType): Task | null {
    const queue = this.queues.get(type);
    const runningSet = this.running.get(type);
    const config = this.config.get(type);

    if (!queue || !runningSet || !config) return null;

    // Check if we can process more tasks
    if (runningSet.size >= config.maxConcurrent) {
      return null;
    }

    // Get first pending task
    const task = queue.find(t => t.status === 'pending');
    if (!task) return null;

    // Mark as running
    task.status = 'running';
    task.startedAt = new Date();
    runningSet.add(task.id);

    return task;
  }

  /**
   * Complete task
   */
  completeTask(taskId: string, error?: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const runningSet = this.running.get(task.type);
    if (runningSet) {
      runningSet.delete(taskId);
    }

    task.completedAt = new Date();
    
    if (error) {
      task.error = error;
      task.retryCount++;

      // Retry if under max retries
      const config = this.config.get(task.type);
      if (config && task.retryCount < (task.maxRetries || config.maxRetries)) {
        task.status = 'pending';
        console.log(`🔄 Retrying task ${taskId} (attempt ${task.retryCount + 1})`);
      } else {
        task.status = 'failed';
        console.log(`❌ Task ${taskId} failed: ${error}`);
      }
    } else {
      task.status = 'completed';
      console.log(`✅ Task ${taskId} completed`);
      
      // Remove from queue
      const queue = this.queues.get(task.type);
      if (queue) {
        const index = queue.findIndex(t => t.id === taskId);
        if (index !== -1) {
          queue.splice(index, 1);
        }
      }
    }
  }

  /**
   * Cancel task
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status === 'completed' || task.status === 'failed') {
      return false;
    }

    task.status = 'cancelled';
    task.completedAt = new Date();

    const runningSet = this.running.get(task.type);
    if (runningSet) {
      runningSet.delete(taskId);
    }

    // Remove from queue
    const queue = this.queues.get(task.type);
    if (queue) {
      const index = queue.findIndex(t => t.id === taskId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }

    console.log(`🛑 Task ${taskId} cancelled`);
    return true;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks by type
   */
  getTasksByType(type: TaskType): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.type === type);
  }

  /**
   * Get all active tasks
   */
  getActiveTasks(): Task[] {
    return Array.from(this.tasks.values()).filter(
      t => t.status === 'pending' || t.status === 'running'
    );
  }

  /**
   * Get queue statistics
   */
  getStats(type: TaskType): QueueStats {
    const tasks = this.getTasksByType(type);
    
    const pending = tasks.filter(t => t.status === 'pending').length;
    const running = tasks.filter(t => t.status === 'running').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;

    // Calculate average processing time
    const completedTasks = tasks.filter(t => 
      t.status === 'completed' && t.startedAt && t.completedAt
    );
    const avgProcessingTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => {
          const duration = t.completedAt!.getTime() - t.startedAt!.getTime();
          return sum + duration;
        }, 0) / completedTasks.length
      : 0;

    return {
      type,
      pending,
      running,
      completed,
      failed,
      avgProcessingTime,
    };
  }

  /**
   * Get all statistics
   */
  getAllStats(): QueueStats[] {
    return Array.from(this.queues.keys()).map(type => this.getStats(type));
  }

  /**
   * Update queue configuration
   */
  updateConfig(type: TaskType, config: Partial<QueueConfig>): void {
    const currentConfig = this.config.get(type);
    if (currentConfig) {
      this.config.set(type, { ...currentConfig, ...config });
    }
  }

  /**
   * Clear completed/failed tasks
   */
  clearCompleted(type?: TaskType): number {
    let cleared = 0;
    
    this.tasks.forEach((task, id) => {
      if (type && task.type !== type) return;
      
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        this.tasks.delete(id);
        cleared++;
      }
    });

    console.log(`🧹 Cleared ${cleared} completed tasks`);
    return cleared;
  }

  /**
   * Get priority numeric value
   */
  private getPriorityValue(priority: TaskPriority): number {
    const values = { low: 1, medium: 2, high: 3 };
    return values[priority];
  }
}

// Export singleton instance
export const taskQueue = new TaskQueue();
