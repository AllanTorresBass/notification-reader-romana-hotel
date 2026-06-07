import { useRouter } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/shared/AppScreen';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Card, CardContent } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { useNotificationAccessQuery } from '@/hooks/use-notification-access';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function OnboardingAccessScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { hasAccess, openSettings, refetch } = useNotificationAccessQuery();

  return (
    <AppScreen
      title="Acceso a notificaciones"
      subtitle="Necesario para leer alertas de Banco de Venezuela."
    >
      <ThemedText variant="caption" muted>
        {copy.onboarding.step(2, 4)}
      </ThemedText>
      <Card>
        <CardContent style={styles.card}>
          <Shield color={colors.primary} size={40} />
          <ThemedText variant="body" muted style={styles.body}>
            Abre Ajustes de Android y activa el acceso a notificaciones para KD-Gym Pagos. Vuelve
            aquí y pulsa Continuar.
          </ThemedText>
        </CardContent>
      </Card>
      <PrimaryButton label="Abrir ajustes" onPress={openSettings} />
      <PrimaryButton
        label="Ya activé el acceso"
        variant="secondary"
        onPress={async () => {
          await refetch();
        }}
      />
      <PrimaryButton
        label="Continuar"
        onPress={() => router.push('/onboarding/battery')}
        disabled={!hasAccess}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.md },
  body: { textAlign: 'center' },
});
