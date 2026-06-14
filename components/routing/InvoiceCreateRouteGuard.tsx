import { Redirect, useSegments } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { usePermissions } from '@/hooks/use-permissions';
import {
  invoiceCreateDeniedHref,
  shouldRedirectFromInvoiceCreate,
} from '@/lib/auth/invoice-route-guard';
import { useThemeColors } from '@/hooks/use-theme-colors';

export interface InvoiceCreateRouteGuardProps {
  children: ReactNode;
}

export function InvoiceCreateRouteGuard({ children }: InvoiceCreateRouteGuardProps) {
  const segments = useSegments();
  const { colors } = useThemeColors();
  const authHydrated = useAuthHydrated();
  const { role, isAuthenticated } = usePermissions();

  const segmentList = segments as string[];
  const isNewInvoiceRoute = segmentList.includes('new');

  if (!isNewInvoiceRoute) {
    return children;
  }

  if (!authHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (shouldRedirectFromInvoiceCreate(role, isAuthenticated)) {
    return <Redirect href={invoiceCreateDeniedHref()} />;
  }

  return children;
}
