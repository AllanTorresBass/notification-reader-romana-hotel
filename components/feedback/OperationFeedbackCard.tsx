import { StyleSheet, View } from 'react-native';

import { paletteForTone, toneForStatus } from '@/components/feedback/feedback-tokens';
import { FeedbackStatusIcon } from '@/components/feedback/FeedbackStatusIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { radius, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { OperationOutcome } from '@/types/feedback/operation-outcome.types';

interface OperationFeedbackCardProps {
  outcome: OperationOutcome;
}

export function OperationFeedbackCard({ outcome }: OperationFeedbackCardProps) {
  const { colors } = useThemeColors();
  const tone = toneForStatus(outcome.status);
  const palette = paletteForTone(tone, colors);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${outcome.title}. ${outcome.message}`}
      accessibilityLiveRegion="polite"
    >
      <FeedbackStatusIcon tone={tone} color={palette.accent} size={22} />
      <View style={styles.text}>
        <ThemedText variant="label" style={{ color: palette.accent }}>
          {outcome.title}
        </ThemedText>
        <ThemedText variant="body" muted>
          {outcome.message}
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
  text: { flex: 1, gap: spacing.xs },
});
