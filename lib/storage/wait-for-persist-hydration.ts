import { useApiAuthStore } from '@/stores/api-auth-store';
import { useApiConfigStore } from '@/stores/api-config-store';

function waitForStoreHydration(store: {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (callback: () => void) => () => void;
  };
}): Promise<void> {
  if (store.persist.hasHydrated()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const unsubscribe = store.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

/** Wait until persisted API auth/config stores are loaded from SecureStore. */
export async function waitForApiStoresHydration(): Promise<void> {
  await Promise.all([
    waitForStoreHydration(useApiAuthStore),
    waitForStoreHydration(useApiConfigStore),
  ]);
}
