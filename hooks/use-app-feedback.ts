import { reportError, reportOutcome, reportOutcomeWithPolicy } from '@/lib/feedback/report-feedback';
import type { OperationKind, OperationOutcome } from '@/types/feedback/operation-outcome.types';
import type { ReportOutcomeOptions } from '@/lib/feedback/report-feedback';

export function useAppFeedback() {
  return {
    reportOutcome: (outcome: OperationOutcome, options?: ReportOutcomeOptions) =>
      reportOutcome(outcome, options),
    reportOutcomeWithPolicy: (
      outcome: OperationOutcome,
      context?: ReportOutcomeOptions['presentationContext'],
      options?: ReportOutcomeOptions
    ) => reportOutcomeWithPolicy(outcome, context, options),
    reportError: (
      kind: OperationKind,
      error: unknown,
      fallback: string,
      context: 'fetch' | 'action' = 'action',
      options?: ReportOutcomeOptions
    ) => reportError(kind, error, fallback, context, options),
  };
}
