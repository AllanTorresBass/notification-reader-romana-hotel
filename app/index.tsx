import { Redirect, useRootNavigationState } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { KdGymLogo } from '@/components/brand/KdGymLogo';
import { ThemedText } from '@/components/ui/ThemedText';
import { spacing } from '@/constants/theme';
import { useAppGates } from '@/hooks/use-app-gates';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function IndexScreen() {
  const navigationState = useRootNavigationState();
  const { colors } = useThemeColors();
  const { isAndroid, accessLoading, needsOnboarding, isReady } = useAppGates();

  if (!navigationState?.key) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <KdGymLogo size={72} />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!isAndroid) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ThemedText variant="title">Solo Android</ThemedText>
        <ThemedText variant="body" muted style={styles.subtitle}>
          KD-Gym Pagos requiere un dispositivo Android con acceso a notificaciones.
        </ThemedText>
      </View>
    );
  }

  if (accessLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <KdGymLogo size={72} />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (isReady) {
    return <Redirect href="/(tabs)/feed" />;
  }

  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: spacing.md,
  },
  subtitle: { textAlign: 'center' },
});
