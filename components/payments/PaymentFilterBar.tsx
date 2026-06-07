import { Search, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { FilterChips } from '@/components/shared/FilterChips';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type {
  PaymentRegisterFilterCounts,
  PaymentStatusFilter,
} from '@/types/payment/payment-register-cache.types';

interface PaymentFilterBarProps {
  status: PaymentStatusFilter;
  search: string;
  counts: PaymentRegisterFilterCounts | undefined;
  filteredTotal: number;
  onStatusChange: (status: PaymentStatusFilter) => void;
  onSearchChange: (search: string) => void;
}

type FilterLabelKey =
  | 'all'
  | 'needsAction'
  | 'pendingSync'
  | 'syncFailed'
  | 'awaitingAssign'
  | 'completed';

const FILTER_OPTIONS: { value: PaymentStatusFilter; labelKey: FilterLabelKey }[] = [
  { value: 'all', labelKey: 'all' },
  { value: 'needs_action', labelKey: 'needsAction' },
  { value: 'pending_sync', labelKey: 'pendingSync' },
  { value: 'sync_failed', labelKey: 'syncFailed' },
  { value: 'awaiting_assign', labelKey: 'awaitingAssign' },
  { value: 'completed', labelKey: 'completed' },
];

function formatChipLabel(
  value: PaymentStatusFilter,
  labelKey: FilterLabelKey,
  counts: PaymentRegisterFilterCounts | undefined
): string {
  const base = copy.pagos.filters[labelKey];
  if (!counts || value === 'all') return base;
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
  const { colors } = useThemeColors();

  const chipOptions = FILTER_OPTIONS.map(({ value, labelKey }) => ({
    value,
    label: formatChipLabel(value, labelKey, counts),
  }));

  const activeFilterLabel = chipOptions.find((o) => o.value === status)?.label ?? copy.pagos.filters.all;
  const total = counts?.all ?? filteredTotal;

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Search color={colors.textMuted} size={18} style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder={copy.pagos.filters.searchPlaceholder}
          accessibilityLabel={copy.pagos.filters.searchAccessibility}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {search.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.pagos.filters.clearSearch}
            onPress={() => onSearchChange('')}
            hitSlop={8}
            style={styles.clearButton}
          >
            <X color={colors.textMuted} size={18} />
          </Pressable>
        ) : null}
      </View>

      <FilterChips options={chipOptions} value={status} onChange={onStatusChange} />

      <ThemedText variant="caption" muted style={styles.summary}>
        {copy.pagos.filters.resultCount(filteredTotal, total)}
        {status !== 'all' || search.trim()
          ? ` · ${copy.pagos.filters.activeFilter(activeFilterLabel.replace(/\s\(\d+\)$/, ''))}`
          : ''}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingBottom: spacing.sm },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  searchIcon: { position: 'absolute', left: spacing.md + spacing.sm, zIndex: 1 },
  searchInput: {
    flex: 1,
    paddingLeft: spacing.xl + spacing.sm,
    paddingRight: spacing.xl,
  },
  clearButton: {
    position: 'absolute',
    right: spacing.md + spacing.sm,
    zIndex: 1,
  },
  summary: { paddingHorizontal: spacing.md },
});
