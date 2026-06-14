import type { BannerItem, BannerVariant } from '@/components/ui/Banner';
import type { OperationOutcome, OperationStatus } from '@/types/feedback/operation-outcome.types';

function bannerVariantForStatus(status: OperationStatus): BannerVariant {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'queued' || status === 'partial') return 'warning';
  return 'info';
}

export function outcomeToBannerItem(
  outcome: OperationOutcome,
  options?: {
    id?: string;
    dismissible?: boolean;
    onDismiss?: () => void;
    actionLabel?: string;
    onAction?: () => void;
  }
): BannerItem {
  return {
    id: options?.id ?? `${outcome.kind}-${Date.now()}`,
    title: outcome.title,
    message: outcome.message,
    variant: bannerVariantForStatus(outcome.status),
    dismissible: options?.dismissible,
    onDismiss: options?.onDismiss,
    actionLabel: options?.actionLabel ?? outcome.actionLabel,
    onAction: options?.onAction,
  };
}
