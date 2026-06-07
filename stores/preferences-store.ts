import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_RETENTION_DAYS } from '@/constants/storage-keys';
import type { ThemePreference } from '@/constants/theme';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { createZustandSecureStorage } from '@/lib/storage/zustand-secure-storage';

interface PreferencesState {
  theme: ThemePreference;
  retentionDays: number;
  captureRawPayload: boolean;
  setTheme: (theme: ThemePreference) => void;
  setRetentionDays: (days: number) => void;
  setCaptureRawPayload: (enabled: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'dark',
      retentionDays: DEFAULT_RETENTION_DAYS,
      captureRawPayload: false,
      setTheme: (theme) => set({ theme }),
      setRetentionDays: (retentionDays) => set({ retentionDays }),
      setCaptureRawPayload: (captureRawPayload) => set({ captureRawPayload }),
    }),
    {
      name: 'preferences-store',
      storage: createJSONStorage(() => createZustandSecureStorage(STORAGE_KEYS.preferences)),
      partialize: (state) => ({
        theme: state.theme,
        retentionDays: state.retentionDays,
        captureRawPayload: state.captureRawPayload,
      }),
    }
  )
);
