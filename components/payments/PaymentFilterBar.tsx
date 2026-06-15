import { StyleSheet, View } from 'react-native';

import { FilterChips } from '@/components/shared/FilterChips';
import { SearchBar } from '@/components/shared/SearchBar';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import type {
  PaymentRegisterFilterCounts,
  PaymentStatusFilter,
} from '@/types/payment/payment-register-cache.types';

export interface PaymentFilterBarProps {
  status: PaymentStatusFilter;
  search: string;
  counts: PaymentRegisterFilterCounts | undefined;
  filteredTotal: number;
  onStatusChange: (status: PaymentStatusFilter) => void;
  onSearchChange: (search: string) => void;
}

type FilterLabelKey = 'all' | 'needsAction' | 'pendingSync' | 'syncFailed' | 'completed';

const FILTER_OPTIONS: { value: PaymentStatusFilter; labelKey: FilterLabelKey }[] = [
  { value: 'all', labelKey: 'all' },
  { value: 'needs_action', labelKey: 'needsAction' },
  { value: 'pending_sync', labelKey: 'pendingSync' },
  { value: 'sync_failed', labelKey: 'syncFailed' },
  { value: 'completed', labelKey: 'completed' },
];

function formatChipLabel(
  value: PaymentStatusFilter,
  labelKey: FilterLabelKey,
  counts: PaymentRegisterFilterCounts | undefined,
  search: string
): string {
  const base = copy.pagos.filters[labelKey];
  const hideCounts = !counts || value === 'all' || search.trim().length > 0;
  if (hideCounts) return base;
  const count = counts[value];
  return count > 0 ? `${base} (${count})` : base;
}

export function PaymentFilterBar({
  status,
  search,
  counts,
  filteredTotal,
  onStatusChange,
  onSearchChange,
}: PaymentFilterBarProps) {
  const chipOptions = FILTER_OPTIONS.map(({ value, labelKey }) => ({
    value,
    label: formatChipLabel(value, labelKey, counts, search),
  }));

  const activeFilterLabel =
    chipOptions.find((o) => o.value === status)?.label.replace(/\s\(\d+\)$/, '') ??
    copy.pagos.filters.all;
  const total = counts?.all ?? filteredTotal;
  const isFiltering = status !== 'all' || search.trim().length > 0;

  return (
    <View style={styles.container}>
      <SearchBar
        value={search}
        onChangeText={onSearchChange}
        placeholder={copy.pagos.filters.searchPlaceholder}
        accessibilityLabel={copy.pagos.filters.searchAccessibility}
        clearAccessibilityLabel={copy.pagos.filters.clearSearch}
      />

      <FilterChips options={chipOptions} value={status} onChange={onStatusChange} />

      <ThemedText variant="caption" muted style={styles.summary}>
        {copy.pagos.filters.resultCount(filteredTotal, total)}
        {isFiltering ? ` · ${copy.pagos.filters.activeFilter(activeFilterLabel)}` : ''}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingBottom: spacing.sm },
  summary: { paddingHorizontal: spacing.md },
});
