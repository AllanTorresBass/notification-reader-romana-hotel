import { Pressable, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { fonts, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  formatCurrency,
  formatInvoiceDate,
  getInvoiceStatusBadgeVariant,
  getInvoiceStatusLabel,
} from '@/lib/utils/format-invoice';
import { isPagoMovil } from '@/types/payment/payment.types';
import type { Invoice } from '@/types/invoice/invoice.types';

function truncateReference(ref: string, max = 14): string {
  if (ref.length <= max) return ref;
  const head = ref.slice(0, 6);
  const tail = ref.slice(-4);
  return `${head}…${tail}`;
}

interface InvoiceListCardProps {
  invoice: Invoice;
  searchQuery?: string;
  onPress: () => void;
}

export function InvoiceListCard({ invoice, searchQuery = '', onPress }: InvoiceListCardProps) {
  const { colors } = useThemeColors();
  const clientName = invoice.client?.fullName ?? '—';
  const payment = invoice.payment;
  const showPagoMovil = payment && isPagoMovil(payment.paymentType);
  const reference = payment?.reference?.trim();

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <ThemedText variant="title">{invoice.invoiceNumber}</ThemedText>
              <ThemedText variant="caption" muted>
                {clientName}
              </ThemedText>
              {reference ? (
                <ThemedText variant="caption" style={{ fontFamily: fonts.monoMedium }}>
                  {copy.facturas.search.refChip(truncateReference(reference))}
                </ThemedText>
              ) : null}
            </View>
            <View style={styles.badges}>
              {showPagoMovil ? <Badge label="Pago Móvil" variant="secondary" /> : null}
              <Badge
                label={getInvoiceStatusLabel(invoice.status)}
                variant={getInvoiceStatusBadgeVariant(invoice.status)}
              />
            </View>
          </View>
          <View style={styles.cardFooter}>
            <ThemedText variant="mono" style={{ color: colors.primary }}>
              {formatCurrency(invoice.total, invoice.currency)}
            </ThemedText>
            <ThemedText variant="caption" muted>
              {formatInvoiceDate(invoice.issueDate)}
            </ThemedText>
          </View>
          {searchQuery.trim() && reference ? (
            <ThemedText variant="caption" muted>
              {copy.facturas.fields.reference}: {reference}
            </ThemedText>
          ) : null}
        </CardContent>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardTitle: { flex: 1, gap: 2 },
  badges: { alignItems: 'flex-end', gap: spacing.xs },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
