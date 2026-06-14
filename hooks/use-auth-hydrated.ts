import { useEffect, useState } from 'react';

import { useApiAuthStore } from '@/stores/api-auth-store';

export function useAuthHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useApiAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    return useApiAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  return hydrated;
}
