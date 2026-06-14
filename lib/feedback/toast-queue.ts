import { toastDurationSeconds, TOAST_QUEUE_GAP_MS } from '@/lib/feedback/toast-duration';
import type { OperationOutcome } from '@/types/feedback/operation-outcome.types';

type ToastPresenter = (outcome: OperationOutcome) => void;

let presenter: ToastPresenter | null = null;
const queue: OperationOutcome[] = [];
let isPresenting = false;
let drainTimer: ReturnType<typeof setTimeout> | null = null;

export function registerToastPresenter(next: ToastPresenter): void {
  presenter = next;
}

export function enqueueOutcomeToast(outcome: OperationOutcome): void {
  queue.push(outcome);
  void drainToastQueue();
}

export function getToastQueueLength(): number {
  return queue.length + (isPresenting ? 1 : 0);
}

export function resetToastQueueForTests(): void {
  queue.length = 0;
  isPresenting = false;
  if (drainTimer) {
    clearTimeout(drainTimer);
    drainTimer = null;
  }
}

async function drainToastQueue(): Promise<void> {
  if (isPresenting || queue.length === 0 || !presenter) return;

  isPresenting = true;
  const outcome = queue.shift()!;
  presenter(outcome);

  const waitMs = toastDurationSeconds(outcome) * 1000 + TOAST_QUEUE_GAP_MS;
  if (drainTimer) clearTimeout(drainTimer);
  drainTimer = setTimeout(() => {
    drainTimer = null;
    isPresenting = false;
    void drainToastQueue();
  }, waitMs);
}
