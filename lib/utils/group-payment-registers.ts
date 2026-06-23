import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';
import {
  formatPaymentDate,
  getCaracasTodayKey,
  getCaracasYesterdayKey,
  getEntrySortTimestamp,
  parsePaymentCalendarDate,
  toCalendarDateKey,
} from '@/lib/utils/format-payment-datetime';

export interface PaymentTimelineSection {
  title: string;
  data: PaymentRegisterCacheEntry[];
}

function getSectionLabel(timestamp: number, now: number): string {
  const dateKey = toCalendarDateKey(new Date(timestamp));
  if (!dateKey) {
    return new Date(timestamp).toLocaleDateString('es-VE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  if (dateKey === getCaracasTodayKey(now)) {
    return 'Hoy';
  }
  if (dateKey === getCaracasYesterdayKey(now)) {
    return 'Ayer';
  }
  return formatPaymentDate(dateKey);
}

function getSectionTitle(entry: PaymentRegisterCacheEntry, now: number): string {
  const paymentKey = parsePaymentCalendarDate(entry.paymentDate);
  if (paymentKey && entry.paymentDate.trim()) {
    if (paymentKey === getCaracasTodayKey(now)) {
      return 'Hoy';
    }
    if (paymentKey === getCaracasYesterdayKey(now)) {
      return 'Ayer';
    }
    return formatPaymentDate(entry.paymentDate);
  }

  return getSectionLabel(entry.createdAt, now);
}

export function groupPaymentRegistersByDate(
  entries: PaymentRegisterCacheEntry[]
): PaymentTimelineSection[] {
  const now = Date.now();
  const sorted = [...entries].sort(
    (a, b) => getEntrySortTimestamp(b) - getEntrySortTimestamp(a)
  );
  const sections: PaymentTimelineSection[] = [];

  for (const entry of sorted) {
    const label = getSectionTitle(entry, now);
    const last = sections[sections.length - 1];
    if (last?.title === label) {
      last.data.push(entry);
    } else {
      sections.push({ title: label, data: [entry] });
    }
  }

  return sections;
}

export type PaymentListRow =
  | { type: 'header'; title: string; key: string }
  | { type: 'entry'; entry: PaymentRegisterCacheEntry; key: string };

export function flattenPaymentSections(sections: PaymentTimelineSection[]): PaymentListRow[] {
  const rows: PaymentListRow[] = [];
  for (const section of sections) {
    rows.push({ type: 'header', title: section.title, key: `header-${section.title}` });
    for (const entry of section.data) {
      rows.push({ type: 'entry', entry, key: entry.localId });
    }
  }
  return rows;
}
