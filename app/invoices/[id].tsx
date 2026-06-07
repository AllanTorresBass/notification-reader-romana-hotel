import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/shared/AppScreen';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { useInvoiceQuery } from '@/hooks/use-invoices';
import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  formatCurrency,
  formatInvoiceDate,
  getInvoiceStatusBadgeVariant,
  getInvoiceStatusLabel,
} from '@/lib/utils/format-invoice';
import { getPaymentTypeLabel } from '@/types/payment/payment.types';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useThemeColors();
  const { data: invoice, isLoading, isError } = useInvoiceQuery(id ?? '', !!id);

  if (isLoading) {
    return (
      <AppScreen title={copy.facturas.detail.invoiceNumber} scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  if (isError || !invoice) {
    return (
      <AppScreen title={copy.facturas.detail.invoiceNumber}>
        <ThemedText variant="body" muted>
          {copy.facturas.detailLoadError}
        </ThemedText>
      </AppScreen>
    );
  }

  const clientName = invoice.client?.fullName ?? '—';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: invoice.invoiceNumber,
          headerBackTitle: copy.tabs.facturas,
        }}
      />
      <AppScreen subtitle={clientName}>
      <View style={styles.headerRow}>
        <Badge
          label={getInvoiceStatusLabel(invoice.status)}
          variant={getInvoiceStatusBadgeVariant(invoice.status)}
        />
      </View>

      <Card>
        <CardContent>
          <ThemedText variant="label" muted>
            {copy.facturas.detail.client}
          </ThemedText>
          <ThemedText variant="title">{clientName}</ThemedText>
          {invoice.client?.identityCard ? (
            <ThemedText variant="caption" muted>
              {invoice.client.identityCard}
            </ThemedText>
          ) : null}

          <View style={[styles.divider, { borderTopColor: colors.border }]} />

          <ThemedText variant="label" muted>
            {copy.facturas.detail.items}
          </ThemedText>
          {invoice.lineItems.map((item) => (
            <View key={item.id} style={styles.lineRow}>
              <View style={styles.lineInfo}>
                <ThemedText variant="body">{item.serviceName}</ThemedText>
                <ThemedText variant="caption" muted>
                  ×{item.quantity}
                </ThemedText>
              </View>
              <ThemedText variant="mono">
                {formatCurrency(item.totalPrice, invoice.currency)}
              </ThemedText>
            </View>
          ))}

          <View style={[styles.divider, { borderTopColor: colors.border }]} />

          <View style={styles.metaRow}>
            <ThemedText variant="caption" muted>
              {copy.facturas.detail.issueDate}: {formatInvoiceDate(invoice.issueDate)}
            </ThemedText>
            <ThemedText variant="caption" muted>
              {copy.facturas.detail.dueDate}: {formatInvoiceDate(invoice.dueDate)}
            </ThemedText>
          </View>

          {invoice.taxAmount > 0 ? (
            <View style={styles.totalRow}>
              <ThemedText variant="caption" muted>
                {copy.facturas.detail.subtotal}
              </ThemedText>
              <ThemedText variant="mono">
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </ThemedText>
            </View>
          ) : null}
          {invoice.taxAmount > 0 ? (
            <View style={styles.totalRow}>
              <ThemedText variant="caption" muted>
                {copy.facturas.detail.tax} ({invoice.taxRate}%)
              </ThemedText>
              <ThemedText variant="mono">
                {formatCurrency(invoice.taxAmount, invoice.currency)}
              </ThemedText>
            </View>
          ) : null}
          {invoice.discount > 0 ? (
            <View style={styles.totalRow}>
              <ThemedText variant="caption" muted>
                {copy.facturas.fields.discount}
              </ThemedText>
              <ThemedText variant="mono">
                -{formatCurrency(invoice.discount, invoice.currency)}
              </ThemedText>
            </View>
          ) : null}

          <View style={[styles.totalRow, styles.grandTotal, { borderTopColor: colors.border }]}>
            <ThemedText variant="label">{copy.facturas.detail.total}</ThemedText>
            <ThemedText variant="heading" style={{ color: colors.primary }}>
              {formatCurrency(invoice.total, invoice.currency)}
            </ThemedText>
          </View>
        </CardContent>
      </Card>

      {invoice.payment ? (
        <Card>
          <CardContent>
            <ThemedText variant="label" muted>
              {copy.facturas.detail.payment}
            </ThemedText>
            <ThemedText variant="body">
              {getPaymentTypeLabel(invoice.payment.paymentType)}
            </ThemedText>
            {invoice.payment.reference ? (
              <ThemedText variant="mono" muted>
                {copy.facturas.fields.reference}: {invoice.payment.reference}
              </ThemedText>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {invoice.notes ? (
        <Card>
          <CardContent>
            <ThemedText variant="label" muted>
              {copy.facturas.detail.notes}
            </ThemedText>
            <ThemedText variant="body">{invoice.notes}</ThemedText>
          </CardContent>
        </Card>
      ) : null}

      <PrimaryButton
        label={copy.facturas.createAnother}
        onPress={() => router.push('/invoices/new')}
      />
    </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { marginBottom: spacing.sm },
  divider: { borderTopWidth: 1, marginVertical: spacing.sm },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lineInfo: { flex: 1, gap: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotal: {
    borderTopWidth: 1,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
});
