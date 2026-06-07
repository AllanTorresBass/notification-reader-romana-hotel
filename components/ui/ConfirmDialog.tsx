import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { radius, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <ThemedText variant="title">{title}</ThemedText>
          <ThemedText variant="body" muted>
            {message}
          </ThemedText>
          <View style={styles.actions}>
            <Button label={cancelLabel} variant="outline" onPress={onCancel} style={styles.btn} />
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              style={styles.btn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    borderWidth: 1,
    borderRadius: radius['2xl'],
    padding: spacing.lg,
    gap: spacing.md,
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  btn: { flex: 1 },
});
