export const USER_ROLES = ['admin', 'analyst', 'salesperson'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type PaymentAction = 'read' | 'create' | 'update' | 'delete';
export type DashboardAction = 'read';
export type UsersAction = 'manage';

export type Permission =
  | { resource: 'payment'; action: PaymentAction }
  | { resource: 'dashboard'; action: DashboardAction }
  | { resource: 'users'; action: UsersAction };

export function isUserRole(value: string | null | undefined): value is UserRole {
  return !!value && (USER_ROLES as readonly string[]).includes(value);
}

export function parseUserRole(value: string | null | undefined, fallback: UserRole = 'salesperson'): UserRole {
  return isUserRole(value) ? value : fallback;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  analyst: 'Analista',
  salesperson: 'Vendedor',
};
