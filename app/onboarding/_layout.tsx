import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="access" />
      <Stack.Screen name="apps" />
      <Stack.Screen name="battery" />
      <Stack.Screen name="connect" />
    </Stack>
  );
}
