import { create } from 'zustand';
import type { PageType } from '../types';

interface NavigationState {
  currentPage: PageType;
  setPage: (page: PageType) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 'dashboard',
  setPage: (page) => set({ currentPage: page }),
}));
