import type { OperationOutcome } from '@/types/feedback/operation-outcome.types';

/** Burnt toast duration in seconds (matches present-outcome). */
export function toastDurationSeconds(outcome: OperationOutcome): number {
  if (outcome.kind === 'confirm_payment') {
    return outcome.status === 'failed' ? 5 : 4;
  }
  return outcome.status === 'failed' ? 4 : 3;
}

export const TOAST_QUEUE_GAP_MS = 350;
