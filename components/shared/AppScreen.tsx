import type { ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ui/ThemedText';
import { spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface AppScreenProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  headerRight?: ReactNode;
  contentStyle?: ViewStyle;
  logo?: number;
}

export function AppScreen({
  title,
  subtitle,
  children,
  scroll = true,
  headerRight,
  contentStyle,
  logo,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();

  const header = title ? (
    <View style={styles.headerRow}>
      <View style={styles.headerText}>
        {logo ? <Image source={logo} style={styles.logo} resizeMode="contain" /> : null}
        <ThemedText variant="heading">{title}</ThemedText>
        {subtitle ? (
          <ThemedText variant="subtitle" muted>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {headerRight}
    </View>
  ) : null;

  const body = (
    <>
      {header}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm },
      ]}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingBottom: insets.bottom }}>
          {header}
          <View style={[styles.content, styles.contentFlex, contentStyle]}>{children}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  headerText: { flex: 1, gap: spacing.xs },
  logo: { width: 40, height: 40, marginBottom: spacing.xs },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  contentFlex: { flex: 1, paddingHorizontal: spacing.md, gap: spacing.md },
});
