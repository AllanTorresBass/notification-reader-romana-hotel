import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
} from '@expo-google-fonts/playfair-display';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
} from '@expo-google-fonts/geist-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { LaRomanaLogo } from '@/components/brand/LaRomanaLogo';
import { AppProviders } from '@/providers/AppProviders';
import { spacing } from '@/constants/theme';
import { palette, resolveThemeMode } from '@/constants/theme';
import { usePreferencesStore } from '@/stores/preferences-store';

export { AppErrorBoundary as ErrorBoundary } from '@/components/feedback/AppErrorBoundary';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const themePreference = usePreferencesStore((s) => s.theme);
  const systemScheme = useColorScheme();
  const resolvedTheme = resolveThemeMode(themePreference, systemScheme);
  const colors = palette[resolvedTheme];

  const [loaded, error] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_400Regular,
    GeistMono_500Medium,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={[styles.boot, { backgroundColor: colors.background }]}>
        <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
        <LaRomanaLogo size={80} showTagline />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <AppProviders>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
