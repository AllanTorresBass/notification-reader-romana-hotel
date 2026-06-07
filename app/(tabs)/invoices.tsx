import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/shared/AppScreen';
import { FeedbackEmptyState } from '@/components/feedback/FeedbackEmptyState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { Badge } from '@/components/ui/Badge';
import { Banner } from '@/components/ui/Banner';
import { Card, CardContent } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { useIsApiAuthenticated } from '@/hooks/use-api-auth';
import { useInvoicesQuery } from '@/hooks/use-invoices';
import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  formatCurrency,
  formatInvoiceDate,
  getInvoiceStatusBadgeVariant,
  getInvoiceStatusLabel,
} from '@/lib/utils/format-invoice';
import type { Invoice } from '@/types/invoice/invoice.types';

function InvoiceListCard({ invoice, onPress }: { invoice: Invoice; onPress: () => void }) {
  const { colors } = useThemeColors();
  const clientName = invoice.client?.fullName ?? '—';

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
            </View>
            <Badge
              label={getInvoiceStatusLabel(invoice.status)}
              variant={getInvoiceStatusBadgeVariant(invoice.status)}
            />
          </View>
          <View style={styles.cardFooter}>
            <ThemedText variant="mono" style={{ color: colors.primary }}>
              {formatCurrency(invoice.total, invoice.currency)}
            </ThemedText>
            <ThemedText variant="caption" muted>
              {formatInvoiceDate(invoice.issueDate)}
            </ThemedText>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}

export default function InvoicesTabScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const isAuthenticated = useIsApiAuthenticated();
  const { data, isLoading, isError, refetch, isRefetching } = useInvoicesQuery(
    { limit: 30, page: 1 },
    isAuthenticated
  );

  const invoices = data?.data ?? [];

  const openNewInvoice = () => router.push('/invoices/new');

  const newInvoiceButton = isAuthenticated ? (
    <View style={styles.topAction}>
      <PrimaryButton label={copy.facturas.newInvoice} onPress={openNewInvoice} />
    </View>
  ) : null;

  return (
    <AppScreen
      title={copy.facturas.title}
      subtitle={copy.facturas.subtitle}
      scroll={false}
      contentStyle={styles.screenContent}
    >
      {newInvoiceButton}
      {!isAuthenticated ? (
        <Banner
          variant="warning"
          message={copy.facturas.connectPrompt}
          actionLabel={copy.facturas.goToSettings}
          onAction={() => router.push('/(tabs)/settings')}
        />
      ) : isLoading ? (
        <View style={styles.loading}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : isError ? (
        <FeedbackEmptyState
          title={copy.facturas.listLoadError}
          description={copy.facturas.listLoadError}
          variant="error"
          action={
            <PrimaryButton label={copy.clients.retry} onPress={() => void refetch()} />
          }
        />
      ) : invoices.length === 0 ? (
        <EmptyState
          title={copy.facturas.emptyTitle}
          description={copy.facturas.emptyDescription}
        />
      ) : (
        <FlashList
          data={invoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <InvoiceListCard
              invoice={item}
              onPress={() => router.push(`/invoices/${item.id}`)}
            />
          )}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: { flex: 1, paddingHorizontal: 0 },
  topAction: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  loading: { gap: spacing.sm, paddingHorizontal: spacing.md },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  card: { marginBottom: spacing.sm },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardTitle: { flex: 1, gap: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
