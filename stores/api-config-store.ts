import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { LA_ROMANA_DEFAULT_API_URL, normalizeApiBaseUrl } from '@/constants/api-defaults';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { createZustandSecureStorage } from '@/lib/storage/zustand-secure-storage';

interface ApiConfigState {
  baseUrl: string;
  defaultServiceId: string | null;
  lastSyncAt: number | null;
  setBaseUrl: (url: string) => void;
  setDefaultServiceId: (id: string | null) => void;
  setLastSyncAt: (ts: number) => void;
}

export const useApiConfigStore = create<ApiConfigState>()(
  persist(
    (set) => ({
      baseUrl: LA_ROMANA_DEFAULT_API_URL,
      defaultServiceId: null,
      lastSyncAt: null,
      setBaseUrl: (baseUrl) => set({ baseUrl: normalizeApiBaseUrl(baseUrl) }),
      setDefaultServiceId: (defaultServiceId) => set({ defaultServiceId }),
      setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
    }),
    {
      name: 'api-config-store',
      storage: createJSONStorage(() => createZustandSecureStorage(`${STORAGE_KEYS.apiConfig}.settings`)),
      partialize: (state) => ({
        baseUrl: state.baseUrl,
        defaultServiceId: state.defaultServiceId,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
