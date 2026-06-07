import {
  enqueueOutcomeToast,
  registerToastPresenter,
  resetToastQueueForTests,
} from '@/lib/feedback/toast-queue';
import type { OperationOutcome } from '@/types/feedback/operation-outcome.types';

const outcome = (id: string): OperationOutcome => ({
  kind: 'pull_sync',
  status: 'completed',
  title: `Toast ${id}`,
  message: `Message ${id}`,
});

describe('toast-queue', () => {
  beforeEach(() => {
    resetToastQueueForTests();
    jest.useFakeTimers();
  });

  afterEach(() => {
    resetToastQueueForTests();
    jest.useRealTimers();
  });

  it('presents toasts sequentially without overlap', () => {
    const presented: string[] = [];
    registerToastPresenter((item) => {
      presented.push(item.title);
    });

    enqueueOutcomeToast(outcome('1'));
    enqueueOutcomeToast(outcome('2'));

    expect(presented).toEqual(['Toast 1']);

    jest.advanceTimersByTime(4350);
    expect(presented).toEqual(['Toast 1', 'Toast 2']);
  });

  it('queues additional toasts while one is presenting', () => {
    const presented: string[] = [];
    registerToastPresenter((item) => {
      presented.push(item.title);
    });

    enqueueOutcomeToast(outcome('a'));
    enqueueOutcomeToast(outcome('b'));
    enqueueOutcomeToast(outcome('c'));

    expect(presented).toHaveLength(1);

    jest.advanceTimersByTime(4350);
    expect(presented).toHaveLength(2);

    jest.advanceTimersByTime(4350);
    expect(presented).toHaveLength(3);
    expect(presented).toEqual(['Toast a', 'Toast b', 'Toast c']);
  });
});
