import { CloudOff } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { FeedbackInline } from '@/components/feedback/FeedbackInline';
import { formatEntitySyncError } from '@/lib/feedback/format-operation-outcome';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { fonts, radius, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { getPaymentActionHint } from '@/lib/utils/filter-payment-registers';
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

function getAccentColor(
  syncStatus: string,
  colors: ReturnType<typeof useThemeColors>['colors']
): string {
  if (syncStatus === 'sync_failed') return colors.danger;
  if (syncStatus === 'payment_confirmed' || syncStatus === 'client_assigned') {
    return colors.success;
  }
  if (syncStatus === 'pending_sync') return colors.warning;
  return colors.primary;
}

function getSecondaryLine(entry: PaymentRegisterCacheEntry): string {
  if (entry.ref && entry.paymentDate) {
    return `Ref ${entry.ref} · ${entry.paymentDate}`;
  }
  if (entry.ref) return `Ref ${entry.ref}`;
  return `${copy.pagos.detail.emitterPhone}: ${entry.mobile}`;
}

export function PaymentRegisterCard({ entry, onPress }: PaymentRegisterCardProps) {
  const { colors } = useThemeColors();
  const showOffline =
    entry.syncStatus === 'pending_sync' || entry.syncStatus === 'sync_failed';
  const statusLabel = formatSyncStatusLabel(entry.syncStatus, entry.invoiceStatus);
  const actionHint = getPaymentActionHint(entry);
  const accentColor = getAccentColor(entry.syncStatus, colors);
  const isActionable = actionHint?.endsWith('→') ?? false;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Pago ${entry.pago}, ${statusLabel}${actionHint ? `, ${actionHint}` : ''}`}
      onPress={() => onPress(entry)}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
    >
      <Card style={StyleSheet.flatten([styles.card, { borderLeftWidth: 3, borderLeftColor: accentColor, borderTopLeftRadius: radius.lg, borderBottomLeftRadius: radius.lg }])}>
        <View style={styles.topRow}>
          <ThemedText variant="heading" style={[styles.amount, { fontFamily: fonts.monoMedium }]}>
            Bs. {formatPagoDisplay(entry.pago)}
          </ThemedText>
          <View style={styles.topRight}>
            <Badge label={statusLabel} variant={getBadgeVariant(entry.syncStatus)} />
            {showOffline ? <CloudOff color={colors.textMuted} size={16} /> : null}
          </View>
        </View>

        <ThemedText variant="caption" muted numberOfLines={1}>
          {getSecondaryLine(entry)}
        </ThemedText>

        {entry.assignedClientName ? (
          <ThemedText variant="caption" style={{ color: colors.success }} numberOfLines={1}>
            {entry.assignedClientName}
          </ThemedText>
        ) : entry.name ? (
          <Badge label={entry.name} variant="secondary" />
        ) : null}

        {actionHint ? (
          <ThemedText
            variant="caption"
            style={{ color: isActionable ? colors.primary : colors.textMuted, fontWeight: isActionable ? '600' : '400' }}
          >
            {actionHint}
          </ThemedText>
        ) : null}

        {entry.syncStatus === 'sync_failed' && entry.lastSyncError ? (
          <FeedbackInline
            outcome={formatEntitySyncError(entry.lastSyncError)}
            compact
          />
        ) : null}
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
    gap: spacing.sm,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  amount: { fontSize: 22, flexShrink: 0 },
});
