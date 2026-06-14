import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { MIN_TOUCH_TARGET, touchTargetStyle } from '@/constants/touch';
import { useThemeColors } from '@/hooks/use-theme-colors';

export interface PagosManualRegisterButtonProps {
  visible: boolean;
  onPress: () => void;
}

export function PagosManualRegisterButton({ visible, onPress }: PagosManualRegisterButtonProps) {
  const { colors } = useThemeColors();

  if (!visible) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.pagos.manualRegister}
      onPress={onPress}
      hitSlop={8}
      style={[styles.button, touchTargetStyle]}
    >
      <Plus color={colors.primary} size={24} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: MIN_TOUCH_TARGET / 2,
  },
});
