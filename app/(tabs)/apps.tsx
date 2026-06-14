import { AppScreen } from '@/components/shared/AppScreen';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import {
  BANCO_DE_VENEZUELA_LABEL,
  BANCO_DE_VENEZUELA_PACKAGE,
} from '@/constants/whitelist-defaults';
import { fonts } from '@/constants/theme';
import { useNotificationAccessQuery } from '@/hooks/use-notification-access';

export default function AppsTabScreen() {
  const { hasAccess } = useNotificationAccessQuery();

  return (
    <AppScreen
      title="Banco de Venezuela"
      subtitle="Esta app solo captura notificaciones de la app móvil BDV."
      brandLogo
    >
      <Card>
        <CardHeader
          title={BANCO_DE_VENEZUELA_LABEL}
          description="PagomóvilBDV y otras alertas BDV aparecen en la pestaña Pagos."
        />
        <CardContent>
          <ThemedText variant="mono" muted style={{ fontFamily: fonts.mono }}>
            {BANCO_DE_VENEZUELA_PACKAGE}
          </ThemedText>
          <ThemedText variant="body" muted>
            Las notificaciones de otras apps se ignoran automáticamente.
          </ThemedText>
          <Badge
            label={hasAccess ? 'Acceso activo' : 'Acceso inactivo'}
            variant={hasAccess ? 'success' : 'warning'}
          />
        </CardContent>
      </Card>
    </AppScreen>
  );
}
