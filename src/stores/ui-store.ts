import { create } from 'zustand';

interface UiState {
  activeScreen: string;
  setActiveScreen: (key: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeScreen: 'dashboard',
  setActiveScreen: (key) => set({ activeScreen: key }),
}));
