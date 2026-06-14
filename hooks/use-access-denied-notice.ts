import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { copy } from '@/constants/copy';
import {
  INVOICE_ACCESS_DENIED_CREATE,
  INVOICE_ACCESS_DENIED_PARAM,
} from '@/lib/auth/invoice-route-guard';

export interface AccessDeniedNotice {
  message: string;
  dismiss: () => void;
}

export function useAccessDeniedNotice(): AccessDeniedNotice | null {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const [notice, setNotice] = useState<AccessDeniedNotice | null>(null);

  useEffect(() => {
    const raw = params[INVOICE_ACCESS_DENIED_PARAM];
    const value = Array.isArray(raw) ? raw[0] : raw;

    if (value !== INVOICE_ACCESS_DENIED_CREATE) {
      return;
    }

    setNotice({
      message: copy.facturas.unauthorizedCreate,
      dismiss: () => {
        setNotice(null);
        router.setParams({ [INVOICE_ACCESS_DENIED_PARAM]: undefined });
      },
    });
  }, [params, router]);

  return notice;
}
