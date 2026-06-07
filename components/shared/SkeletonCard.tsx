import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Card } from '@/components/ui/Card';
import { radius, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

export function SkeletonCard() {
  const { colors } = useThemeColors();
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Card style={styles.card}>
      <Animated.View style={[styles.lineLg, pulseStyle, { backgroundColor: colors.surfaceElevated }]} />
      <Animated.View style={[styles.lineSm, pulseStyle, { backgroundColor: colors.surfaceElevated }]} />
      <Animated.View style={[styles.lineMd, pulseStyle, { backgroundColor: colors.surfaceElevated }]} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, padding: spacing.md, gap: spacing.sm },
  lineLg: { height: 24, borderRadius: radius.sm, width: '55%' },
  lineSm: { height: 14, borderRadius: radius.sm, width: '80%' },
  lineMd: { height: 14, borderRadius: radius.sm, width: '40%' },
});
