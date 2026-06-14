import { Stack } from 'expo-router';

import { InvoiceCreateRouteGuard } from '@/components/routing/InvoiceCreateRouteGuard';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function InvoicesLayout() {
  const { colors } = useThemeColors();

  return (
    <InvoiceCreateRouteGuard>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="new" options={{ headerShown: false }} />
        <Stack.Screen name="[id]" options={{ headerShown: false }} />
      </Stack>
    </InvoiceCreateRouteGuard>
  );
}
