import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { radius, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

export type BannerVariant = 'info' | 'warning' | 'error' | 'success';

export interface BannerItem {
  id: string;
  title?: string;
  message: string;
  variant?: BannerVariant;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
}

interface BannerProps extends Omit<BannerItem, 'id'> {
  title?: string;
  message: string;
}

function BannerIcon({ variant, color }: { variant: BannerVariant; color: string }) {
  const size = 18;
  if (variant === 'error') return <XCircle color={color} size={size} />;
  if (variant === 'warning') return <AlertTriangle color={color} size={size} />;
  if (variant === 'success') return <CheckCircle color={color} size={size} />;
  return <Info color={color} size={size} />;
}

export function Banner({
  title,
  message,
  variant = 'info',
  actionLabel,
  onAction,
  dismissible = false,
  onDismiss,
}: BannerProps) {
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
      <BannerIcon variant={variant} color={variantStyles.textColor} />
      <View style={styles.textBlock}>
        {title ? (
          <ThemedText variant="label" style={{ color: variantStyles.textColor }}>
            {title}
          </ThemedText>
        ) : null}
        <ThemedText
          variant="caption"
          style={[
            styles.message,
            { color: title ? colors.textMuted : variantStyles.textColor, fontWeight: title ? '400' : '600' },
          ]}
        >
          {message}
        </ThemedText>
      </View>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <ThemedText variant="label" style={{ color: colors.primary }}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
      {dismissible && onDismiss ? (
        <Pressable accessibilityRole="button" onPress={onDismiss} hitSlop={8}>
          <X color={variantStyles.textColor} size={16} />
        </Pressable>
      ) : null}
    </View>
  );
}

interface BannerStackProps {
  items: BannerItem[];
}

const PRIORITY: Record<BannerVariant, number> = {
  error: 0,
  warning: 1,
  success: 2,
  info: 3,
};

export function BannerStack({ items }: BannerStackProps) {
  const sorted = [...items].sort(
    (a, b) => PRIORITY[a.variant ?? 'info'] - PRIORITY[b.variant ?? 'info']
  );
  const visible = sorted.slice(0, 2);

  if (visible.length === 0) return null;

  return (
    <View style={styles.stack}>
      {visible.map((item) => (
        <Banner key={item.id} {...item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.xs },
  banner: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  textBlock: { flex: 1, gap: 2 },
  message: { flex: 1 },
});
