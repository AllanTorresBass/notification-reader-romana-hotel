import {
  invoiceCreateDeniedHref,
  shouldRedirectFromInvoiceCreate,
} from '@/lib/auth/invoice-route-guard';

describe('invoice-route-guard', () => {
  it('redirects analysts and unauthenticated users from /invoices/new', () => {
    expect(shouldRedirectFromInvoiceCreate('analyst', true)).toBe(true);
    expect(shouldRedirectFromInvoiceCreate('admin', false)).toBe(true);
  });

  it('allows admin and salesperson when authenticated', () => {
    expect(shouldRedirectFromInvoiceCreate('admin', true)).toBe(false);
    expect(shouldRedirectFromInvoiceCreate('salesperson', true)).toBe(false);
  });

  it('builds invoices tab href with accessDenied flag', () => {
    expect(invoiceCreateDeniedHref()).toBe('/(tabs)/invoices?accessDenied=create');
  });
});
