import * as Burnt from 'burnt';
import * as Haptics from 'expo-haptics';

import { toastDurationSeconds } from '@/lib/feedback/toast-duration';
import { enqueueOutcomeToast, registerToastPresenter } from '@/lib/feedback/toast-queue';
import type { OperationOutcome, OperationStatus } from '@/types/feedback/operation-outcome.types';

function presetForStatus(status: OperationStatus): 'done' | 'error' | 'none' {
  if (status === 'failed') return 'error';
  if (status === 'completed') return 'done';
  return 'none';
}

export function hapticForStatus(
  status: OperationStatus
): 'success' | 'error' | 'warning' | undefined {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'partial' || status === 'queued') return 'warning';
  return undefined;
}

export function presentOutcomeHaptic(outcome: OperationOutcome): void {
  const haptic = hapticForStatus(outcome.status);
  if (haptic === 'success') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return;
  }
  if (haptic === 'error') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return;
  }
  if (haptic === 'warning') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}

export function presentBurntToastImmediate(outcome: OperationOutcome): void {
  const preset = presetForStatus(outcome.status);
  const haptic = hapticForStatus(outcome.status);

  void Burnt.toast({
    title: outcome.title,
    message: outcome.message,
    preset,
    haptic,
    duration: toastDurationSeconds(outcome),
  });
}

registerToastPresenter(presentBurntToastImmediate);

export function presentOutcomeToast(outcome: OperationOutcome): void {
  enqueueOutcomeToast(outcome);
}
