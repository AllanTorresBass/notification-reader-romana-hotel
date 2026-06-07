import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { forwardRef, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { fonts, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { formatPagoDisplay } from '@/lib/utils/format-pago';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

interface PaymentDetailSheetProps {
  entry: PaymentRegisterCacheEntry | null;
  onConfirmPayment: () => void;
  onAssignClient: () => void;
  isConfirming: boolean;
}

export const PaymentDetailSheet = forwardRef<BottomSheet, PaymentDetailSheetProps>(
  function PaymentDetailSheet(
    { entry, onConfirmPayment, onAssignClient, isConfirming },
    ref
  ) {
    const { colors } = useThemeColors();
    const snapPoints = useMemo(() => ['55%', '80%'], []);

    const canConfirm =
      entry &&
      entry.syncStatus !== 'payment_confirmed' &&
      entry.syncStatus !== 'client_assigned' &&
      entry.ref &&
      entry.paymentDate;

    const canAssign =
      entry &&
      (entry.syncStatus === 'payment_confirmed' ||
        entry.invoiceStatus === 'paid') &&
      entry.syncStatus !== 'client_assigned';

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
              <ThemedText variant="heading" style={{ fontFamily: fonts.monoMedium }}>
                Bs. {formatPagoDisplay(entry.pago)}
              </ThemedText>
              <ThemedText variant="caption" muted>
                Tel. emisor: {entry.mobile}
              </ThemedText>
              <View style={styles.grid}>
                <DetailRow label="Referencia" value={entry.ref || '—'} />
                <DetailRow label="Fecha" value={entry.paymentDate || '—'} />
                <DetailRow label="Hora" value={entry.paymentTime || '—'} />
                <DetailRow label="Nombre" value={entry.name ?? 'Sin nombre'} />
              </View>
              {entry.lastSyncError ? (
                <ThemedText variant="caption" style={{ color: colors.danger }}>
                  {entry.lastSyncError}
                </ThemedText>
              ) : null}
              {canConfirm ? (
                <PrimaryButton
                  label={isConfirming ? 'Confirmando…' : 'Confirmar pago'}
                  onPress={() => {
                    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onConfirmPayment();
                  }}
                  disabled={isConfirming}
                />
              ) : null}
              {isConfirming ? <ActivityIndicator color={colors.primary} /> : null}
              {canAssign ? (
                <PrimaryButton
                  label="Asociar cliente"
                  variant="secondary"
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
  grid: { gap: spacing.sm, marginVertical: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  rowValue: { fontWeight: '600', flex: 1, textAlign: 'right' },
});
