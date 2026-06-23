import { Search, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { TextInput } from '@/components/ui/TextInput';
import { spacing } from '@/constants/theme';
import { MIN_TOUCH_TARGET, touchTargetStyle } from '@/constants/touch';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { hasText, trimText } from '@/lib/utils/safe-text';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  clearAccessibilityLabel: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  clearAccessibilityLabel,
}: SearchBarProps) {
  const { colors } = useThemeColors();
  const safeValue = trimText(value);

  return (
    <View style={styles.searchRow}>
      <Search color={colors.textMuted} size={18} style={styles.searchIcon} />
      <TextInput
        value={safeValue}
        onChangeText={onChangeText}
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel}
        style={styles.searchInput}
        returnKeyType="search"
      />
      {safeValue.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={clearAccessibilityLabel}
          onPress={() => onChangeText('')}
          hitSlop={8}
          style={[styles.clearButton, touchTargetStyle]}
        >
          <X color={colors.textMuted} size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  searchIcon: { position: 'absolute', left: spacing.md + spacing.sm, zIndex: 1 },
  searchInput: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    paddingLeft: spacing.xl + spacing.sm,
    paddingRight: spacing.xl + MIN_TOUCH_TARGET,
  },
  clearButton: {
    position: 'absolute',
    right: spacing.md + spacing.sm,
    zIndex: 1,
  },
});
