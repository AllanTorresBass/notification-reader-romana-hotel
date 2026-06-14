import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { LA_ROMANA_BRAND, LA_ROMANA_TAGLINE } from '@/constants/la-romana-brand';
import { spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

export interface LaRomanaLogoProps {
  size?: number;
  showTagline?: boolean;
  style?: ViewStyle;
}

export function LaRomanaLogo({ size = 56, showTagline = false, style }: LaRomanaLogoProps) {
  const { colors } = useThemeColors();
  const ringSize = size;
  const innerSize = size * 0.88;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="La Romana Motel"
      style={[styles.wrap, style]}
    >
      <View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderColor: `${colors.primary}55`,
          },
        ]}
      >
        <View
          style={[
            styles.inner,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: colors.surfaceElevated,
            },
          ]}
        >
          <ThemedText
            variant="label"
            style={[styles.monogram, { fontSize: size * 0.28, color: colors.primary }]}
          >
            LR
          </ThemedText>
        </View>
      </View>
      {showTagline ? (
        <View style={styles.copy}>
          <ThemedText variant="title" style={{ color: colors.primary, letterSpacing: 1 }}>
            La Romana
          </ThemedText>
          <ThemedText variant="caption" muted style={styles.tagline}>
            {LA_ROMANA_TAGLINE}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm },
  ring: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogram: {
    fontWeight: '700',
    letterSpacing: 2,
  },
  copy: { alignItems: 'center', gap: 2 },
  tagline: {
    textTransform: 'uppercase',
    letterSpacing: 3,
    fontSize: 10,
    color: LA_ROMANA_BRAND.muted,
  },
});
