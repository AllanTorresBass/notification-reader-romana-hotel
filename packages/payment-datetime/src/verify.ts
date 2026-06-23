import {
  normalizePaymentDate,
  normalizePaymentTime,
  normalizePaymentTimeFromDb,
  toCalendarDateKey,
} from './core';
import { formatPaymentDateTime } from './format';

export interface PaymentDatePipelineStage {
  stage: string;
  paymentDate: string;
  paymentTime: string;
  ok: boolean;
  detail: string;
}

export interface PaymentDateVerificationResult {
  reference: string;
  expectedDate: string;
  expectedTime: string;
  stages: PaymentDatePipelineStage[];
  ok: boolean;
}

export function verifyPaymentDatePipeline(input: {
  reference: string;
  dbPaymentDate: string;
  dbPaymentTime: string;
  apiPaymentDate?: string;
  apiPaymentTime?: string;
  cachedPaymentDate?: string;
  cachedPaymentTime?: string;
}): PaymentDateVerificationResult {
  const stages: PaymentDatePipelineStage[] = [];
  const pgDateAsJs = new Date(`${input.dbPaymentDate}T00:00:00.000Z`);

  const mapRowDate = toCalendarDateKey(pgDateAsJs) ?? '';
  const mapRowTime = normalizePaymentTimeFromDb(input.dbPaymentTime);
  stages.push({
    stage: 'server_mapRow',
    paymentDate: mapRowDate,
    paymentTime: mapRowTime,
    ok: mapRowDate === input.dbPaymentDate,
    detail:
      mapRowDate === input.dbPaymentDate
        ? 'pg date preserved through mapRow'
        : `shifted ${input.dbPaymentDate} → ${mapRowDate}`,
  });

  const apiDate = input.apiPaymentDate ?? mapRowDate;
  const apiTime = input.apiPaymentTime ?? mapRowTime;
  stages.push({
    stage: 'api_json',
    paymentDate: apiDate,
    paymentTime: apiTime,
    ok: apiDate === input.dbPaymentDate && apiTime.startsWith(input.dbPaymentTime.slice(0, 5)),
    detail: 'API response contract',
  });

  const pullDate = normalizePaymentDate(apiDate);
  const pullTime = normalizePaymentTime(apiTime);
  stages.push({
    stage: 'mobile_pull',
    paymentDate: pullDate,
    paymentTime: pullTime,
    ok: pullDate === input.dbPaymentDate,
    detail: 'pullRemote normalization',
  });

  const cacheDate = normalizePaymentDate(input.cachedPaymentDate ?? pullDate);
  const cacheTime = normalizePaymentTime(input.cachedPaymentTime ?? pullTime);
  stages.push({
    stage: 'mobile_cache',
    paymentDate: cacheDate,
    paymentTime: cacheTime,
    ok: cacheDate === input.dbPaymentDate,
    detail: 'secure storage value',
  });

  const display = formatPaymentDateTime(cacheDate, cacheTime) ?? '';
  stages.push({
    stage: 'card_display',
    paymentDate: cacheDate,
    paymentTime: cacheTime,
    ok: display.includes(input.dbPaymentDate.slice(8, 10)),
    detail: display || 'empty display',
  });

  return {
    reference: input.reference,
    expectedDate: input.dbPaymentDate,
    expectedTime: input.dbPaymentTime,
    stages,
    ok: stages.every((s) => s.ok),
  };
}

export function formatPaymentDateVerificationReport(result: PaymentDateVerificationResult): string {
  const lines = [
    `Payment date verification — ref ${result.reference}`,
    `Expected: ${result.expectedDate} ${result.expectedTime}`,
    `Overall: ${result.ok ? 'PASS' : 'FAIL'}`,
    '',
  ];

  for (const stage of result.stages) {
    lines.push(
      `[${stage.ok ? 'OK' : 'FAIL'}] ${stage.stage}: ${stage.paymentDate} ${stage.paymentTime} — ${stage.detail}`
    );
  }

  return lines.join('\n');
}
