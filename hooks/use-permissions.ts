import { useApiUser } from '@/hooks/use-api-auth';
import { canWritePayments, hasPermission } from '@/lib/auth/permissions';
import type { Permission } from '@/types/auth.types';
import { parseUserRole } from '@/types/auth.types';

export function usePermissions() {
  const user = useApiUser();
  const role = parseUserRole(user?.role);

  return {
    role,
    user,
    can: (permission: Permission) => hasPermission(role, permission),
    canWritePayments: canWritePayments(role),
    isAuthenticated: !!user,
  };
}
