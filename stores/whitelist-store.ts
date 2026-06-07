import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import {
  ALLOWED_PACKAGES,
  APP_LABELS,
} from '@/constants/whitelist-defaults';
import { createZustandSecureStorage } from '@/lib/storage/zustand-secure-storage';

interface WhitelistState {
  allowedPackages: string[];
  appLabels: Record<string, string>;
  hasCompletedOnboarding: boolean;
  togglePackage: (packageName: string, appLabel: string) => void;
  setAppLabel: (packageName: string, appLabel: string) => void;
  addManualPackage: (packageName: string, appLabel: string) => void;
  removePackage: (packageName: string) => void;
  setOnboardingComplete: (value: boolean) => void;
}

export const useWhitelistStore = create<WhitelistState>()(
  persist(
    (set, _get) => ({
      allowedPackages: [...ALLOWED_PACKAGES],
      appLabels: { ...APP_LABELS },
      hasCompletedOnboarding: false,
      togglePackage: () => {},
      setAppLabel: () => {},
      addManualPackage: () => {},
      removePackage: () => {},
      setOnboardingComplete: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
    }),
    {
      name: 'whitelist-store',
      storage: createJSONStorage(() => createZustandSecureStorage(STORAGE_KEYS.whitelist)),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(typeof persistedState === 'object' && persistedState !== null ? persistedState : {}),
        allowedPackages: [...ALLOWED_PACKAGES],
        appLabels: { ...APP_LABELS },
      }),
    }
  )
);
