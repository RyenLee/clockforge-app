import { create } from 'zustand';
import type { StopwatchStateData } from '../types';
import { api } from '../api';

interface StopwatchState {
  state: StopwatchStateData | null;
  displayMs: number;
  intervalId: number | null;
  start: (mode: 'stopwatch' | 'countdown', durationMs?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  reset: () => Promise<void>;
  lap: () => Promise<void>;
  fetchState: () => Promise<void>;
  startTicking: () => void;
  stopTicking: () => void;
}

export const useStopwatchStore = create<StopwatchState>((set, get) => ({
  state: null,
  displayMs: 0,
  intervalId: null,

  start: async (mode, durationMs) => {
    await api.stopwatchStart(mode, durationMs);
    await get().fetchState();
    get().startTicking();
  },

  pause: async () => {
    await api.stopwatchPause();
    get().stopTicking();
    await get().fetchState();
  },

  resume: async () => {
    await api.stopwatchResume();
    get().startTicking();
  },

  reset: async () => {
    get().stopTicking();
    await api.stopwatchReset();
    set({ displayMs: 0 });
    await get().fetchState();
  },

  lap: async () => {
    await api.stopwatchLap();
    await get().fetchState();
  },

  fetchState: async () => {
    try {
      const state = await api.stopwatchGetState();
      const displayMs = state.mode === 'countdown'
        ? Math.max(0, state.total_duration_ms - state.elapsed_ms)
        : state.elapsed_ms;
      set({ state, displayMs });
    } catch {
      // ignore
    }
  },

  startTicking: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);

    const id = window.setInterval(() => {
      set((s) => {
        if (s.state?.status === 'running') {
          if (s.state.mode === 'stopwatch') {
            return { displayMs: s.displayMs + 50 };
          } else {
            const newMs = Math.max(0, s.displayMs - 50);
            if (newMs === 0) {
              api.stopwatchPause();
            }
            return { displayMs: newMs };
          }
        }
        return s;
      });
    }, 50);
    set({ intervalId: id });
  },

  stopTicking: () => {
    const { intervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
      set({ intervalId: null });
    }
  },
}));
