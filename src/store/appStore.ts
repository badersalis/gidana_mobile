import { create } from 'zustand';
import { storage } from '../utils/storage';

interface AppState {
  hasSeenOnboarding: boolean | null;
  checkOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  hasSeenOnboarding: null,
  checkOnboarding: async () => {
    if (__DEV__) {
      set({ hasSeenOnboarding: false });
      return;
    }
    const val = await storage.getItemAsync('onboarding_complete');
    set({ hasSeenOnboarding: val === 'true' });
  },
  completeOnboarding: async () => {
    await storage.setItemAsync('onboarding_complete', 'true');
    set({ hasSeenOnboarding: true });
  },
}));
