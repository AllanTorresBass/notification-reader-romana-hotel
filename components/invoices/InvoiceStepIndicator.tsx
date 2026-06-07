import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { WizardStep } from '@/hooks/use-invoice-wizard';

interface InvoiceStepIndicatorProps {
  step: WizardStep;
  setupLabel: string;
  reviewLabel: string;
}

const STEPS: WizardStep[] = ['setup', 'review'];

export function InvoiceStepIndicator({ step, setupLabel, reviewLabel }: InvoiceStepIndicatorProps) {
  const { colors } = useThemeColors();
  const labels = { setup: setupLabel, review: reviewLabel };
  const activeIndex = STEPS.indexOf(step);

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {STEPS.map((s, index) => {
        const active = index === activeIndex;
        const completed = index < activeIndex;
        return (
          <View key={s} style={styles.stepRow} accessibilityRole="tab" accessibilityState={{ selected: active }}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: active || completed ? colors.primary : colors.surfaceElevated,
                },
              ]}
            />
            <ThemedText
              variant="caption"
              style={{ color: active ? colors.primary : colors.textMuted }}
            >
              {labels[s]}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
