import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { selectIsAuthenticated } from '@/lib/auth/auth-selectors';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { createZustandSecureStorage } from '@/lib/storage/zustand-secure-storage';

export interface ApiAuthUser {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: string;
}

export interface ApiAuthState {
  accessToken: string | null;
  expiresAt: string | null;
  user: ApiAuthUser | null;
  lastSyncError: string | null;
  setAuth: (token: string, expiresAt: string, user: ApiAuthUser) => void;
  clearAuth: () => void;
  setLastSyncError: (message: string | null) => void;
  isAuthenticated: () => boolean;
  expireIfNeeded: () => boolean;
}

export const useApiAuthStore = create<ApiAuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      expiresAt: null,
      user: null,
      lastSyncError: null,
      setAuth: (accessToken, expiresAt, user) =>
        set({ accessToken, expiresAt, user, lastSyncError: null }),
      clearAuth: () =>
        set({ accessToken: null, expiresAt: null, user: null, lastSyncError: null }),
      setLastSyncError: (lastSyncError) => set({ lastSyncError }),
      isAuthenticated: () => selectIsAuthenticated(get()),
      expireIfNeeded: () => {
        const { accessToken, expiresAt } = get();
        if (!accessToken || !expiresAt) return false;
        if (new Date(expiresAt).getTime() > Date.now()) return false;
        set({ accessToken: null, expiresAt: null, user: null });
        return true;
      },
    }),
    {
      name: STORAGE_KEYS.apiConfig,
      storage: createJSONStorage(() => createZustandSecureStorage(`${STORAGE_KEYS.apiConfig}.auth`)),
      partialize: (state) => ({
        accessToken: state.accessToken,
        expiresAt: state.expiresAt,
        user: state.user,
      }),
    }
  )
);
