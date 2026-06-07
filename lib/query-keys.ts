import type { NotificationListFilters } from '@/types/notification/notification.types';
import type { PaymentRegisterListFilters } from '@/types/payment/payment-register-cache.types';

export const queryKeys = {
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters: NotificationListFilters) =>
      [...queryKeys.notifications.lists(), filters] as const,
    details: () => [...queryKeys.notifications.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.notifications.details(), id] as const,
  },
  access: {
    all: ['notification-access'] as const,
  },
  installedApps: {
    all: ['installed-apps'] as const,
  },
  paymentRegisters: {
    all: ['payment-registers'] as const,
    lists: () => [...queryKeys.paymentRegisters.all, 'list'] as const,
    list: (filters: PaymentRegisterListFilters = {}) =>
      [...queryKeys.paymentRegisters.lists(), filters] as const,
    filterCounts: () => [...queryKeys.paymentRegisters.all, 'filter-counts'] as const,
    detail: (localId: string) =>
      [...queryKeys.paymentRegisters.all, 'detail', localId] as const,
  },
  clients: {
    all: ['clients'] as const,
    search: (term: string) => [...queryKeys.clients.all, 'search', term] as const,
  },
  apiAuth: {
    all: ['api-auth'] as const,
  },
  activityLogs: {
    all: ['activity-logs'] as const,
    list: () => [...queryKeys.activityLogs.all, 'list'] as const,
  },
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (params: Record<string, unknown> = {}) =>
      [...queryKeys.invoices.lists(), params] as const,
    detail: (id: string) => [...queryKeys.invoices.all, 'detail', id] as const,
  },
  services: {
    all: ['services'] as const,
    active: () => [...queryKeys.services.all, 'active'] as const,
  },
} as const;
