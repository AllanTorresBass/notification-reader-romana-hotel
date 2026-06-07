import { selectAuthStatus, selectIsAuthenticated } from '@/lib/auth/auth-selectors';

describe('auth selectors', () => {
  it('returns disconnected when token is missing', () => {
    expect(selectIsAuthenticated({ accessToken: null, expiresAt: null } as never)).toBe(false);
    expect(selectAuthStatus({ accessToken: null, expiresAt: null } as never)).toBe('disconnected');
  });

  it('returns connected for a valid future expiry', () => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    const state = { accessToken: 'token', expiresAt } as never;
    expect(selectIsAuthenticated(state)).toBe(true);
    expect(selectAuthStatus(state)).toBe('connected');
  });

  it('returns expired for past expiry', () => {
    const expiresAt = new Date(Date.now() - 60_000).toISOString();
    const state = { accessToken: 'token', expiresAt } as never;
    expect(selectIsAuthenticated(state)).toBe(false);
    expect(selectAuthStatus(state)).toBe('expired');
  });
});
