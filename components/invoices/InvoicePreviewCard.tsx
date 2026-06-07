import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { RemoteClient } from '@/lib/api-client/clients/ClientApiService';
import {
  formatCurrency,
  formatInvoiceDate,
  getInvoiceStatusLabel,
} from '@/lib/utils/format-invoice';
import type { InvoiceLineItemInput } from '@/types/invoice/invoice.schemas';
import type { PaymentFormValues } from '@/types/payment/payment.schemas';
import { getPaymentTypeLabel, isPagoMovil, type PaymentType } from '@/types/payment/payment.types';

interface InvoicePreviewCardProps {
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
}

export function InvoicePreviewCard({
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
}: InvoicePreviewCardProps) {
  const { colors } = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={[styles.banner, { backgroundColor: colors.primaryMuted, borderColor: `${colors.primary}33` }]}>
        <View style={styles.bannerText}>
          <ThemedText variant="label" muted>
            {copy.facturas.shortcut.reviewConfirmLabel}
          </ThemedText>
          <ThemedText variant="caption" muted>
            {copy.facturas.shortcut.reviewConfirmHint}
          </ThemedText>
        </View>
        <Badge label={getInvoiceStatusLabel('paid')} variant="success" />
      </View>

      <Card>
        <View style={styles.cardSection}>
          <ThemedText variant="label" muted>
            {copy.facturas.shortcut.billTo}
          </ThemedText>
          <ThemedText variant="title">{client.fullName}</ThemedText>
          <ThemedText variant="caption" muted>
            {client.identityCard}
            {client.phone ? ` · ${client.phone}` : ''}
          </ThemedText>
        </View>
        <CardContent>
          {lineItems.map((item, index) => (
            <View key={`${item.serviceId}-${index}`} style={styles.lineRow}>
              <View style={styles.lineInfo}>
                <ThemedText variant="body">{item.serviceName}</ThemedText>
                {item.description ? (
                  <ThemedText variant="caption" muted numberOfLines={1}>
                    {item.description}
                  </ThemedText>
                ) : null}
              </View>
              <ThemedText variant="caption" muted>
                ×{item.quantity}
              </ThemedText>
              <ThemedText variant="mono">
                {formatCurrency(item.quantity * item.unitPrice, currency)}
              </ThemedText>
            </View>
          ))}

          <View style={[styles.datesRow, { borderTopColor: colors.border }]}>
            <ThemedText variant="caption" muted>
              {copy.facturas.detail.issueDate}: {formatInvoiceDate(issueDate)}
            </ThemedText>
            <ThemedText variant="caption" muted>
              {copy.facturas.detail.dueDate}: {formatInvoiceDate(dueDate)}
            </ThemedText>
          </View>

          {taxAmount > 0 ? (
            <View style={styles.totalRow}>
              <ThemedText variant="caption" muted>
                {copy.facturas.detail.subtotal}
              </ThemedText>
              <ThemedText variant="mono">{formatCurrency(subtotal, currency)}</ThemedText>
            </View>
          ) : null}
          {taxAmount > 0 ? (
            <View style={styles.totalRow}>
              <ThemedText variant="caption" muted>
                {copy.facturas.detail.tax}
              </ThemedText>
              <ThemedText variant="mono">{formatCurrency(taxAmount, currency)}</ThemedText>
            </View>
          ) : null}

          <View style={[styles.totalRow, styles.grandTotal, { borderTopColor: colors.border }]}>
            <ThemedText variant="label">{copy.facturas.detail.total}</ThemedText>
            <ThemedText variant="heading" style={{ color: colors.primary }}>
              {formatCurrency(total, currency)}
            </ThemedText>
          </View>
        </CardContent>
      </Card>

      <Card>
        <View style={styles.cardSection}>
          <ThemedText variant="label" muted>
            {copy.facturas.shortcut.paymentSection}
          </ThemedText>
        </View>
        <CardContent>
          <ThemedText variant="body">{getPaymentTypeLabel(paymentType)}</ThemedText>
          {isPagoMovil(paymentType) && payment.reference ? (
            <ThemedText variant="mono" muted>
              {copy.facturas.fields.reference}: {payment.reference}
            </ThemedText>
          ) : null}
          {isPagoMovil(paymentType) && payment.paymentDate ? (
            <ThemedText variant="caption" muted>
              {formatInvoiceDate(payment.paymentDate)}
              {payment.paymentTime ? ` · ${payment.paymentTime}` : ''}
            </ThemedText>
          ) : null}
        </CardContent>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  bannerText: { flex: 1, gap: 2 },
  cardSection: {
    padding: spacing.md,
    paddingBottom: 0,
    gap: spacing.xs,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lineInfo: { flex: 1, gap: 2 },
  datesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  grandTotal: {
    borderTopWidth: 1,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
});
