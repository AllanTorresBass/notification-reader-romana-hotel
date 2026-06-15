import { StyleSheet, View } from 'react-native';

import { spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { getSyncStepIndex } from '@/lib/utils/format-pago';

interface PaymentStatusStepperProps {
  syncStatus: string;
  invoiceStatus: 'pending' | 'paid' | null;
}

const STEPS = 3;

export function PaymentStatusStepper({ syncStatus, invoiceStatus }: PaymentStatusStepperProps) {
  const { colors } = useThemeColors();
  const activeStep = getSyncStepIndex(syncStatus, invoiceStatus);

  return (
    <View style={styles.row} accessibilityLabel={`Paso ${activeStep} de ${STEPS}`}>
      {Array.from({ length: STEPS }, (_, i) => {
        const step = i + 1;
        const active = step <= activeStep;
        return (
          <View
            key={step}
            style={[
              styles.dot,
              {
                backgroundColor: active ? colors.primary : colors.surfaceElevated,
                flex: 1,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  dot: { height: 4, borderRadius: 2 },
});
