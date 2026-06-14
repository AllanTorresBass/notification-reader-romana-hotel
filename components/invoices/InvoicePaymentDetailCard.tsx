import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { fonts, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { reportOutcome } from '@/lib/feedback/report-feedback';
import { formatCurrency, formatInvoiceDate } from '@/lib/utils/format-invoice';
import {
  getPaymentTypeLabel,
  isPagoMovil,
  type InvoicePayment,
} from '@/types/payment/payment.types';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

interface InvoicePaymentDetailCardProps {
  payment: InvoicePayment;
  localRegister?: PaymentRegisterCacheEntry | null;
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <ThemedText variant="caption" muted>
        {label}
      </ThemedText>
      <ThemedText
        variant="body"
        style={[styles.rowValue, mono ? { fontFamily: fonts.monoMedium } : undefined]}
      >
        {value}
      </ThemedText>
    </View>
  );
}

export function InvoicePaymentDetailCard({
  payment,
  localRegister,
}: InvoicePaymentDetailCardProps) {
  const router = useRouter();
  const { colors } = useThemeColors();
  const emitterPhone =
    payment.linkedRegister?.mobile ?? localRegister?.mobile ?? null;

  const handleCopyReference = async () => {
    if (!payment.reference) return;
    await Clipboard.setStringAsync(payment.reference);
    reportOutcome(
      {
        kind: 'create_invoice',
        status: 'completed',
        title: copy.facturas.detail.referenceCopied,
        message: payment.reference,
      },
      { toast: true, log: false }
    );
  };

  return (
    <Card>
      <CardContent style={styles.content}>
        <View style={styles.header}>
          <ThemedText variant="label" muted>
            {copy.facturas.detail.paymentDetails}
          </ThemedText>
          <Badge label={getPaymentTypeLabel(payment.paymentType)} variant="secondary" />
        </View>

        <ThemedText variant="heading" style={{ color: colors.primary, fontFamily: fonts.monoMedium }}>
          {formatCurrency(payment.amount, payment.currency)}
        </ThemedText>

        <View style={styles.grid}>
          {payment.reference ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.facturas.detail.copyReference}
              onPress={() => void handleCopyReference()}
            >
              <DetailRow
                label={copy.facturas.fields.reference}
                value={payment.reference}
                mono
              />
            </Pressable>
          ) : null}
          {payment.paymentDate ? (
            <DetailRow
              label={copy.facturas.fields.paymentDate}
              value={formatInvoiceDate(payment.paymentDate)}
            />
          ) : null}
          {payment.paymentTime ? (
            <DetailRow label={copy.facturas.fields.paymentTime} value={payment.paymentTime} />
          ) : null}
          {isPagoMovil(payment.paymentType) && emitterPhone ? (
            <DetailRow
              label={copy.facturas.detail.emitterPhone}
              value={emitterPhone}
              mono
            />
          ) : null}
        </View>

        {localRegister ? (
          <PrimaryButton
            label={copy.facturas.detail.viewInPagos}
            variant="secondary"
            onPress={() => router.push('/(tabs)/feed')}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  grid: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  rowValue: { fontWeight: '600', flex: 1, textAlign: 'right' },
});
