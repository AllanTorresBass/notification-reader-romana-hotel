import { canWritePayments, hasPermission, shouldShowManualRegisterButton } from '@/lib/auth/permissions';

describe('permissions', () => {
  it('grants admin full payment and team access', () => {
    expect(hasPermission('admin', { resource: 'payment', action: 'delete' })).toBe(true);
    expect(hasPermission('admin', { resource: 'users', action: 'manage' })).toBe(true);
    expect(canWritePayments('admin')).toBe(true);
  });

  it('restricts analyst to read-only payment and dashboard', () => {
    expect(hasPermission('analyst', { resource: 'payment', action: 'read' })).toBe(true);
    expect(hasPermission('analyst', { resource: 'payment', action: 'create' })).toBe(false);
    expect(hasPermission('analyst', { resource: 'dashboard', action: 'read' })).toBe(true);
    expect(canWritePayments('analyst')).toBe(false);
  });

  it('allows salesperson payment CRUD without team or dashboard', () => {
    expect(hasPermission('salesperson', { resource: 'payment', action: 'update' })).toBe(true);
    expect(hasPermission('salesperson', { resource: 'dashboard', action: 'read' })).toBe(false);
    expect(hasPermission('salesperson', { resource: 'users', action: 'manage' })).toBe(false);
    expect(canWritePayments('salesperson')).toBe(true);
  });
});

describe('UI gating helpers', () => {
  it('hides manual register for analyst', () => {
    expect(shouldShowManualRegisterButton('analyst')).toBe(false);
  });

  it('shows write actions for admin and salesperson', () => {
    expect(shouldShowManualRegisterButton('admin')).toBe(true);
    expect(shouldShowManualRegisterButton('salesperson')).toBe(true);
  });
});
