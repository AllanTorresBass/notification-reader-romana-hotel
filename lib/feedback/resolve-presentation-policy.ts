import type {
  FeedbackAnchor,
  PresentationContext,
  PresentationPolicy,
  PolicyResolverInput,
} from '@/types/feedback/presentation-policy.types';
import type { OperationKind } from '@/types/feedback/operation-outcome.types';

const PASSIVE_FETCH_KINDS: OperationKind[] = [
  'list_fetch',
  'notification_list_fetch',
];

const FORM_INLINE_KINDS: OperationKind[] = ['login'];

function isPassiveFetch(kind: OperationKind, context: PresentationContext): boolean {
  return PASSIVE_FETCH_KINDS.includes(kind) && !context.isUserInitiated;
}

function isContextualAction(
  kind: OperationKind,
  anchor: FeedbackAnchor | undefined
): boolean {
  if (kind === 'confirm_payment' && anchor === 'detail-sheet') return true;
  if (FORM_INLINE_KINDS.includes(kind) && anchor === 'form') return true;
  return false;
}

export function resolvePresentationPolicy({
  kind,
  context = {},
}: PolicyResolverInput): PresentationPolicy {
  const { anchor, isUserInitiated = false } = context;

  if (isPassiveFetch(kind, context)) {
    return {
      toast: false,
      log: true,
      sync: true,
      haptic: false,
      surfaces: ['empty', 'log'],
    };
  }

  if (isContextualAction(kind, anchor)) {
    return {
      toast: false,
      log: true,
      sync: true,
      haptic: true,
      surfaces: ['inline', 'log'],
    };
  }

  if (kind === 'shade_sync' && !isUserInitiated) {
    return {
      toast: false,
      log: true,
      sync: true,
      haptic: false,
      surfaces: ['log'],
    };
  }

  if (kind === 'background_sync') {
    return {
      toast: true,
      log: true,
      sync: true,
      haptic: false,
      surfaces: ['toast', 'log'],
    };
  }

  if (
    kind === 'session_expired' ||
    kind === 'storage_failure' ||
    kind === 'listener_bridge_failure' ||
    kind === 'activity_log_sync' ||
    kind === 'sync_job_failed' ||
    kind === 'unhandled_exception'
  ) {
    return {
      toast: false,
      log: true,
      sync: true,
      haptic: false,
      surfaces: ['log'],
    };
  }

  if (kind === 'pull_sync' && anchor === 'list' && isUserInitiated) {
    return {
      toast: true,
      log: true,
      sync: true,
      haptic: false,
      surfaces: ['toast', 'banner', 'log'],
    };
  }

  return {
    toast: true,
    log: true,
    sync: true,
    haptic: true,
    surfaces: ['toast', 'log'],
  };
}
