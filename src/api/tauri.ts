import type { Task, StopwatchStateData, LapRecord } from '../types';

let tauriInvoke: ((command: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;

async function loadTauriInvoke(): Promise<((command: string, args?: Record<string, unknown>) => Promise<unknown>) | null> {
  if (tauriInvoke !== null) {
    return tauriInvoke;
  }

  if (typeof window !== 'undefined' && !!(window as any).__TAURI__?.core?.invoke) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      tauriInvoke = invoke;
      return invoke;
    } catch {
      return null;
    }
  }

  return null;
}

let mockTasks: Task[] = [
  {
    id: 'mock-1',
    title: '示例关机任务',
    task_type: 'shutdown',
    status: 'completed',
    payload: '{"action":"shutdown"}',
    scheduled_at: '2026-07-13T10:00:00Z',
    created_at: '2026-07-13T09:55:00Z',
    updated_at: '2026-07-13T10:00:00Z',
    executed_at: '2026-07-13T10:00:00Z',
    cron_expr: undefined,
  },
  {
    id: 'mock-2',
    title: '示例通知',
    task_type: 'notification',
    status: 'completed',
    payload: '{"title":"提醒","body":"该休息了"}',
    scheduled_at: '2026-07-13T11:00:00Z',
    created_at: '2026-07-13T10:58:00Z',
    updated_at: '2026-07-13T11:00:00Z',
    executed_at: '2026-07-13T11:00:00Z',
    cron_expr: undefined,
  },
];

let stopwatchState: StopwatchStateData = {
  mode: 'stopwatch',
  status: 'idle',
  elapsed_ms: 0,
  total_duration_ms: 0,
  laps: [],
};

async function safeInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const invoke = await loadTauriInvoke();
  if (invoke) {
    return invoke(command, args) as Promise<T>;
  }

  console.warn(`[Browser Mode] Mocking Tauri command: ${command}`, args);

  switch (command) {
    case 'get_dashboard_stats':
      return {
        running: mockTasks.filter(t => t.status === 'running').length,
        completed_today: mockTasks.filter(t => t.status === 'completed').length,
        pending: mockTasks.filter(t => t.status === 'pending').length,
        cancelled: mockTasks.filter(t => t.status === 'cancelled').length,
        recent_tasks: [...mockTasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5),
      } as T;

    case 'get_all_tasks':
      let filtered = [...mockTasks];
      if (args?.status) {
        filtered = filtered.filter(t => t.status === args.status);
      }
      if (args?.task_type) {
        filtered = filtered.filter(t => t.task_type === args.task_type);
      }
      return filtered as T;

    case 'get_task_by_id':
      return mockTasks.find(t => t.id === args?.id) as unknown as T;

    case 'create_task': {
      const now = new Date().toISOString();
      const newTask: Task = {
        id: `mock-${Date.now()}`,
        title: (args?.title as string) || '新任务',
        task_type: ((args?.task_type as string) || 'notification') as 'notification' | 'shutdown',
        status: 'pending',
        payload: (args?.payload as string) || '',
        scheduled_at: (args?.scheduled_at as string) || now,
        created_at: now,
        updated_at: now,
        executed_at: undefined,
        cron_expr: args?.cron_expr as string | undefined,
      };
      mockTasks.push(newTask);
      return newTask as unknown as T;
    }

    case 'delete_task':
      mockTasks = mockTasks.filter(t => t.id !== args?.id);
      return undefined as unknown as T;

    case 'cancel_task': {
      const task = mockTasks.find(t => t.id === args?.id);
      if (task) {
        task.status = 'cancelled';
        task.updated_at = new Date().toISOString();
      }
      return task as unknown as T;
    }

    case 'start_shutdown_timer': {
      const now = new Date().toISOString();
      const delaySeconds = (args?.delay_seconds as number) || 300;
      const newTask: Task = {
        id: `mock-${Date.now()}`,
        title: (args?.title as string) || `关机倒计时`,
        task_type: 'shutdown',
        status: 'running',
        payload: JSON.stringify({ action: args?.action || 'shutdown' }),
        scheduled_at: new Date(Date.now() + delaySeconds * 1000).toISOString(),
        created_at: now,
        updated_at: now,
        executed_at: undefined,
        cron_expr: undefined,
      };
      mockTasks.push(newTask);

      setTimeout(() => {
        const task = mockTasks.find(t => t.id === newTask.id);
        if (task && task.status === 'running') {
          task.status = 'completed';
          task.updated_at = new Date().toISOString();
          task.executed_at = new Date().toISOString();

          const payload = JSON.parse(task.payload || '{}');
          console.log('[Mock] Shutdown task triggered:', payload);

          if (typeof window !== 'undefined') {
            const event = new CustomEvent('task-triggered', {
              detail: {
                id: task.id,
                type: 'shutdown',
                title: task.title,
                action: payload.action || 'shutdown',
                success: true,
              },
            });
            window.dispatchEvent(event);
          }
        }
      }, delaySeconds * 1000);

      return newTask as unknown as T;
    }

    case 'stop_shutdown_timer': {
      const task = mockTasks.find(t => t.id === args?.task_id);
      if (task) {
        task.status = 'cancelled';
        task.updated_at = new Date().toISOString();
      }
      return undefined as unknown as T;
    }

    case 'start_notification_timer': {
      const now = new Date().toISOString();
      const delaySeconds = (args?.delay_seconds as number) || 300;
      const newTask: Task = {
        id: `mock-${Date.now()}`,
        title: (args?.title as string) || '定时通知',
        task_type: 'notification',
        status: 'running',
        payload: JSON.stringify({ title: args?.title, body: args?.body }),
        scheduled_at: new Date(Date.now() + delaySeconds * 1000).toISOString(),
        created_at: now,
        updated_at: now,
        executed_at: undefined,
        cron_expr: undefined,
      };
      mockTasks.push(newTask);

      setTimeout(() => {
        const task = mockTasks.find(t => t.id === newTask.id);
        if (task && task.status === 'running') {
          task.status = 'completed';
          task.updated_at = new Date().toISOString();
          task.executed_at = new Date().toISOString();

          const payload = JSON.parse(task.payload || '{}');
          console.log('[Mock] Notification triggered:', payload);

          if (typeof window !== 'undefined') {
            const event = new CustomEvent('task-triggered', {
              detail: {
                id: task.id,
                type: 'notification',
                title: payload.title || task.title,
                body: payload.body || '时间到了！',
              },
            });
            window.dispatchEvent(event);
          }
        }
      }, delaySeconds * 1000);

      return newTask as unknown as T;
    }

    case 'stop_notification_timer': {
      const task = mockTasks.find(t => t.id === args?.task_id);
      if (task) {
        task.status = 'cancelled';
        task.updated_at = new Date().toISOString();
      }
      return undefined as unknown as T;
    }

    case 'stopwatch_start': {
      stopwatchState = {
        mode: ((args?.mode as string) || 'stopwatch') as 'stopwatch' | 'countdown',
        status: 'running',
        elapsed_ms: 0,
        total_duration_ms: (args?.duration_ms as number) || 0,
        laps: [],
      };
      return undefined as unknown as T;
    }

    case 'stopwatch_pause':
      stopwatchState.status = 'paused';
      return undefined as unknown as T;

    case 'stopwatch_resume':
      stopwatchState.status = 'running';
      return undefined as unknown as T;

    case 'stopwatch_reset':
      stopwatchState = {
        mode: 'stopwatch',
        status: 'idle',
        elapsed_ms: 0,
        total_duration_ms: 0,
        laps: [],
      };
      return undefined as unknown as T;

    case 'stopwatch_lap': {
      const lap: LapRecord = {
        id: undefined,
        timer_id: stopwatchState.mode,
        lap_time_ms: stopwatchState.elapsed_ms,
        recorded_at: new Date().toISOString(),
      };
      stopwatchState.laps.push(lap);
      return lap as unknown as T;
    }

    case 'stopwatch_get_state':
      return stopwatchState as unknown as T;

    default:
      throw new Error(`Unsupported mock command: ${command}`);
  }
}

export { safeInvoke };
