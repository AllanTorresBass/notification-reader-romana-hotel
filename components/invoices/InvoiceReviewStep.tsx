import { StyleSheet, View } from 'react-native';

import { FeedbackInline } from '@/components/feedback/FeedbackInline';
import { OperationFeedbackCard } from '@/components/feedback/OperationFeedbackCard';
import type { OperationOutcome } from '@/types/feedback/operation-outcome.types';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { radius, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { RemoteClient } from '@/lib/api-client/clients/ClientApiService';
import type { InvoiceLineItemInput } from '@/types/invoice/invoice.schemas';
import type { PaymentFormValues } from '@/types/payment/payment.schemas';
import { isPagoMovil, type PaymentType } from '@/types/payment/payment.types';

import { InvoicePreviewCard } from './InvoicePreviewCard';

interface InvoiceReviewStepProps {
  client: RemoteClient;
  lineItems: InvoiceLineItemInput[];
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  payment: PaymentFormValues;
  paymentType: PaymentType;
  quantity: number;
  taxRate: number;
  discount: number;
  notes: string;
  onQuantityChange: (quantity: number) => void;
  onIssueDateChange: (date: string) => void;
  onDueDateChange: (date: string) => void;
  onTaxRateChange: (rate: number) => void;
  onDiscountChange: (discount: number) => void;
  onNotesChange: (notes: string) => void;
  onPaymentChange: (payment: PaymentFormValues) => void;
  submitError: string | null;
  actionFeedback?: OperationOutcome | null;
}

function parseNumber(value: string, fallback = 0): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function InvoiceReviewStep({
  client,
  lineItems,
  issueDate,
  dueDate,
  currency,
  subtotal,
  taxAmount,
  total,
  payment,
  paymentType,
  quantity,
  taxRate,
  discount,
  notes,
  onQuantityChange,
  onIssueDateChange,
  onDueDateChange,
  onTaxRateChange,
  onDiscountChange,
  onNotesChange,
  onPaymentChange,
  submitError,
  actionFeedback,
}: InvoiceReviewStepProps) {
  const { colors } = useThemeColors();

  return (
    <View style={styles.container}>
      <InvoicePreviewCard
        client={client}
        lineItems={lineItems}
        issueDate={issueDate}
        dueDate={dueDate}
        currency={currency}
        subtotal={subtotal}
        taxAmount={taxAmount}
        total={total}
        payment={payment}
        paymentType={paymentType}
      />

      <View style={[styles.editPanel, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <ThemedText variant="title">{copy.facturas.shortcut.editPanelTitle}</ThemedText>

        <TextInput
          label={copy.facturas.fields.quantity}
          value={String(quantity)}
          onChangeText={(v) => onQuantityChange(Math.max(1, parseNumber(v, 1)))}
          keyboardType="number-pad"
        />
        <TextInput
          label={copy.facturas.fields.issueDate}
          value={issueDate}
          onChangeText={onIssueDateChange}
          placeholder="YYYY-MM-DD"
        />
        <TextInput
          label={copy.facturas.fields.dueDate}
          value={dueDate}
          onChangeText={onDueDateChange}
          placeholder="YYYY-MM-DD"
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <TextInput
              label={copy.facturas.fields.taxRate}
              value={String(taxRate)}
              onChangeText={(v) => onTaxRateChange(Math.max(0, Math.min(100, parseNumber(v, 0))))}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.half}>
            <TextInput
              label={copy.facturas.fields.discount}
              value={String(discount)}
              onChangeText={(v) => onDiscountChange(Math.max(0, parseNumber(v, 0)))}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <TextInput
          label={copy.facturas.fields.notes}
          value={notes}
          onChangeText={onNotesChange}
          multiline
          numberOfLines={3}
          style={styles.notes}
        />

        {isPagoMovil(paymentType) ? (
          <>
            <TextInput
              label={copy.facturas.fields.reference}
              value={payment.reference ?? ''}
              onChangeText={(reference) => onPaymentChange({ ...payment, reference })}
            />
            <TextInput
              label={copy.facturas.fields.paymentDate}
              value={payment.paymentDate ?? ''}
              onChangeText={(paymentDate) => onPaymentChange({ ...payment, paymentDate })}
            />
            <TextInput
              label={copy.facturas.fields.paymentTime}
              value={payment.paymentTime ?? ''}
              onChangeText={(paymentTime) => onPaymentChange({ ...payment, paymentTime })}
            />
          </>
        ) : null}
      </View>

      {actionFeedback ? <OperationFeedbackCard outcome={actionFeedback} /> : null}
      {!actionFeedback && submitError ? (
        <FeedbackInline message={submitError} tone="error" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  editPanel: {
    borderWidth: 1,
    borderRadius: radius['2xl'],
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  notes: { minHeight: 80, textAlignVertical: 'top' },
});
