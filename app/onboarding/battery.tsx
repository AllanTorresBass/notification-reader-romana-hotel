import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Battery } from 'lucide-react-native';
import { Platform, StyleSheet } from 'react-native';

import { AppScreen } from '@/components/shared/AppScreen';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Card, CardContent } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { notificationListenerBridge } from '@/lib/services/native/NotificationListenerBridge';
import { ALLOWED_PACKAGES } from '@/constants/whitelist-defaults';

export default function OnboardingBatteryScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();

  const finish = () => {
    notificationListenerBridge.setAllowedPackages([...ALLOWED_PACKAGES]);
    router.push('/onboarding/connect');
  };

  const openBatterySettings = () => {
    if (Platform.OS === 'android') {
      void Linking.openSettings();
    }
  };

  return (
    <AppScreen
      title="Mantener escucha activa"
      subtitle="Algunos dispositivos detienen servicios en segundo plano para ahorrar batería."
    >
      <ThemedText variant="caption" muted>
        {copy.onboarding.step(3, 4)}
      </ThemedText>
      <Card>
        <CardContent style={styles.card}>
          <Battery color={colors.primary} size={40} />
          <ThemedText variant="body" muted style={styles.body}>
            En ajustes de batería, desactiva la optimización para esta app. En Xiaomi/Samsung, busca
            “Inicio automático” o “Sin restricciones”.
          </ThemedText>
        </CardContent>
      </Card>
      <PrimaryButton
        label="Abrir ajustes del dispositivo"
        variant="secondary"
        onPress={openBatterySettings}
      />
      <PrimaryButton label="Continuar" onPress={finish} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.md },
  body: { textAlign: 'center' },
});
