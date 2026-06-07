import type { ReactNode } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { fonts, typography } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

type TextVariant = 'heading' | 'title' | 'subtitle' | 'body' | 'caption' | 'label' | 'button' | 'mono';

interface ThemedTextProps extends TextProps {
  variant?: TextVariant;
  muted?: boolean;
  children: ReactNode;
}

const variantStyles: Record<TextVariant, TextStyle> = {
  heading: { ...typography.heading, fontFamily: fonts.sansBold },
  title: { ...typography.title, fontFamily: fonts.sansBold },
  subtitle: { ...typography.subtitle, fontFamily: fonts.sans },
  body: { ...typography.body, fontFamily: fonts.sans },
  caption: { ...typography.caption, fontFamily: fonts.sans },
  label: { ...typography.label, fontFamily: fonts.sansSemiBold },
  button: { ...typography.button, fontFamily: fonts.sansSemiBold },
  mono: { ...typography.mono, fontFamily: fonts.mono, fontVariant: ['tabular-nums'] },
};

export function ThemedText({
  variant = 'body',
  muted = false,
  style,
  children,
  ...props
}: ThemedTextProps) {
  const { colors } = useThemeColors();

  return (
    <Text
      style={[
        variantStyles[variant],
        { color: muted ? colors.textMuted : colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
