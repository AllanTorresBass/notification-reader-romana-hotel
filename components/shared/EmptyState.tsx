import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { spacing } from '@/constants/theme';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.inner}>
        <ThemedText variant="title">{title}</ThemedText>
        <ThemedText variant="body" muted style={styles.description}>
          {description}
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
