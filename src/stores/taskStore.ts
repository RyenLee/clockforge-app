import { create } from 'zustand';
import type { Task, DashboardStats } from '../types';
import { api } from '../api';

interface TaskState {
  tasks: Task[];
  stats: DashboardStats | null;
  loading: boolean;
  filter: { status?: string; type?: string };
  setFilter: (filter: Partial<TaskState['filter']>) => void;
  fetchTasks: () => Promise<void>;
  fetchStats: () => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  cancelTask: (id: string) => Promise<void>;
  startShutdownTimer: (delaySeconds: number, action: string) => Promise<Task>;
  startNotificationTimer: (title: string, body: string, delaySeconds: number) => Promise<Task>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  stats: null,
  loading: false,
  filter: {},

  setFilter: (filter) => {
    set((state) => ({ filter: { ...state.filter, ...filter } }));
    get().fetchTasks();
  },

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const { filter } = get();
      const tasks = await api.getAllTasks(filter.status, filter.type);
      set({ tasks, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await api.getDashboardStats();
      set({ stats });
    } catch {
      // ignore
    }
  },

  deleteTask: async (id: string) => {
    await api.deleteTask(id);
    get().fetchTasks();
    get().fetchStats();
  },

  cancelTask: async (id: string) => {
    await api.cancelTask(id);
    get().fetchTasks();
    get().fetchStats();
  },

  startShutdownTimer: async (delaySeconds: number, action: string) => {
    const task = await api.startShutdownTimer(delaySeconds, action);
    get().fetchTasks();
    get().fetchStats();
    return task;
  },

  startNotificationTimer: async (title: string, body: string, delaySeconds: number) => {
    try {
      const task = await api.startNotificationTimer(title, body, delaySeconds);
      get().fetchTasks();
      get().fetchStats();
      return task;
    } catch (err) {
      console.error('Failed to start notification timer:', err);
      throw err;
    }
  },
}));
