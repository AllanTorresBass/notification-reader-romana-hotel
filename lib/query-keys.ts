import type { NotificationListFilters } from '@/types/notification/notification.types';

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
    list: () => [...queryKeys.paymentRegisters.lists()] as const,
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
} as const;
