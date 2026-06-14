import type { ButtonProps } from '@/components/ui/Button';
import { Button } from '@/components/ui/Button';

type PrimaryButtonProps = Omit<ButtonProps, 'variant'> & {
  variant?: 'primary' | 'secondary' | 'danger';
};

export function PrimaryButton({ variant = 'primary', loading, ...props }: PrimaryButtonProps) {
  const mappedVariant =
    variant === 'danger' ? 'danger' : variant === 'secondary' ? 'secondary' : 'primary';
  return <Button variant={mappedVariant} loading={loading} {...props} />;
}

export type { PrimaryButtonProps };
