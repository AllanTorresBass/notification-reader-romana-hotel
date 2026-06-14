import { useNotificationAccessQuery } from '@/hooks/use-notification-access';
import { useWhitelistStore } from '@/stores/whitelist-store';

export function useAppGates() {
  const { hasAccess, isLoading: accessLoading, isAndroid } = useNotificationAccessQuery();
  const allowedPackages = useWhitelistStore((s) => s.allowedPackages);
  const hasCompletedOnboarding = useWhitelistStore((s) => s.hasCompletedOnboarding);

  const needsAccess = isAndroid && !hasAccess;
  const needsWhitelist = false;
  const needsOnboarding = !hasCompletedOnboarding || needsAccess;
  const isReady = isAndroid && hasAccess && hasCompletedOnboarding;

  return {
    isAndroid,
    accessLoading,
    hasAccess,
    allowedPackages,
    needsAccess,
    needsWhitelist,
    needsOnboarding,
    isReady,
  };
}
