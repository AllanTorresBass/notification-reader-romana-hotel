import * as Burnt from 'burnt';

import type { OperationOutcome, OperationStatus } from '@/types/feedback/operation-outcome.types';

function presetForStatus(status: OperationStatus): 'done' | 'error' | 'none' {
  if (status === 'failed') return 'error';
  if (status === 'completed') return 'done';
  return 'none';
}

function hapticForStatus(status: OperationStatus): 'success' | 'error' | 'warning' | undefined {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'partial' || status === 'queued') return 'warning';
  return undefined;
}

function durationForOutcome(outcome: OperationOutcome): number {
  if (outcome.kind === 'confirm_payment' || outcome.kind === 'assign_client') {
    return outcome.status === 'failed' ? 5 : 4;
  }
  return outcome.status === 'failed' ? 4 : 3;
}

export function presentOutcomeToast(outcome: OperationOutcome): void {
  const preset = presetForStatus(outcome.status);
  const haptic = hapticForStatus(outcome.status);

  void Burnt.toast({
    title: outcome.title,
    message: outcome.message,
    preset,
    haptic,
    duration: durationForOutcome(outcome),
  });
}
