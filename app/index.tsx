import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { useAppGates } from '@/hooks/use-app-gates';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function IndexScreen() {
  const { colors } = useThemeColors();
  const { isAndroid, accessLoading, needsOnboarding, isReady } = useAppGates();

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
    gap: 12,
  },
  subtitle: { textAlign: 'center' },
});
