import type { OperationKind } from '@/types/feedback/operation-outcome.types';

export type FeedbackSurface = 'toast' | 'banner' | 'inline' | 'field' | 'empty' | 'log';

export type FeedbackAnchor =
  | 'detail-sheet'
  | 'form'
  | 'list'
  | 'screen'
  | 'background';

export interface PresentationContext {
  anchor?: FeedbackAnchor;
  /** True when the user explicitly triggered the operation (pull-to-refresh, button tap). */
  isUserInitiated?: boolean;
}

export interface PresentationPolicy {
  toast: boolean;
  log: boolean;
  sync: boolean;
  haptic: boolean;
  surfaces: FeedbackSurface[];
}

export type PolicyResolverInput = {
  kind: OperationKind;
  context?: PresentationContext;
};
