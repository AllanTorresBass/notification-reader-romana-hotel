import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/shared/AppScreen';
import { FeedbackEmptyState } from '@/components/feedback/FeedbackEmptyState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { InvoiceFilterBar } from '@/components/invoices/InvoiceFilterBar';
import { InvoiceListCard } from '@/components/invoices/InvoiceListCard';
import { Banner } from '@/components/ui/Banner';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { useInvoicesScreen } from '@/hooks/use-invoices-screen';
import { useAccessDeniedNotice } from '@/hooks/use-access-denied-notice';
import { usePermissions } from '@/hooks/use-permissions';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function InvoicesTabScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { canManageInvoices } = usePermissions();
  const accessDenied = useAccessDeniedNotice();
  const screen = useInvoicesScreen();

  const openNewInvoice = () => router.push('/invoices/new');

  const newInvoiceButton =
    screen.isAuthenticated && canManageInvoices ? (
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
      {accessDenied ? (
        <View style={styles.bannerWrap}>
          <Banner
            variant="warning"
            message={accessDenied.message}
            actionLabel={copy.ajustes.cancel}
            onAction={accessDenied.dismiss}
          />
        </View>
      ) : null}
      {newInvoiceButton}
      {!screen.isAuthenticated ? (
        <Banner
          variant="warning"
          message={copy.facturas.connectPrompt}
          actionLabel={copy.facturas.goToSettings}
          onAction={() => router.push('/(tabs)/settings')}
        />
      ) : (
        <InvoiceFilterBar
          search={screen.search}
          status={screen.status}
          resultCount={screen.resultCount}
          totalCount={screen.totalCount}
          referenceHint={screen.referenceHint}
          onSearchChange={screen.setSearch}
          onStatusChange={screen.setStatus}
        />
      )}

      {screen.showLocalMatchBanner && screen.localRegister ? (
        <View style={styles.bannerWrap}>
          <Banner
            variant="info"
            message={copy.facturas.search.localMatchBanner}
            actionLabel={copy.facturas.detail.viewInPagos}
            onAction={() => router.push('/(tabs)/feed')}
          />
        </View>
      ) : null}

      {!screen.isAuthenticated ? null : screen.isLoading ? (
        <View style={styles.loading}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : screen.isError ? (
        <FeedbackEmptyState
          title={copy.facturas.listLoadError}
          description={copy.facturas.listLoadError}
          variant="error"
          action={
            <PrimaryButton label={copy.clients.retry} onPress={() => void screen.refetch()} />
          }
        />
      ) : screen.invoices.length === 0 ? (
        <EmptyState title={screen.emptyTitle} description={screen.emptyDescription} />
      ) : (
        <FlashList
          data={screen.invoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={screen.isRefetching}
              onRefresh={() => void screen.refetch()}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => {
            if (screen.hasNextPage) void screen.fetchNextPage();
          }}
          renderItem={({ item }) => (
            <InvoiceListCard
              invoice={item}
              searchQuery={screen.debouncedSearch}
              onPress={() => router.push(`/invoices/${item.id}`)}
            />
          )}
          ListFooterComponent={
            screen.hasNextPage ? (
              <ActivityIndicator color={colors.primary} style={styles.footer} />
            ) : null
          }
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
  bannerWrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  loading: { gap: spacing.sm, paddingHorizontal: spacing.md },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  footer: { paddingVertical: spacing.md },
});
