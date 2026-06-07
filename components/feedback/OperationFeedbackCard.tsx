import { CheckCircle, Clock, Info, XCircle } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { radius, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { OperationOutcome, OperationStatus } from '@/types/feedback/operation-outcome.types';

type FeedbackTone = 'success' | 'warning' | 'error' | 'info';

function toneForStatus(status: OperationStatus): FeedbackTone {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'queued' || status === 'partial') return 'warning';
  return 'info';
}

function StatusIcon({ tone, color }: { tone: FeedbackTone; color: string }) {
  const size = 22;
  if (tone === 'success') return <CheckCircle color={color} size={size} />;
  if (tone === 'error') return <XCircle color={color} size={size} />;
  if (tone === 'warning') return <Clock color={color} size={size} />;
  return <Info color={color} size={size} />;
}

interface OperationFeedbackCardProps {
  outcome: OperationOutcome;
}

export function OperationFeedbackCard({ outcome }: OperationFeedbackCardProps) {
  const { colors } = useThemeColors();
  const tone = toneForStatus(outcome.status);

  const palette = {
    success: {
      backgroundColor: `${colors.success}18`,
      borderColor: `${colors.success}44`,
      accent: colors.success,
    },
    warning: {
      backgroundColor: `${colors.warning}18`,
      borderColor: `${colors.warning}44`,
      accent: colors.warning,
    },
    error: {
      backgroundColor: `${colors.danger}18`,
      borderColor: `${colors.danger}44`,
      accent: colors.danger,
    },
    info: {
      backgroundColor: colors.accentSurface,
      borderColor: colors.border,
      accent: colors.textMuted,
    },
  }[tone];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${outcome.title}. ${outcome.message}`}
    >
      <StatusIcon tone={tone} color={palette.accent} />
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
