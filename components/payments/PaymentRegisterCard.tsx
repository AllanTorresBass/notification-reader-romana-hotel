import { CloudOff } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { FeedbackInline } from '@/components/feedback/FeedbackInline';
import { formatEntitySyncError } from '@/lib/feedback/format-operation-outcome';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { fonts, radius, spacing } from '@/constants/theme';
import { MIN_TOUCH_TARGET } from '@/constants/touch';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { getPaymentActionHint } from '@/lib/utils/filter-payment-registers';
import { formatPagoDisplay, formatSyncStatusLabel } from '@/lib/utils/format-pago';
import { formatPaymentDateTime } from '@/lib/utils/format-payment-datetime';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

interface PaymentRegisterCardProps {
  entry: PaymentRegisterCacheEntry;
  onPress: (entry: PaymentRegisterCacheEntry) => void;
}

function getBadgeVariant(
  syncStatus: string
): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' {
  if (syncStatus === 'sync_failed') return 'destructive';
  if (syncStatus === 'payment_confirmed') return 'success';
  if (syncStatus === 'pending_sync') return 'warning';
  return 'secondary';
}

function getAccentColor(
  syncStatus: string,
  colors: ReturnType<typeof useThemeColors>['colors']
): string {
  if (syncStatus === 'sync_failed') return colors.danger;
  if (syncStatus === 'payment_confirmed') {
    return colors.success;
  }
  if (syncStatus === 'pending_sync') return colors.warning;
  return colors.primary;
}

function getSecondaryLine(entry: PaymentRegisterCacheEntry): string {
  const parts: string[] = [];
  if (entry.ref) parts.push(`Ref ${entry.ref}`);

  const when = formatPaymentDateTime(entry.paymentDate, entry.paymentTime);
  if (when) parts.push(when);

  if (entry.mobile && entry.mobile !== 'sin-leer') {
    parts.push(entry.mobile);
  }

  if (parts.length > 0) return parts.join(' · ');
  return copy.pagos.detail.emitterPhone;
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
          <View style={styles.amountBlock}>
            <ThemedText variant="heading" style={[styles.amount, { fontFamily: fonts.monoMedium }]}>
              Bs. {formatPagoDisplay(entry.pago)}
            </ThemedText>
            {entry.name ? (
              <ThemedText variant="caption" muted numberOfLines={1}>
                {entry.name}
              </ThemedText>
            ) : null}
          </View>
          <View style={styles.topRight}>
            <Badge label={statusLabel} variant={getBadgeVariant(entry.syncStatus)} />
            {showOffline ? <CloudOff color={colors.textMuted} size={16} /> : null}
          </View>
        </View>

        <ThemedText variant="caption" muted numberOfLines={2}>
          {getSecondaryLine(entry)}
        </ThemedText>

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
  card: { padding: spacing.md, gap: spacing.xs, minHeight: MIN_TOUCH_TARGET * 2 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  amountBlock: { flex: 1, gap: 2 },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  amount: { fontSize: 22, flexShrink: 0 },
});
