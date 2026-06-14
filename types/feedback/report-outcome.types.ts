import type { PresentationContext } from '@/types/feedback/presentation-policy.types';

export interface ReportOutcomeOptions {
  toast?: boolean;
  log?: boolean;
  sync?: boolean;
  haptic?: boolean;
  presentationContext?: PresentationContext;
}
