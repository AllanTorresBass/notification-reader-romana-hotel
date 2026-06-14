import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { type ErrorBoundaryProps } from 'expo-router';

import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { spacing } from '@/constants/theme';
import { reportServiceError } from '@/lib/feedback/report-service-error';
import { useThemeColors } from '@/hooks/use-theme-colors';

export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { colors } = useThemeColors();

  useEffect(() => {
    reportServiceError(
      'unhandled_exception',
      error,
      'La app encontró un error inesperado.',
      {
        source: 'AppErrorBoundary',
        toast: false,
      }
    );
  }, [error]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedText variant="title">Algo salió mal</ThemedText>
      <ThemedText variant="body" muted style={styles.message}>
        {error.message}
      </ThemedText>
      <PrimaryButton label="Reintentar" onPress={retry} />
      <Pressable onPress={retry} accessibilityRole="button">
        <ThemedText variant="caption" muted style={styles.hint}>
          Si el problema continúa, revisa Actividad reciente en Ajustes.
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  message: {
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
