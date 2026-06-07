import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Cloud,
  CloudOff,
  Info,
  XCircle,
} from 'lucide-react-native';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { useActivityLogPanel } from '@/hooks/use-activity-log';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { OperationStatus } from '@/types/feedback/operation-outcome.types';

function StatusIcon({ status, color }: { status: OperationStatus; color: string }) {
  const size = 16;
  if (status === 'completed') return <CheckCircle color={color} size={size} />;
  if (status === 'failed') return <XCircle color={color} size={size} />;
  if (status === 'queued') return <Clock color={color} size={size} />;
  if (status === 'partial' || status === 'skipped') return <AlertTriangle color={color} size={size} />;
  return <Info color={color} size={size} />;
}

function statusColor(status: OperationStatus, colors: ReturnType<typeof useThemeColors>['colors']) {
  if (status === 'completed') return colors.success;
  if (status === 'failed') return colors.danger;
  if (status === 'queued') return colors.warning;
  if (status === 'partial') return colors.warning;
  return colors.textMuted;
}

export function ActivityLogPanel() {
  const { colors } = useThemeColors();
  const {
    expanded,
    setExpanded,
    entries,
    sourceLabel,
    isLoading,
    clearAll,
    refresh,
  } = useActivityLogPanel();

  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          const next = !expanded;
          setExpanded(next);
          if (next) void refresh();
        }}
        style={styles.headerRow}
      >
        <CardHeader title="Actividad reciente" description={sourceLabel} />
        {expanded ? (
          <ChevronUp color={colors.textMuted} size={20} />
        ) : (
          <ChevronDown color={colors.textMuted} size={20} />
        )}
      </Pressable>
      {expanded ? (
        <CardContent>
          {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
          {!isLoading && entries.length === 0 ? (
            <ThemedText variant="caption" muted>
              {copy.feedback.noActivity}
            </ThemedText>
          ) : null}
          {entries.map((entry) => (
            <View key={entry.id} style={[styles.row, { borderColor: colors.border }]}>
              <StatusIcon
                status={entry.outcome.status}
                color={statusColor(entry.outcome.status, colors)}
              />
              <View style={styles.rowText}>
                <View style={styles.titleRow}>
                  <ThemedText variant="label">{entry.outcome.title}</ThemedText>
                  {entry.synced ? (
                    <Cloud color={colors.success} size={14} />
                  ) : (
                    <CloudOff color={colors.textMuted} size={14} />
                  )}
                </View>
                <ThemedText variant="caption" muted numberOfLines={2}>
                  {entry.outcome.message}
                </ThemedText>
                <ThemedText variant="caption" muted>
                  {new Date(entry.timestamp).toLocaleString('es-VE')}
                </ThemedText>
              </View>
            </View>
          ))}
          {entries.length > 0 ? (
            <PrimaryButton
              label={copy.feedback.clearActivity}
              variant="secondary"
              onPress={() => void clearAll()}
            />
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
  },
  rowText: { flex: 1, gap: 2 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
