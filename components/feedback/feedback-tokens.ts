import type { ThemeColors } from '@/constants/theme';
import type { OperationStatus } from '@/types/feedback/operation-outcome.types';

export type FeedbackTone = 'success' | 'warning' | 'error' | 'info';

export function toneForStatus(status: OperationStatus): FeedbackTone {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'queued' || status === 'partial') return 'warning';
  return 'info';
}

export function toneForValidation(): FeedbackTone {
  return 'error';
}

export interface FeedbackPalette {
  backgroundColor: string;
  borderColor: string;
  accent: string;
}

export function paletteForTone(tone: FeedbackTone, colors: ThemeColors): FeedbackPalette {
  const map: Record<FeedbackTone, FeedbackPalette> = {
    success: {
      backgroundColor: `${colors.success}18`,
      borderColor: `${colors.success}44`,
      accent: colors.success,
    },
    warning: {
      backgroundColor: `${colors.warning}18`,
      borderColor: `${colors.warning}44`,
      accent: colors.warning,
    },
    error: {
      backgroundColor: `${colors.danger}18`,
      borderColor: `${colors.danger}44`,
      accent: colors.danger,
    },
    info: {
      backgroundColor: colors.accentSurface,
      borderColor: colors.border,
      accent: colors.textMuted,
    },
  };
  return map[tone];
}
