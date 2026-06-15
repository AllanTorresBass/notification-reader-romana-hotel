import { Tabs } from 'expo-router';
import { Bell, Settings, Smartphone } from 'lucide-react-native';

import { copy } from '@/constants/copy';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function TabLayout() {
  const { colors } = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          minHeight: 56,
          paddingBottom: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: copy.tabs.pagos,
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="apps"
        options={{
          title: copy.tabs.bdv,
          tabBarIcon: ({ color, size }) => <Smartphone color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: copy.tabs.ajustes,
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
