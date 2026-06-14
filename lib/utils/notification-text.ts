import type { NotificationData } from 'expo-android-notification-listener-service';

import type { NotificationRecord } from '@/types/notification/notification.types';
import type { PagomovilParseInput } from '@/types/payment/parsed-payment.types';

function pickLongestText(...candidates: (string | null | undefined)[]): string | null {
  const trimmed = candidates
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  if (trimmed.length === 0) return null;
  return trimmed.sort((a, b) => b.length - a.length)[0];
}

export function extractReadableTexts(data: NotificationData): {
  title: string | null;
  body: string | null;
  bigText: string | null;
} {
  const title = pickLongestText(data.title, data.subText) ?? data.title?.trim() ?? null;
  const bigText = data.bigText?.trim() || null;
  const body =
    pickLongestText(data.text, data.bigText, data.summaryText, data.subText) ??
    data.text?.trim() ??
    null;

  return { title, body, bigText };
}

export function notificationRecordToParseInput(record: NotificationRecord): PagomovilParseInput {
  return {
    title: record.title,
    body: record.body,
    bigText: record.bigText,
  };
}

export function getNotificationCombinedText(
  input: PagomovilParseInput | NotificationRecord
): string {
  const title = 'title' in input ? input.title : null;
  const body = 'body' in input ? input.body : null;
  const bigText = 'bigText' in input ? input.bigText : null;

  return [title, bigText, body]
    .filter((part) => part?.trim())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
