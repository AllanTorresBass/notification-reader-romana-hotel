import { Image, StyleSheet, View, type ViewStyle } from 'react-native';

import { KD_GYM_LOGO } from '@/constants/kd-gym-brand';

interface KdGymLogoProps {
  size?: number;
  style?: ViewStyle;
}

export function KdGymLogo({ size = 64, style }: KdGymLogoProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Image
        source={KD_GYM_LOGO}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="contain"
        accessibilityLabel="Logo de KD-Gym"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});
