import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { paletteForTone, type FeedbackTone } from '@/components/feedback/feedback-tokens';
import { FeedbackStatusIcon } from '@/components/feedback/FeedbackStatusIcon';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { OperationOutcome } from '@/types/feedback/operation-outcome.types';

interface FeedbackEmptyStateProps {
  title: string;
  description: string;
  variant?: FeedbackTone | 'neutral';
  outcome?: OperationOutcome;
  action?: ReactNode;
}

function toneFromVariant(variant: FeedbackEmptyStateProps['variant']): FeedbackTone | null {
  if (!variant || variant === 'neutral') return null;
  return variant;
}

export function FeedbackEmptyState({
  title,
  description,
  variant = 'neutral',
  outcome,
  action,
}: FeedbackEmptyStateProps) {
  const { colors } = useThemeColors();
  const tone = toneFromVariant(variant);
  const palette = tone ? paletteForTone(tone, colors) : null;
  const displayTitle = outcome?.title ?? title;
  const displayDescription = outcome?.message ?? description;

  const cardStyle: ViewStyle = palette
    ? {
        ...styles.card,
        backgroundColor: palette.backgroundColor,
        borderColor: palette.borderColor,
        borderWidth: 1,
      }
    : styles.card;

  return (
    <Card style={cardStyle}>
      <View style={styles.inner}>
        {tone && palette ? (
          <FeedbackStatusIcon tone={tone} color={palette.accent} size={28} />
        ) : null}
        <ThemedText variant="title" style={tone && palette ? { color: palette.accent } : undefined}>
          {displayTitle}
        </ThemedText>
        <ThemedText variant="body" muted style={styles.description}>
          {displayDescription}
        </ThemedText>
        {action}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { margin: spacing.md },
  inner: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  description: { textAlign: 'center' },
});
