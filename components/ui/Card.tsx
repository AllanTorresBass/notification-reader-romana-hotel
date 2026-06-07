import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { radius, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const { colors } = useThemeColors();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
}

export function CardHeader({ title, description }: CardHeaderProps) {
  return (
    <View style={styles.header}>
      <ThemedText variant="title">{title}</ThemedText>
      {description ? (
        <ThemedText variant="caption" muted>
          {description}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function CardContent({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.content, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
  },
  header: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
});
