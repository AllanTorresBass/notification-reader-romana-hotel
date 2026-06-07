import { CloudOff } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { PaymentStatusStepper } from '@/components/payments/PaymentStatusStepper';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { fonts, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { formatPagoDisplay, formatSyncStatusLabel } from '@/lib/utils/format-pago';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

interface PaymentRegisterCardProps {
  entry: PaymentRegisterCacheEntry;
  onPress: (entry: PaymentRegisterCacheEntry) => void;
}

function getBadgeVariant(
  syncStatus: string
): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' {
  if (syncStatus === 'sync_failed') return 'destructive';
  if (syncStatus === 'payment_confirmed' || syncStatus === 'client_assigned') return 'success';
  if (syncStatus === 'pending_sync') return 'warning';
  return 'secondary';
}

export function PaymentRegisterCard({ entry, onPress }: PaymentRegisterCardProps) {
  const { colors } = useThemeColors();
  const showOffline =
    entry.syncStatus === 'pending_sync' || entry.syncStatus === 'sync_failed';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Pago ${entry.pago} del emisor ${entry.mobile}`}
      onPress={() => onPress(entry)}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
    >
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <ThemedText variant="heading" style={[styles.amount, { fontFamily: fonts.monoMedium }]}>
            Bs. {formatPagoDisplay(entry.pago)}
          </ThemedText>
          {showOffline ? <CloudOff color={colors.textMuted} size={18} /> : null}
        </View>

        <ThemedText variant="caption" muted>
          Tel. emisor (no cliente): {entry.mobile}
        </ThemedText>

        <Badge label={entry.name ?? 'Sin nombre'} variant="secondary" />

        <Badge
          label={formatSyncStatusLabel(entry.syncStatus, entry.invoiceStatus)}
          variant={getBadgeVariant(entry.syncStatus)}
        />

        <PaymentStatusStepper
          syncStatus={entry.syncStatus}
          invoiceStatus={entry.invoiceStatus}
        />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.xs },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: { fontSize: 24 },
});
