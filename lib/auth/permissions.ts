import type { Permission, UserRole } from '@/types/auth.types';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { resource: 'payment', action: 'read' },
    { resource: 'payment', action: 'create' },
    { resource: 'payment', action: 'update' },
    { resource: 'payment', action: 'delete' },
    { resource: 'dashboard', action: 'read' },
    { resource: 'users', action: 'manage' },
  ],
  analyst: [
    { resource: 'payment', action: 'read' },
    { resource: 'dashboard', action: 'read' },
  ],
  salesperson: [
    { resource: 'payment', action: 'read' },
    { resource: 'payment', action: 'create' },
    { resource: 'payment', action: 'update' },
    { resource: 'payment', action: 'delete' },
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].some(
    (entry) => entry.resource === permission.resource && entry.action === permission.action,
  );
}

export function canWritePayments(role: UserRole): boolean {
  return (
    hasPermission(role, { resource: 'payment', action: 'create' }) ||
    hasPermission(role, { resource: 'payment', action: 'update' })
  );
}

export function canManageInvoices(role: UserRole): boolean {
  return hasPermission(role, { resource: 'payment', action: 'create' });
}

export function canAccessNewInvoiceScreen(role: UserRole, isAuthenticated: boolean): boolean {
  return isAuthenticated && canManageInvoices(role);
}

export function shouldShowManualRegisterButton(role: UserRole): boolean {
  return canWritePayments(role);
}
