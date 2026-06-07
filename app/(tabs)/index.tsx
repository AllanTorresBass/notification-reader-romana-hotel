import { Redirect, useRootNavigationState } from 'expo-router';

export default function TabsIndex() {
  const navigationState = useRootNavigationState();

  if (!navigationState?.key) {
    return null;
  }

  return <Redirect href="/(tabs)/feed" />;
}
