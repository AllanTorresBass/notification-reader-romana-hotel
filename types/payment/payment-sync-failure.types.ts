export type PaymentFailureClass =
  | 'parse_failed'
  | 'parse_partial'
  | 'missing_mobile'
  | 'auth_required'
  | 'network_error'
  | 'validation_error'
  | 'forbidden'
  | 'confirm_unsynced'
  | 'duplicate_key'
  | 'unknown';

export type PaymentFailureStage = 'parse' | 'enqueue' | 'create' | 'confirm' | 'pull';

export type PaymentActionKind =
  | 'complete_data'
  | 'sync_and_confirm'
  | 'confirm_payment'
  | 'retry_sync'
  | 'login_required'
  | 'pending_sync'
  | 'none';

export interface ResolvedPaymentAction {
  kind: PaymentActionKind;
  hint: string | null;
  actionable: boolean;
}
