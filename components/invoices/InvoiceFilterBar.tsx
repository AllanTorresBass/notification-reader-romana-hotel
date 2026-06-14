import { StyleSheet, View } from 'react-native';

import { FilterChips } from '@/components/shared/FilterChips';
import { SearchBar } from '@/components/shared/SearchBar';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import type { InvoiceStatus } from '@/types/invoice/invoice.schemas';

export type InvoiceStatusFilter = 'all' | InvoiceStatus;

interface InvoiceFilterBarProps {
  search: string;
  status: InvoiceStatusFilter;
  resultCount: number;
  totalCount: number;
  referenceHint?: string;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: InvoiceStatusFilter) => void;
}

const FILTER_OPTIONS: { value: InvoiceStatusFilter; label: string }[] = [
  { value: 'all', label: copy.facturas.search.filters.all },
  { value: 'paid', label: copy.facturas.search.filters.paid },
  { value: 'pending', label: copy.facturas.search.filters.pending },
];

export function InvoiceFilterBar({
  search,
  status,
  resultCount,
  totalCount,
  referenceHint,
  onSearchChange,
  onStatusChange,
}: InvoiceFilterBarProps) {
  const activeFilterLabel =
    FILTER_OPTIONS.find((option) => option.value === status)?.label ??
    copy.facturas.search.filters.all;

  return (
    <View style={styles.container}>
      <SearchBar
        value={search}
        onChangeText={onSearchChange}
        placeholder={copy.facturas.search.placeholder}
        accessibilityLabel={copy.facturas.search.accessibility}
        clearAccessibilityLabel={copy.facturas.search.clear}
      />

      <FilterChips options={FILTER_OPTIONS} value={status} onChange={onStatusChange} />

      {referenceHint ? (
        <ThemedText variant="caption" muted style={styles.hint}>
          {referenceHint}
        </ThemedText>
      ) : null}

      <ThemedText variant="caption" muted style={styles.summary}>
        {copy.facturas.search.resultCount(resultCount, totalCount)}
        {status !== 'all' || search.trim()
          ? ` · ${copy.facturas.search.activeFilter(activeFilterLabel)}`
          : ''}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingBottom: spacing.sm },
  hint: { paddingHorizontal: spacing.md },
  summary: { paddingHorizontal: spacing.md },
});
