import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { radius, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const { colors } = useThemeColors();

  const stylesByVariant = {
    default: {
      backgroundColor: colors.primaryMuted,
      textColor: colors.primary,
      borderColor: 'transparent',
    },
    secondary: {
      backgroundColor: colors.surfaceElevated,
      textColor: colors.text,
      borderColor: 'transparent',
    },
    destructive: {
      backgroundColor: `${colors.danger}22`,
      textColor: colors.danger,
      borderColor: 'transparent',
    },
    outline: {
      backgroundColor: 'transparent',
      textColor: colors.text,
      borderColor: colors.border,
    },
    success: {
      backgroundColor: `${colors.success}22`,
      textColor: colors.success,
      borderColor: 'transparent',
    },
    warning: {
      backgroundColor: `${colors.warning}22`,
      textColor: colors.warning,
      borderColor: 'transparent',
    },
  }[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: stylesByVariant.backgroundColor,
          borderColor: stylesByVariant.borderColor,
        },
      ]}
    >
      <ThemedText variant="label" style={{ color: stylesByVariant.textColor }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
