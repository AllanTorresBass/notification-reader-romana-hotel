import { FeedbackInline } from '@/components/feedback/FeedbackInline';

interface FeedbackFieldErrorProps {
  message?: string | null;
}

export function FeedbackFieldError({ message }: FeedbackFieldErrorProps) {
  if (!message) return null;
  return <FeedbackInline message={message} compact />;
}
