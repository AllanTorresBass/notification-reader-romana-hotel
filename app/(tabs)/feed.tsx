import { FlashList } from '@shopify/flash-list';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { ManualRegisterForm } from '@/components/payments/ManualRegisterForm';
import { PaymentDetailSheet } from '@/components/payments/PaymentDetailSheet';
import { PagosManualRegisterButton } from '@/components/payments/PagosManualRegisterButton';
import { PaymentFilterBar } from '@/components/payments/PaymentFilterBar';
import { PaymentRegisterCard } from '@/components/payments/PaymentRegisterCard';
import { PaymentTimelineSectionHeader } from '@/components/payments/PaymentTimelineSectionHeader';
import { AppScreen } from '@/components/shared/AppScreen';
import { EmptyState } from '@/components/shared/EmptyState';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { BannerStack } from '@/components/ui/Banner';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { usePaymentFeedScreen } from '@/hooks/use-payment-feed-screen';
import { usePermissions } from '@/hooks/use-permissions';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function PagosScreen() {
  const { colors } = useThemeColors();
  const { canWritePayments } = usePermissions();
  const feed = usePaymentFeedScreen();

  const headerRight = (
    <PagosManualRegisterButton visible={canWritePayments} onPress={feed.openManualRegister} />
  );

  const filterBar = !feed.cacheEmpty && !feed.showManual ? (
    <PaymentFilterBar
      status={feed.statusFilter}
      search={feed.searchInput}
      counts={feed.filterCounts}
      filteredTotal={feed.filteredTotal}
      onStatusChange={feed.setStatusFilter}
      onSearchChange={feed.setSearchInput}
    />
  ) : null;

  if (feed.isLoading) {
    return (
      <AppScreen
        title={copy.pagos.title}
        subtitle={copy.pagos.loading}
        scroll={false}
        brandLogo
        headerRight={headerRight}
      >
        <View style={styles.skeletons}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title={copy.pagos.title}
      subtitle={copy.pagos.subtitle}
      scroll={false}
      brandLogo
      headerRight={headerRight}
    >
      <BannerStack items={feed.banners} />

      {feed.showManual ? (
        <ManualRegisterForm
          name={feed.manualName}
          pago={feed.manualPago}
          mobile={feed.manualMobile}
          ref={feed.manualRef}
          paymentDate={feed.manualDate}
          paymentTime={feed.manualTime}
          onChangeName={feed.setManualName}
          onChangePago={feed.setManualPago}
          onChangeMobile={feed.setManualMobile}
          onChangeRef={feed.setManualRef}
          onChangePaymentDate={feed.setManualDate}
          onChangePaymentTime={feed.setManualTime}
          onSubmit={feed.submitManual}
          onCancel={() => feed.setShowManual(false)}
          isSubmitting={feed.manualRegister.isPending}
        />
      ) : null}

      {feed.cacheEmpty && !feed.showManual ? (
        <EmptyState
          title={copy.pagos.emptyTitle}
          description={copy.pagos.emptyDescription}
          action={
            canWritePayments ? (
              <PrimaryButton
                label={copy.pagos.manualRegister}
                onPress={feed.openManualRegister}
              />
            ) : undefined
          }
        />
      ) : null}

      {!feed.cacheEmpty && !feed.showManual && feed.entries.length === 0 ? (
        <>
          {filterBar}
          <EmptyState
            title={copy.pagos.filters.emptyTitle}
            description={copy.pagos.filters.emptyDescription}
            action={
              feed.showClearFiltersOnEmpty ? (
                <PrimaryButton
                  label={copy.pagos.filters.clearFilters}
                  onPress={feed.clearFilters}
                />
              ) : undefined
            }
          />
        </>
      ) : null}

      {!feed.cacheEmpty && !feed.showManual && feed.entries.length > 0 ? (
        <FlashList
          data={feed.listRows}
          keyExtractor={(item) => item.key}
          getItemType={(item) => item.type}
          contentContainerStyle={styles.list}
          ListHeaderComponent={filterBar}
          refreshControl={
            <RefreshControl
              refreshing={feed.isRefetching}
              onRefresh={() => void feed.refresh()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={() => {
            if (feed.hasNextPage) void feed.fetchNextPage();
          }}
          renderItem={({ item }) =>
            item.type === 'header' ? (
              <PaymentTimelineSectionHeader title={item.title} />
            ) : (
              <PaymentRegisterCard entry={item.entry} onPress={feed.openDetail} />
            )
          }
          ListFooterComponent={
            feed.hasNextPage ? (
              <ActivityIndicator color={colors.primary} style={styles.footer} />
            ) : null
          }
        />
      ) : null}

      <PaymentDetailSheet
        ref={feed.detailRef}
        entry={feed.selected}
        actionFeedback={feed.detailFeedback}
        onConfirmPayment={feed.handleConfirmPayment}
        onCompleteManual={feed.handleCompleteManual}
        isConfirming={feed.confirmPayment.isPending}
        canWrite={canWritePayments}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  skeletons: { gap: spacing.md, padding: spacing.md },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  footer: { paddingVertical: spacing.md },
});
