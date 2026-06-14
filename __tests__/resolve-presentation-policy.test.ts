import { resolvePresentationPolicy } from '@/lib/feedback/resolve-presentation-policy';

describe('resolvePresentationPolicy', () => {
  it('suppresses toast for passive list fetch', () => {
    const policy = resolvePresentationPolicy({ kind: 'list_fetch', context: { anchor: 'list' } });
    expect(policy.toast).toBe(false);
    expect(policy.log).toBe(true);
    expect(policy.surfaces).toContain('empty');
  });

  it('shows toast for user-initiated list fetch', () => {
    const policy = resolvePresentationPolicy({
      kind: 'pull_sync',
      context: { anchor: 'list', isUserInitiated: true },
    });
    expect(policy.toast).toBe(true);
    expect(policy.surfaces).toContain('banner');
  });

  it('uses inline feedback for confirm payment in detail sheet', () => {
    const policy = resolvePresentationPolicy({
      kind: 'confirm_payment',
      context: { anchor: 'detail-sheet' },
    });
    expect(policy.toast).toBe(false);
    expect(policy.haptic).toBe(true);
    expect(policy.surfaces).toContain('inline');
  });

  it('uses inline feedback for login form errors', () => {
    const policy = resolvePresentationPolicy({
      kind: 'login',
      context: { anchor: 'form' },
    });
    expect(policy.toast).toBe(false);
    expect(policy.surfaces).toContain('inline');
  });

  it('logs shade sync without toast when not user initiated', () => {
    const policy = resolvePresentationPolicy({
      kind: 'shade_sync',
      context: { anchor: 'background' },
    });
    expect(policy.toast).toBe(false);
    expect(policy.surfaces).toEqual(['log']);
  });

  it('shows banner surface for assign client from detail sheet', () => {
    const policy = resolvePresentationPolicy({
      kind: 'assign_client',
      context: { anchor: 'detail-sheet' },
    });
    expect(policy.toast).toBe(false);
    expect(policy.surfaces).toContain('banner');
    expect(policy.surfaces).toContain('inline');
  });
});
