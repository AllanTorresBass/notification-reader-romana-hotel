import { canAccessNewInvoiceScreen } from '@/lib/auth/permissions';
import type { UserRole } from '@/types/auth.types';

export const INVOICE_ACCESS_DENIED_PARAM = 'accessDenied';
export const INVOICE_ACCESS_DENIED_CREATE = 'create';

export function shouldRedirectFromInvoiceCreate(
  role: UserRole,
  isAuthenticated: boolean,
): boolean {
  return !canAccessNewInvoiceScreen(role, isAuthenticated);
}

export function invoiceCreateDeniedHref(): `/(tabs)/invoices?${string}` {
  return `/(tabs)/invoices?${INVOICE_ACCESS_DENIED_PARAM}=${INVOICE_ACCESS_DENIED_CREATE}`;
}
