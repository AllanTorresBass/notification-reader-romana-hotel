import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Button } from '@/components/ui/Button';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: import('react-native').ViewStyle;
  accessibilityLabel?: string;
};

export function PrimaryButton({ variant = 'primary', ...props }: PrimaryButtonProps) {
  const mappedVariant =
    variant === 'danger' ? 'danger' : variant === 'secondary' ? 'secondary' : 'primary';
  return <Button variant={mappedVariant} {...props} />;
}

export type { PrimaryButtonProps };
