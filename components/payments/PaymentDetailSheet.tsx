import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { forwardRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { OperationFeedbackCard } from '@/components/feedback/OperationFeedbackCard';
import { PaymentStatusStepper } from '@/components/payments/PaymentStatusStepper';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Badge } from '@/components/ui/Badge';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { fonts, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { formatSyncStatusLabel, formatPagoDisplay } from '@/lib/utils/format-pago';
import { canAssignClientToPayment } from '@/lib/utils/merge-payment-register-state';
import type { OperationOutcome } from '@/types/feedback/operation-outcome.types';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

interface PaymentDetailSheetProps {
  entry: PaymentRegisterCacheEntry | null;
  actionFeedback: OperationOutcome | null;
  onConfirmPayment: () => void;
  onAssignClient: () => void;
  isConfirming: boolean;
}

export const PaymentDetailSheet = forwardRef<BottomSheet, PaymentDetailSheetProps>(
  function PaymentDetailSheet(
    { entry, actionFeedback, onConfirmPayment, onAssignClient, isConfirming },
    ref
  ) {
    const { colors } = useThemeColors();
    const snapPoints = useMemo(() => ['55%', '85%'], []);

    const canConfirm =
      entry &&
      entry.syncStatus !== 'payment_confirmed' &&
      entry.syncStatus !== 'client_assigned' &&
      entry.ref &&
      entry.paymentDate;

    const canAssign = entry ? canAssignClientToPayment(entry) : false;

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
            <ThemedText muted>Selecciona un pago</ThemedText>
          ) : (
            <>
              <View style={styles.header}>
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
                Tel. emisor: {entry.mobile}
              </ThemedText>

              <View style={styles.grid}>
                <DetailRow label="Referencia" value={entry.ref || '—'} />
                <DetailRow label="Fecha" value={entry.paymentDate || '—'} />
                <DetailRow label="Hora" value={entry.paymentTime || '—'} />
                <DetailRow label="Nombre" value={entry.name ?? 'Sin nombre'} />
              </View>

              <PaymentStatusStepper
                syncStatus={entry.syncStatus}
                invoiceStatus={entry.invoiceStatus}
              />

              {actionFeedback ? <OperationFeedbackCard outcome={actionFeedback} /> : null}

              {entry.lastSyncError ? (
                <ThemedText variant="caption" style={{ color: colors.danger }}>
                  {entry.lastSyncError}
                </ThemedText>
              ) : null}

              {showNextStep ? (
                <ThemedText variant="caption" style={{ color: colors.success }}>
                  {copy.pagos.actions.confirm.nextStep}
                </ThemedText>
              ) : null}

              {canConfirm ? (
                <PrimaryButton
                  label={
                    isConfirming
                      ? copy.pagos.actions.confirm.confirming
                      : 'Confirmar pago'
                  }
                  onPress={onConfirmPayment}
                  disabled={isConfirming}
                  loading={isConfirming}
                />
              ) : null}

              {canAssign ? (
                <PrimaryButton
                  label={copy.pagos.actions.assign.assignCta}
                  variant={showNextStep ? 'primary' : 'secondary'}
                  onPress={onAssignClient}
                />
              ) : null}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText variant="caption" muted>
        {label}
      </ThemedText>
      <ThemedText variant="body" style={styles.rowValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  grid: { gap: spacing.sm, marginVertical: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  rowValue: { fontWeight: '600', flex: 1, textAlign: 'right' },
});
