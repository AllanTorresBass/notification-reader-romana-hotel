import { canAccessNewInvoiceScreen, shouldShowManualRegisterButton } from '@/lib/auth/permissions';
import type { UserRole } from '@/types/auth.types';

function pagosUiGating(role: UserRole, isAuthenticated = true) {
  return {
    role,
    isAuthenticated,
    showManualRegister: shouldShowManualRegisterButton(role),
    canCreateInvoice: canAccessNewInvoiceScreen(role, isAuthenticated),
  };
}

describe('Pagos UI gating snapshots', () => {
  it('analyst — read-only mobile surface', () => {
    expect(pagosUiGating('analyst')).toMatchSnapshot();
  });

  it('salesperson — field write surface', () => {
    expect(pagosUiGating('salesperson')).toMatchSnapshot();
  });

  it('admin — full write surface', () => {
    expect(pagosUiGating('admin')).toMatchSnapshot();
  });

  it('unauthenticated — no write actions', () => {
    expect(pagosUiGating('admin', false)).toMatchSnapshot();
  });
});
