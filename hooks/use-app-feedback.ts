import { reportError, reportOutcome } from '@/lib/feedback/report-feedback';
import { useGlobalErrorHandler } from '@/hooks/use-global-error-handler';
import type { OperationKind, OperationOutcome } from '@/types/feedback/operation-outcome.types';
import type { ReportOutcomeOptions } from '@/lib/feedback/report-feedback';

export function useAppFeedback() {
  const { showSuccess, showPending, showInfo, showWarning, handleFetchError, handleCrudError } =
    useGlobalErrorHandler();

  return {
    reportOutcome: (outcome: OperationOutcome, options?: ReportOutcomeOptions) =>
      reportOutcome(outcome, options),
    reportError: (
      kind: OperationKind,
      error: unknown,
      fallback: string,
      context: 'fetch' | 'action' = 'action',
      options?: ReportOutcomeOptions
    ) => reportError(kind, error, fallback, context, options),
    showSuccess,
    showPending,
    showInfo,
    showWarning,
    handleFetchError,
    handleCrudError,
  };
}
