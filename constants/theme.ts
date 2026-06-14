import type { ColorSchemeName } from 'react-native';

export type ThemePreference = 'dark' | 'light' | 'system';
export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  text: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryForeground: string;
  textMuted: string;
  border: string;
  input: string;
  danger: string;
  success: string;
  warning: string;
  accentSurface: string;
  ring: string;
  /** @deprecated use primary */
  accent: string;
  /** @deprecated use primaryMuted */
  accentMuted: string;
  /** @deprecated use surfaceElevated */
  chip: string;
  primaryMuted: string;
}

/** La Romana — Midnight Onyx + Imperial Gold (aligned with Next.js web app tokens). */
export const palette: Record<ThemeMode, ThemeColors> = {
  dark: {
    background: '#1A1814',
    text: '#F0EDE6',
    surface: '#241F1A',
    surfaceElevated: '#2E2820',
    primary: '#C9A84A',
    primaryForeground: '#1A1814',
    textMuted: '#A89F8F',
    border: 'rgba(196, 184, 160, 0.28)',
    input: 'rgba(196, 184, 160, 0.18)',
    danger: '#E05555',
    success: '#3DAB6E',
    warning: '#D9A514',
    accentSurface: '#322C24',
    ring: '#C9A84A',
    primaryMuted: 'rgba(201, 168, 74, 0.18)',
    accent: '#C9A84A',
    accentMuted: 'rgba(201, 168, 74, 0.18)',
    chip: '#2E2820',
  },
  light: {
    background: '#FAF8F4',
    text: '#1A1814',
    surface: '#FFFFFF',
    surfaceElevated: '#F3EFE6',
    primary: '#A8872E',
    primaryForeground: '#FFFFFF',
    textMuted: '#6B6358',
    border: '#E4DDD0',
    input: '#F3EFE6',
    danger: '#DC2626',
    success: '#15803D',
    warning: '#CA8A04',
    accentSurface: '#F3EFE6',
    ring: '#A8872E',
    primaryMuted: 'rgba(168, 135, 46, 0.12)',
    accent: '#A8872E',
    accentMuted: 'rgba(168, 135, 46, 0.12)',
    chip: '#F3EFE6',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 5,
  md: 6,
  lg: 8,
  xl: 11,
  '2xl': 14,
  full: 999,
} as const;

export const typography = {
  heading: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700' as const },
  subtitle: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '600' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
  mono: { fontSize: 14, fontWeight: '500' as const },
} as const;

export const fonts = {
  sans: 'Geist_400Regular',
  sansMedium: 'Geist_500Medium',
  sansSemiBold: 'Geist_600SemiBold',
  sansBold: 'Geist_700Bold',
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
  /** Playfair Display — headings (web parity with La Romana web app) */
  heading: 'PlayfairDisplay_600SemiBold',
  headingRegular: 'PlayfairDisplay_400Regular',
} as const;

export function resolveThemeMode(
  preference: ThemePreference,
  systemScheme: ColorSchemeName | null | undefined
): ThemeMode {
  if (preference === 'system') {
    return systemScheme === 'light' ? 'light' : 'dark';
  }
  return preference;
}
