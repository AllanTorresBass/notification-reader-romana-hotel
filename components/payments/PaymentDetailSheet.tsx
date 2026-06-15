import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { forwardRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { FeedbackInline } from '@/components/feedback/FeedbackInline';
import { OperationFeedbackCard } from '@/components/feedback/OperationFeedbackCard';
import { formatEntitySyncError } from '@/lib/feedback/format-operation-outcome';
import { PaymentStatusStepper } from '@/components/payments/PaymentStatusStepper';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Banner } from '@/components/ui/Banner';
import { Badge } from '@/components/ui/Badge';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { fonts, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { canConfirmPayment } from '@/lib/utils/filter-payment-registers';
import { resolvePaymentAction } from '@/lib/utils/resolve-payment-action';
import {
  formatRelativeTime,
  formatSyncStatusLabel,
  formatPagoDisplay,
} from '@/lib/utils/format-pago';
import { formatPaymentDate, formatPaymentTime } from '@/lib/utils/format-payment-datetime';
import { isPaymentWorkflowComplete } from '@/lib/utils/merge-payment-register-state';
import type { OperationOutcome } from '@/types/feedback/operation-outcome.types';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

export interface PaymentDetailSheetProps {
  entry: PaymentRegisterCacheEntry | null;
  actionFeedback: OperationOutcome | null;
  onConfirmPayment: () => void;
  onCompleteManual?: () => void;
  isConfirming: boolean;
  canWrite?: boolean;
}

export const PaymentDetailSheet = forwardRef<BottomSheet, PaymentDetailSheetProps>(
  function PaymentDetailSheet(
    {
      entry,
      actionFeedback,
      onConfirmPayment,
      onCompleteManual,
      isConfirming,
      canWrite = true,
    },
    ref
  ) {
    const { colors } = useThemeColors();
    const snapPoints = useMemo(() => ['55%', '90%'], []);

    const canConfirm = entry ? canConfirmPayment(entry) : false;
    const paymentAction = entry ? resolvePaymentAction(entry) : null;
    const confirmLabel =
      paymentAction?.kind === 'sync_and_confirm'
        ? copy.pagos.actions.confirm.syncAndConfirmCta
        : copy.pagos.actions.confirm.cta;
    const isConfirmed = entry ? isPaymentWorkflowComplete(entry) : false;

    const missingFields = useMemo(() => {
      if (!entry || isConfirmed) return [];
      const fields: string[] = [];
      if (!entry.ref) fields.push(copy.pagos.detail.reference.toLowerCase());
      if (!entry.paymentDate) fields.push(copy.pagos.detail.date.toLowerCase());
      return fields;
    }, [entry, isConfirmed]);

    const showMissingBanner = missingFields.length > 0 && !canConfirm;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.surfaceElevated }}
        handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          {!entry ? (
            <ThemedText muted>{copy.pagos.detail.selectPayment}</ThemedText>
          ) : (
            <>
              <View style={styles.hero}>
                <View style={styles.heroTop}>
                  <ThemedText variant="heading" style={{ fontFamily: fonts.monoMedium }}>
                    Bs. {formatPagoDisplay(entry.pago)}
                  </ThemedText>
                  <Badge
                    label={formatSyncStatusLabel(entry.syncStatus, entry.invoiceStatus)}
                    variant={
                      entry.syncStatus === 'sync_failed'
                        ? 'destructive'
                        : isConfirmed
                          ? 'success'
                          : entry.syncStatus === 'pending_sync'
                            ? 'warning'
                            : 'secondary'
                    }
                  />
                </View>
                <ThemedText variant="caption" muted>
                  {copy.pagos.detail.ago(formatRelativeTime(entry.createdAt))} ·{' '}
                  {copy.pagos.detail.emitterPhone}: {entry.mobile}
                </ThemedText>
              </View>

              <ThemedText variant="label" muted>
                {copy.pagos.detail.paymentData}
              </ThemedText>
              <View style={styles.grid}>
                <DetailRow
                  label={copy.pagos.detail.reference}
                  value={entry.ref || '—'}
                  missing={!entry.ref && !isConfirmed}
                />
                <DetailRow
                  label={copy.pagos.detail.date}
                  value={formatPaymentDate(entry.paymentDate)}
                  missing={!entry.paymentDate && !isConfirmed}
                />
                <DetailRow label={copy.pagos.detail.time} value={formatPaymentTime(entry.paymentTime)} />
                <DetailRow
                  label={copy.pagos.detail.name}
                  value={entry.name ?? copy.pagos.detail.noName}
                />
              </View>

              <PaymentStatusStepper
                syncStatus={entry.syncStatus}
                invoiceStatus={entry.invoiceStatus}
              />

              {showMissingBanner ? (
                <Banner
                  variant="warning"
                  title={copy.pagos.detail.missingFieldsTitle}
                  message={copy.pagos.detail.missingFieldsMessage(missingFields.join(' y '))}
                  actionLabel={
                    canWrite && onCompleteManual ? copy.pagos.detail.completeManual : undefined
                  }
                  onAction={canWrite ? onCompleteManual : undefined}
                />
              ) : null}

              {actionFeedback ? <OperationFeedbackCard outcome={actionFeedback} /> : null}

              {entry.lastSyncError ? (
                <FeedbackInline
                  outcome={formatEntitySyncError(entry.lastSyncError)}
                  compact
                />
              ) : null}

              <View style={styles.actions}>
                {canWrite && canConfirm ? (
                  <PrimaryButton
                    label={isConfirming ? copy.pagos.actions.confirm.confirming : confirmLabel}
                    onPress={onConfirmPayment}
                    disabled={isConfirming}
                    loading={isConfirming}
                  />
                ) : null}

                {!canWrite && canConfirm ? (
                  <ThemedText variant="caption" muted style={{ textAlign: 'center' }}>
                    {copy.pagos.readOnlyHint}
                  </ThemedText>
                ) : null}
              </View>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

function DetailRow({
  label,
  value,
  missing = false,
}: {
  label: string;
  value: string;
  missing?: boolean;
}) {
  const { colors } = useThemeColors();

  return (
    <View style={styles.row}>
      <ThemedText variant="caption" muted>
        {label}
      </ThemedText>
      <ThemedText
        variant="body"
        style={[styles.rowValue, missing ? { color: colors.warning } : undefined]}
      >
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  hero: { gap: spacing.xs },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  grid: { gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  rowValue: { fontWeight: '600', flex: 1, textAlign: 'right' },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
