import { LA_ROMANA_DEFAULT_API_URL, normalizeApiBaseUrl } from '../constants/api-defaults';
import type { RemotePayment } from '../lib/api-client/payments/PaymentApiService';

const baseUrl = normalizeApiBaseUrl(process.argv[2]?.trim() || LA_ROMANA_DEFAULT_API_URL);
const email = process.argv[3]?.trim();
const password = process.argv[4]?.trim();

async function request<T>(
  path: string,
  options: { method?: string; body?: string; token?: string } = {}
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      typeof data?.message === 'string'
        ? data.message
        : typeof data?.error === 'string'
          ? data.error
          : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

function formatPayment(payment: RemotePayment): string {
  return [
    `#${payment.id}`,
    payment.status,
    `Bs ${payment.amount}`,
    payment.payerName ?? '—',
    payment.payerPhone ?? '—',
    `ref ${payment.reference}`,
    `${payment.paymentDate} ${payment.paymentTime}`,
    payment.source,
  ].join(' | ');
}

async function main() {
  if (!email || !password) {
    console.error('Usage: npx tsx scripts/list-payments.ts [baseUrl] <email> <password>');
    process.exit(1);
  }

  const login = await request<{ accessToken: string }>('/api/v1/auth/mobile/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const token = login.accessToken;
  const payments = await request<RemotePayment[]>('/api/v1/payments', { token });
  const active = payments.filter((payment) => !payment.deletedAt);

  console.log(`Base URL: ${baseUrl}`);
  console.log(`Total payments in database: ${active.length}`);
  console.log('');

  for (const payment of active) {
    console.log(formatPayment(payment));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
