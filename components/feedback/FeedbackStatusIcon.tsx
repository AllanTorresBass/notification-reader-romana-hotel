import { AlertTriangle, CheckCircle, Clock, Info, XCircle } from 'lucide-react-native';

import type { FeedbackTone } from '@/components/feedback/feedback-tokens';

interface FeedbackStatusIconProps {
  tone: FeedbackTone;
  color: string;
  size?: number;
}

export function FeedbackStatusIcon({ tone, color, size = 20 }: FeedbackStatusIconProps) {
  if (tone === 'success') return <CheckCircle color={color} size={size} />;
  if (tone === 'error') return <XCircle color={color} size={size} />;
  if (tone === 'warning') return <Clock color={color} size={size} />;
  return <Info color={color} size={size} />;
}

export function FeedbackWarningIcon({ color, size = 18 }: { color: string; size?: number }) {
  return <AlertTriangle color={color} size={size} />;
}
