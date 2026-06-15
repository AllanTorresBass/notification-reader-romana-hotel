import { LA_ROMANA_DEFAULT_API_URL } from '@/constants/api-defaults';

export interface AuthApiCheckResult {
  name: string;
  ok: boolean;
  status: number | null;
  detail: string;
}

export interface AuthApiVerificationReport {
  baseUrl: string;
  ok: boolean;
  checks: AuthApiCheckResult[];
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function readResponseBody(response: Response): Promise<{ json: unknown | null; text: string }> {
  const text = await response.text();
  if (!text) return { json: null, text: '' };
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

export async function verifyAuthApi(baseUrl = LA_ROMANA_DEFAULT_API_URL): Promise<AuthApiVerificationReport> {
  const normalizedBase = baseUrl.trim().replace(/\/$/, '');
  const checks: AuthApiCheckResult[] = [];

  const loginUrl = joinUrl(normalizedBase, '/api/v1/auth/mobile/login');
  const meUrl = joinUrl(normalizedBase, '/api/v1/auth/mobile/me');

  try {
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email: 'verify@notification-reader.local', password: '__verify__' }),
      redirect: 'manual',
    });

    const loginBody = await readResponseBody(loginRes);
    const loginError =
      loginBody.json &&
      typeof loginBody.json === 'object' &&
      'error' in loginBody.json
        ? String((loginBody.json as { error: string }).error)
        : null;

    if (loginRes.status >= 300 && loginRes.status < 400) {
      checks.push({
        name: 'mobile_login_route',
        ok: false,
        status: loginRes.status,
        detail: `Redirected to ${loginRes.headers.get('location') ?? 'unknown'} — middleware is blocking the mobile login API.`,
      });
    } else if (loginRes.status === 401 && loginError) {
      checks.push({
        name: 'mobile_login_route',
        ok: true,
        status: loginRes.status,
        detail: `API reachable; invalid credentials rejected (${loginError}).`,
      });
    } else if (loginRes.status === 401) {
      checks.push({
        name: 'mobile_login_route',
        ok: true,
        status: loginRes.status,
        detail: 'API reachable; login endpoint returned 401 as expected.',
      });
    } else {
      checks.push({
        name: 'mobile_login_route',
        ok: false,
        status: loginRes.status,
        detail: loginError ?? (loginBody.text.slice(0, 120) || `Unexpected status ${loginRes.status}`),
      });
    }
  } catch (error) {
    checks.push({
      name: 'mobile_login_route',
      ok: false,
      status: null,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const meRes = await fetch(meUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      redirect: 'manual',
    });

    const meBody = await readResponseBody(meRes);
    const meError =
      meBody.json &&
      typeof meBody.json === 'object' &&
      'error' in meBody.json
        ? String((meBody.json as { error: string }).error)
        : null;

    if (meRes.status >= 300 && meRes.status < 400) {
      checks.push({
        name: 'mobile_me_route',
        ok: false,
        status: meRes.status,
        detail: `Redirected to ${meRes.headers.get('location') ?? 'unknown'} — token route is not public.`,
      });
    } else if (meRes.status === 401) {
      checks.push({
        name: 'mobile_me_route',
        ok: true,
        status: meRes.status,
        detail: meError ?? 'Protected route returns 401 without token (expected).',
      });
    } else {
      checks.push({
        name: 'mobile_me_route',
        ok: false,
        status: meRes.status,
        detail: meError ?? (meBody.text.slice(0, 120) || `Unexpected status ${meRes.status}`),
      });
    }
  } catch (error) {
    checks.push({
      name: 'mobile_me_route',
      ok: false,
      status: null,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  const protectedRoutes = ['/api/v1/payments'];

  for (const path of protectedRoutes) {
    const routeName = path.split('?')[0]?.replace('/api/v1/', '') ?? path;
    try {
      const res = await fetch(joinUrl(normalizedBase, path), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        redirect: 'manual',
      });
      const body = await readResponseBody(res);
      const apiError =
        body.json && typeof body.json === 'object' && 'error' in body.json
          ? String((body.json as { error: string }).error)
          : null;

      checks.push({
        name: routeName,
        ok: res.status === 401,
        status: res.status,
        detail:
          res.status === 401
            ? apiError ?? 'Protected route returns 401 without token (expected).'
            : apiError ?? (body.text.slice(0, 120) || `Unexpected status ${res.status}`),
      });
    } catch (error) {
      checks.push({
        name: routeName,
        ok: false,
        status: null,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    baseUrl: normalizedBase,
    ok: checks.every((check) => check.ok),
    checks,
  };
}

export function formatAuthApiVerificationReport(report: AuthApiVerificationReport): string {
  const lines = [
    `La Romana auth API verification — ${report.baseUrl}`,
    report.ok ? 'RESULT: OK' : 'RESULT: FAILED',
    '',
    ...report.checks.map(
      (check) =>
        `[${check.ok ? 'PASS' : 'FAIL'}] ${check.name} (HTTP ${check.status ?? 'n/a'})\n  ${check.detail}`
    ),
  ];
  return lines.join('\n');
}
