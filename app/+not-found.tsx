import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function NotFoundScreen() {
  const { colors } = useThemeColors();

  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemedText variant="title">Esta pantalla no existe.</ThemedText>
        <Link href="/" asChild>
          <Pressable accessibilityRole="link">
            <ThemedText variant="body" style={{ color: colors.primary, fontWeight: '600' }}>
              Ir al inicio
            </ThemedText>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
});
