import { useColorScheme } from 'react-native';

import { palette, resolveThemeMode, type ThemeMode, type ThemePreference } from '@/constants/theme';
import { usePreferencesStore } from '@/stores/preferences-store';

export function useThemeColors() {
  const themePreference = usePreferencesStore((s) => s.theme);
  const systemScheme = useColorScheme();
  const resolvedTheme: ThemeMode = resolveThemeMode(themePreference, systemScheme);
  const colors = palette[resolvedTheme];

  return {
    theme: themePreference,
    resolvedTheme,
    colors,
    isDark: resolvedTheme === 'dark',
  };
}

export function useThemePreference(): ThemePreference {
  return usePreferencesStore((s) => s.theme);
}
