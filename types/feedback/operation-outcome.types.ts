export type OperationStatus = 'completed' | 'queued' | 'partial' | 'failed' | 'skipped';

export type OperationKind =
  | 'capture_notification'
  | 'shade_sync'
  | 'manual_register'
  | 'confirm_payment'
  | 'assign_client'
  | 'pull_sync'
  | 'queue_retry'
  | 'login'
  | 'logout'
  | 'test_connection'
  | 'clear_cache'
  | 'clear_history'
  | 'rescan_bdv'
  | 'background_sync'
  | 'list_fetch'
  | 'notification_list_fetch'
  | 'purge_retention'
  | 'create_client'
  | 'create_invoice'
  | 'invoice_list_fetch'
  | 'client_search'
  | 'access_check'
  | 'onboarding_skip';

export interface OperationOutcome {
  kind: OperationKind;
  status: OperationStatus;
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  meta?: Record<string, string | number | boolean>;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  outcome: OperationOutcome;
}
