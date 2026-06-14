import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface PaymentTimelineSectionHeaderProps {
  title: string;
}

export function PaymentTimelineSectionHeader({ title }: PaymentTimelineSectionHeaderProps) {
  const { colors } = useThemeColors();

  return (
    <ThemedText
      variant="label"
      muted
      style={[styles.sectionHeader, { backgroundColor: colors.background }]}
    >
      {title}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
});
