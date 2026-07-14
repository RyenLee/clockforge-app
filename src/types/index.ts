export type PageType = 'dashboard' | 'shutdown' | 'notification' | 'tasks' | 'stopwatch';

export interface Task {
  id: string;
  title: string;
  task_type: 'shutdown' | 'notification';
  status: 'pending' | 'running' | 'completed' | 'cancelled';
  payload?: string;
  scheduled_at?: string;
  cron_expr?: string;
  created_at: string;
  updated_at: string;
  executed_at?: string;
}

export interface DashboardStats {
  running: number;
  completed_today: number;
  pending: number;
  cancelled: number;
  recent_tasks: Task[];
}

export interface LapRecord {
  id?: number;
  timer_id: string;
  lap_time_ms: number;
  recorded_at: string;
}

export interface StopwatchStateData {
  mode: 'stopwatch' | 'countdown';
  status: 'idle' | 'running' | 'paused';
  elapsed_ms: number;
  total_duration_ms: number;
  laps: LapRecord[];
}
