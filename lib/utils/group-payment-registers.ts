import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

export interface PaymentTimelineSection {
  title: string;
  data: PaymentRegisterCacheEntry[];
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getSectionLabel(postTime: number, now: number): string {
  const todayStart = startOfDay(now);
  const yesterdayStart = todayStart - 86_400_000;
  const dayStart = startOfDay(postTime);

  if (dayStart === todayStart) {
    return 'Hoy';
  }
  if (dayStart === yesterdayStart) {
    return 'Ayer';
  }
  return new Date(postTime).toLocaleDateString('es-VE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function groupPaymentRegistersByDate(
  entries: PaymentRegisterCacheEntry[]
): PaymentTimelineSection[] {
  const now = Date.now();
  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt);
  const sections: PaymentTimelineSection[] = [];

  for (const entry of sorted) {
    const label = getSectionLabel(entry.createdAt, now);
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
