import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { radius, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

type BannerVariant = 'info' | 'warning' | 'error' | 'success';

interface BannerProps {
  message: string;
  variant?: BannerVariant;
  actionLabel?: string;
  onAction?: () => void;
}

export function Banner({ message, variant = 'info', actionLabel, onAction }: BannerProps) {
  const { colors } = useThemeColors();

  const variantStyles = {
    info: {
      backgroundColor: colors.accentSurface,
      textColor: colors.text,
      borderColor: colors.border,
    },
    warning: {
      backgroundColor: `${colors.warning}22`,
      textColor: colors.warning,
      borderColor: `${colors.warning}44`,
    },
    error: {
      backgroundColor: `${colors.danger}22`,
      textColor: colors.danger,
      borderColor: `${colors.danger}44`,
    },
    success: {
      backgroundColor: `${colors.success}22`,
      textColor: colors.success,
      borderColor: `${colors.success}44`,
    },
  }[variant];

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
        },
      ]}
    >
      <ThemedText variant="caption" style={[styles.message, { color: variantStyles.textColor }]}>
        {message}
      </ThemedText>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <ThemedText variant="label" style={{ color: colors.primary }}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  message: { flex: 1, fontWeight: '600' },
});
