import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FilterChips } from '@/components/shared/FilterChips';
import { SearchBar } from '@/components/shared/SearchBar';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { radius, spacing } from '@/constants/theme';
import { MIN_TOUCH_TARGET } from '@/constants/touch';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type {
  PaymentRegisterFilterCounts,
  PaymentStatusFilter,
} from '@/types/payment/payment-register-cache.types';

function trimText(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function hasText(value: unknown): boolean {
  return trimText(value).length > 0;
}

const filtersCopy = copy.pagos?.filters;

export interface PaymentFilterBarProps {
  status?: PaymentStatusFilter;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  timeFrom?: string;
  timeTo?: string;
  counts?: PaymentRegisterFilterCounts;
  filteredTotal?: number;
  onStatusChange?: (status: PaymentStatusFilter) => void;
  onSearchChange?: (search: string) => void;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  onTimeFromChange?: (value: string) => void;
  onTimeToChange?: (value: string) => void;
  onClearFilters?: () => void;
}

type FilterLabelKey = 'all' | 'needsAction' | 'pendingSync' | 'syncFailed' | 'completed';

const FILTER_OPTIONS: { value: PaymentStatusFilter; labelKey: FilterLabelKey }[] = [
  { value: 'all', labelKey: 'all' },
  { value: 'needs_action', labelKey: 'needsAction' },
  { value: 'pending_sync', labelKey: 'pendingSync' },
  { value: 'sync_failed', labelKey: 'syncFailed' },
  { value: 'completed', labelKey: 'completed' },
];

const noop = () => {};

function formatChipLabel(
  value: PaymentStatusFilter,
  labelKey: FilterLabelKey,
  counts: PaymentRegisterFilterCounts | undefined,
  hideStatusCounts: boolean
): string {
  const base = filtersCopy?.[labelKey] ?? '';
  if (hideStatusCounts || !counts || value === 'all') return base;
  const count = counts[value];
  return count > 0 ? `${base} (${count})` : base;
}

function FilterRangeRow({
  label,
  fromValue,
  toValue,
  fromPlaceholder,
  toPlaceholder,
  onFromChange,
  onToChange,
  keyboardType = 'default',
}: {
  label: string;
  fromValue: string;
  toValue: string;
  fromPlaceholder: string;
  toPlaceholder: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  keyboardType?: 'default' | 'numbers-and-punctuation';
}) {
  return (
    <View style={styles.rangeBlock}>
      <ThemedText variant="label" muted style={styles.rangeLabel}>
        {label}
      </ThemedText>
      <View style={styles.rangeRow}>
        <View style={styles.rangeField}>
          <TextInput
            value={fromValue || ''}
            onChangeText={onFromChange}
            placeholder={fromPlaceholder}
            keyboardType={keyboardType}
            style={styles.compactInput}
          />
        </View>
        <View style={styles.rangeField}>
          <TextInput
            value={toValue || ''}
            onChangeText={onToChange}
            placeholder={toPlaceholder}
            keyboardType={keyboardType}
            style={styles.compactInput}
          />
        </View>
      </View>
    </View>
  );
}

export function PaymentFilterBar(rawProps?: PaymentFilterBarProps | null) {
  const props = rawProps ?? {};
  const {
    status = 'all',
    search,
    dateFrom,
    dateTo,
    timeFrom,
    timeTo,
    counts,
    filteredTotal = 0,
    onStatusChange = noop,
    onSearchChange = noop,
    onDateFromChange = noop,
    onDateToChange = noop,
    onTimeFromChange = noop,
    onTimeToChange = noop,
    onClearFilters = noop,
  } = props;

  const { colors } = useThemeColors();
  const safeSearch = trimText(search);
  const safeDateFrom = trimText(dateFrom);
  const safeDateTo = trimText(dateTo);
  const safeTimeFrom = trimText(timeFrom);
  const safeTimeTo = trimText(timeTo);
  const hasDateFilter = hasText(safeDateFrom) || hasText(safeDateTo);
  const hasTimeFilter = hasText(safeTimeFrom) || hasText(safeTimeTo);
  const hasSearch = hasText(safeSearch);
  const hasStatusFilter = status !== 'all';
  const isFiltering = hasSearch || hasStatusFilter || hasDateFilter || hasTimeFilter;
  const [expanded, setExpanded] = useState(isFiltering);

  const chipOptions = useMemo(
    () =>
      FILTER_OPTIONS.map(({ value, labelKey }) => ({
        value,
        label: formatChipLabel(value, labelKey, counts, hasSearch || hasDateFilter || hasTimeFilter),
      })),
    [counts, hasSearch, hasDateFilter, hasTimeFilter]
  );

  const activeFilterParts = useMemo(() => {
    const parts: string[] = [];
    if (hasStatusFilter) {
      const label =
        chipOptions.find((option) => option.value === status)?.label ??
        filtersCopy?.all ?? 'Todos';
      parts.push(label.replace(/\s\(\d+\)$/, ''));
    }
    if (hasDateFilter) parts.push(filtersCopy?.dateFilterActive ?? 'fecha');
    if (hasTimeFilter) parts.push(filtersCopy?.timeFilterActive ?? 'hora');
    if (hasSearch) parts.push(filtersCopy?.searchFilterActive ?? 'búsqueda');
    return parts;
  }, [chipOptions, hasDateFilter, hasSearch, hasStatusFilter, hasTimeFilter, status]);

  const total = counts?.all ?? filteredTotal;
  const activeFilterCount =
    Number(hasStatusFilter) +
    Number(hasDateFilter) +
    Number(hasTimeFilter) +
    Number(hasSearch);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SearchBar
        value={safeSearch}
        onChangeText={onSearchChange}
        placeholder={filtersCopy?.searchPlaceholder ?? 'Buscar…'}
        accessibilityLabel={filtersCopy?.searchAccessibility ?? 'Buscar pagos'}
        clearAccessibilityLabel={filtersCopy?.clearSearch ?? 'Limpiar búsqueda'}
      />

      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((value) => !value)}
          style={styles.panelToggle}
        >
          <ThemedText variant="label">
            {filtersCopy?.advancedTitle ?? 'Fecha y hora'}
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </ThemedText>
          {expanded ? (
            <ChevronUp color={colors.textMuted} size={18} />
          ) : (
            <ChevronDown color={colors.textMuted} size={18} />
          )}
        </Pressable>

        {expanded ? (
          <View style={[styles.panelBody, { borderTopColor: colors.border }]}>
            <FilterRangeRow
              label={filtersCopy?.dateLabel ?? 'Fecha del pago'}
              fromValue={safeDateFrom}
              toValue={safeDateTo}
              fromPlaceholder={filtersCopy?.dateFromPlaceholder ?? 'Desde (AAAA-MM-DD)'}
              toPlaceholder={filtersCopy?.dateToPlaceholder ?? 'Hasta (AAAA-MM-DD)'}
              onFromChange={onDateFromChange}
              onToChange={onDateToChange}
            />
            <FilterRangeRow
              label={filtersCopy?.timeLabel ?? 'Hora del pago'}
              fromValue={safeTimeFrom}
              toValue={safeTimeTo}
              fromPlaceholder={filtersCopy?.timeFromPlaceholder ?? 'Desde (HH:MM)'}
              toPlaceholder={filtersCopy?.timeToPlaceholder ?? 'Hasta (HH:MM)'}
              onFromChange={onTimeFromChange}
              onToChange={onTimeToChange}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        ) : null}
      </View>

      <FilterChips options={chipOptions} value={status} onChange={onStatusChange} />

      <View style={styles.summaryRow}>
        <ThemedText variant="caption" muted style={styles.summary}>
          {filtersCopy?.resultCount?.(filteredTotal, total) ??
            `${filteredTotal} pagos`}
          {activeFilterParts.length > 0
            ? ` · ${filtersCopy?.activeFilters?.(activeFilterParts) ?? `Filtros: ${activeFilterParts.join(', ')}`}`
            : ''}
        </ThemedText>
        {isFiltering ? (
          <Pressable
            accessibilityRole="button"
            onPress={onClearFilters}
            style={[styles.clearButton, { borderColor: colors.border }]}
          >
            <ThemedText variant="caption" style={{ color: colors.primary }}>
              {filtersCopy?.clearFilters ?? 'Limpiar filtros'}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingBottom: spacing.sm },
  panel: {
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  panelToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  panelBody: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rangeBlock: { gap: spacing.xs },
  rangeLabel: { paddingHorizontal: spacing.xs },
  rangeRow: { flexDirection: 'row', gap: spacing.sm },
  rangeField: { flex: 1 },
  compactInput: {
    minHeight: 40,
    paddingVertical: spacing.xs,
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  summary: { flex: 1 },
  clearButton: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
});
