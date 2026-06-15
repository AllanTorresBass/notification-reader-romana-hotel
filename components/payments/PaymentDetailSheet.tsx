import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
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
import { canAssignClientToPayment } from '@/lib/utils/merge-payment-register-state';
import type { OperationOutcome } from '@/types/feedback/operation-outcome.types';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

interface PaymentDetailSheetProps {
  entry: PaymentRegisterCacheEntry | null;
  actionFeedback: OperationOutcome | null;
  onConfirmPayment: () => void;
  onAssignClient: () => void;
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
      onAssignClient,
      onCompleteManual,
      isConfirming,
      canWrite = true,
    },
    ref
  ) {
    const router = useRouter();
    const { colors } = useThemeColors();
    const snapPoints = useMemo(() => ['55%', '90%'], []);

    const canConfirm = entry ? canConfirmPayment(entry) : false;
    const canAssign = entry ? canAssignClientToPayment(entry) : false;
    const paymentAction = entry ? resolvePaymentAction(entry) : null;
    const confirmLabel =
      paymentAction?.kind === 'sync_and_confirm'
        ? copy.pagos.actions.confirm.syncAndConfirmCta
        : copy.pagos.actions.confirm.cta;
    const isConfirmed =
      entry?.syncStatus === 'payment_confirmed' || entry?.syncStatus === 'client_assigned';

    const missingFields = useMemo(() => {
      if (!entry || isConfirmed) return [];
      const fields: string[] = [];
      if (!entry.ref) fields.push(copy.pagos.detail.reference.toLowerCase());
      if (!entry.paymentDate) fields.push(copy.pagos.detail.date.toLowerCase());
      return fields;
    }, [entry, isConfirmed]);

    const showMissingBanner = missingFields.length > 0 && !canConfirm;

    const showNextStep =
      actionFeedback?.status === 'completed' &&
      actionFeedback.kind === 'confirm_payment' &&
      canAssign;

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
                        : entry.syncStatus === 'payment_confirmed' ||
                            entry.syncStatus === 'client_assigned'
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
                  value={entry.paymentDate || '—'}
                  missing={!entry.paymentDate && !isConfirmed}
                />
                <DetailRow label={copy.pagos.detail.time} value={entry.paymentTime || '—'} />
                <DetailRow
                  label={copy.pagos.detail.name}
                  value={entry.name ?? copy.pagos.detail.noName}
                />
              </View>

              {entry.assignedClientName ? (
                <>
                  <ThemedText variant="label" muted>
                    {copy.pagos.detail.clientData}
                  </ThemedText>
                  <DetailRow
                    label={copy.pagos.detail.assignedClient}
                    value={entry.assignedClientName}
                  />
                </>
              ) : null}

              <PaymentStatusStepper
                syncStatus={entry.syncStatus}
                invoiceStatus={entry.invoiceStatus}
              />

              {entry.remoteInvoiceId ? (
                <PrimaryButton
                  label={copy.facturas.detail.viewInvoice}
                  variant="secondary"
                  onPress={() => router.push(`/invoices/${entry.remoteInvoiceId}`)}
                />
              ) : null}

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

              {showNextStep ? (
                <ThemedText variant="caption" style={{ color: colors.success }}>
                  {copy.pagos.actions.confirm.nextStep}
                </ThemedText>
              ) : null}

              <View style={styles.actions}>
                {canWrite && canConfirm ? (
                  <PrimaryButton
                    label={
                      isConfirming
                        ? copy.pagos.actions.confirm.confirming
                        : confirmLabel
                    }
                    onPress={onConfirmPayment}
                    disabled={isConfirming}
                    loading={isConfirming}
                  />
                ) : null}

                {canWrite && canAssign ? (
                  <PrimaryButton
                    label={copy.pagos.actions.assign.assignCta}
                    variant={showNextStep || !canConfirm ? 'primary' : 'secondary'}
                    onPress={onAssignClient}
                  />
                ) : null}

                {!canWrite && (canConfirm || canAssign) ? (
                  <ThemedText variant="caption" muted style={{ textAlign: 'center' }}>
                    {copy.pagos.readOnlyHint} Contacta a un administrador para confirmar o asignar
                    clientes.
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
