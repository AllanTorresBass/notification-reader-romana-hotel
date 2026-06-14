import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { radius, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface SettingRowProps {
  label: string;
  description?: string;
  right: ReactNode;
}

export function SettingRow({ label, description, right }: SettingRowProps) {
  const { colors } = useThemeColors();

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.labelBlock}>
        <ThemedText variant="body" style={styles.label}>
          {label}
        </ThemedText>
        {description ? (
          <ThemedText variant="caption" muted>
            {description}
          </ThemedText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  labelBlock: { flex: 1, gap: spacing.xs },
  label: { fontWeight: '500' },
});
