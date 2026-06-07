import { StyleSheet, View } from 'react-native';

import {
  paletteForTone,
  toneForStatus,
  toneForValidation,
  type FeedbackTone,
} from '@/components/feedback/feedback-tokens';
import { FeedbackStatusIcon } from '@/components/feedback/FeedbackStatusIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { radius, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { OperationOutcome } from '@/types/feedback/operation-outcome.types';

interface FeedbackInlineProps {
  message?: string;
  title?: string;
  tone?: FeedbackTone;
  outcome?: OperationOutcome;
  compact?: boolean;
}

export function FeedbackInline({
  message,
  title,
  tone,
  outcome,
  compact = false,
}: FeedbackInlineProps) {
  const { colors } = useThemeColors();
  const resolvedTone = tone ?? (outcome ? toneForStatus(outcome.status) : toneForValidation());
  const palette = paletteForTone(resolvedTone, colors);
  const displayTitle = title ?? outcome?.title;
  const displayMessage = message || outcome?.message || '';

  if (!displayMessage) return null;

  return (
    <View
      style={[
        compact ? styles.compact : styles.card,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={
        displayTitle ? `${displayTitle}. ${displayMessage}` : displayMessage
      }
      accessibilityLiveRegion="polite"
    >
      <FeedbackStatusIcon tone={resolvedTone} color={palette.accent} size={compact ? 16 : 18} />
      <View style={styles.text}>
        {displayTitle && !compact ? (
          <ThemedText variant="label" style={{ color: palette.accent }}>
            {displayTitle}
          </ThemedText>
        ) : null}
        <ThemedText
          variant={compact ? 'caption' : 'body'}
          style={{ color: compact ? palette.accent : undefined }}
          muted={!compact}
          numberOfLines={compact ? 2 : undefined}
        >
          {displayMessage}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  text: { flex: 1, gap: 2 },
});
