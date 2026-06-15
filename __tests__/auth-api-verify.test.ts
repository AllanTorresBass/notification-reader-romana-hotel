import {
  formatAuthApiVerificationReport,
  verifyAuthApi,
} from '@/lib/api-client/auth/verify-auth-api';

describe('verifyAuthApi (mocked)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('passes when login returns 401 JSON and me returns 401', async () => {
    globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/v1/auth/mobile/login') && init?.method === 'POST') {
        return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.endsWith('/api/v1/auth/mobile/me')) {
        return new Response(JSON.stringify({ error: 'No autenticado' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;

    const report = await verifyAuthApi('https://example.test');
    expect(report.ok).toBe(true);
    expect(report.checks).toHaveLength(2);
    expect(report.checks[0]?.name).toBe('mobile_login_route');
    expect(report.checks[1]?.name).toBe('mobile_me_route');
  });

  it('fails when login is redirected to web sign-in', async () => {
    globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/v1/auth/mobile/login')) {
        return new Response('Redirecting...', {
          status: 307,
          headers: { Location: '/sign-in?callbackUrl=%2Fapi%2Fv1%2Fauth%2Fmobile%2Flogin' },
        });
      }
      return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
    }) as typeof fetch;

    const report = await verifyAuthApi('https://example.test');
    expect(report.ok).toBe(false);
    expect(report.checks[0]?.ok).toBe(false);
    expect(report.checks[0]?.detail).toContain('middleware');
  });

  it('fails when fetch throws a network error', async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as typeof fetch;

    const report = await verifyAuthApi('https://offline.test');
    expect(report.ok).toBe(false);
    expect(report.checks[0]?.detail).toContain('Network request failed');
    expect(report.checks[1]?.detail).toContain('Network request failed');
  });

  it('formats a readable report', () => {
    const text = formatAuthApiVerificationReport({
      baseUrl: 'https://la-romana-hotel.vercel.app',
      ok: false,
      checks: [
        {
          name: 'mobile_login_route',
          ok: false,
          status: null,
          detail: 'Network request failed',
        },
      ],
    });

    expect(text).toContain('RESULT: FAILED');
    expect(text).toContain('Network request failed');
  });
});
