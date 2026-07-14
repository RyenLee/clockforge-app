import { safeInvoke } from './tauri';
import type { Task, DashboardStats, StopwatchStateData, LapRecord } from '../types';

export const api = {
  async getDashboardStats(): Promise<DashboardStats> {
    return safeInvoke('get_dashboard_stats');
  },

  async getAllTasks(status?: string, taskType?: string): Promise<Task[]> {
    return safeInvoke('get_all_tasks', { status, task_type: taskType });
  },

  async getTaskById(id: string): Promise<Task> {
    return safeInvoke('get_task_by_id', { id });
  },

  async createTask(data: {
    title: string;
    taskType: string;
    payload?: string;
    scheduledAt?: string;
    cronExpr?: string;
  }): Promise<Task> {
    return safeInvoke('create_task', {
      title: data.title,
      task_type: data.taskType,
      payload: data.payload,
      scheduled_at: data.scheduledAt,
      cron_expr: data.cronExpr,
    });
  },

  async deleteTask(id: string): Promise<void> {
    return safeInvoke('delete_task', { id });
  },

  async cancelTask(id: string): Promise<Task> {
    return safeInvoke('cancel_task', { id });
  },

  async startShutdownTimer(delaySeconds: number, action: string): Promise<Task> {
    return safeInvoke('start_shutdown_timer', { delay_seconds: delaySeconds, action });
  },

  async stopShutdownTimer(taskId: string): Promise<void> {
    return safeInvoke('stop_shutdown_timer', { task_id: taskId });
  },

  async startNotificationTimer(title: string, body: string, delaySeconds: number): Promise<Task> {
    return safeInvoke('start_notification_timer', { title, body, delay_seconds: delaySeconds });
  },

  async stopNotificationTimer(taskId: string): Promise<void> {
    return safeInvoke('stop_notification_timer', { task_id: taskId });
  },

  async stopwatchStart(mode: string, durationMs?: number): Promise<void> {
    return safeInvoke('stopwatch_start', { mode, duration_ms: durationMs });
  },

  async stopwatchPause(): Promise<void> {
    return safeInvoke('stopwatch_pause');
  },

  async stopwatchResume(): Promise<void> {
    return safeInvoke('stopwatch_resume');
  },

  async stopwatchReset(): Promise<void> {
    return safeInvoke('stopwatch_reset');
  },

  async stopwatchLap(): Promise<LapRecord | null> {
    return safeInvoke('stopwatch_lap');
  },

  async stopwatchGetState(): Promise<StopwatchStateData> {
    return safeInvoke('stopwatch_get_state');
  },
};
