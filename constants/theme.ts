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

export const palette: Record<ThemeMode, ThemeColors> = {
  dark: {
    background: '#05080B',
    text: '#F5F5F5',
    surface: '#0C1014',
    surfaceElevated: '#171B1F',
    primary: '#DF202E',
    primaryForeground: '#F8F8F8',
    textMuted: '#8F8F8F',
    border: '#25292E',
    input: '#171B1F',
    danger: '#D40924',
    success: '#11AD32',
    warning: '#D9A514',
    accentSurface: '#1A222B',
    ring: '#DF202E',
    primaryMuted: 'rgba(223, 32, 46, 0.18)',
    accent: '#DF202E',
    accentMuted: 'rgba(223, 32, 46, 0.18)',
    chip: '#171B1F',
  },
  light: {
    background: '#FAFAFA',
    text: '#0A0A0A',
    surface: '#FFFFFF',
    surfaceElevated: '#F4F4F5',
    primary: '#DF202E',
    primaryForeground: '#FFFFFF',
    textMuted: '#71717A',
    border: '#E4E4E7',
    input: '#F4F4F5',
    danger: '#DC2626',
    success: '#16A34A',
    warning: '#CA8A04',
    accentSurface: '#F4F4F5',
    ring: '#DF202E',
    primaryMuted: 'rgba(223, 32, 46, 0.1)',
    accent: '#DF202E',
    accentMuted: 'rgba(223, 32, 46, 0.1)',
    chip: '#F4F4F5',
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
