import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { Card } from '@/components/ui/Card';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { normalizePagoAmount } from '@/lib/utils/bdv-pagomovil-parser';

interface ManualRegisterFormProps {
  name: string;
  pago: string;
  mobile: string;
  ref: string;
  paymentDate: string;
  paymentTime: string;
  onChangeName: (v: string) => void;
  onChangePago: (v: string) => void;
  onChangeMobile: (v: string) => void;
  onChangeRef: (v: string) => void;
  onChangePaymentDate: (v: string) => void;
  onChangePaymentTime: (v: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  isSubmitting: boolean;
}

export function ManualRegisterForm({
  name,
  pago,
  mobile,
  ref: reference,
  paymentDate,
  paymentTime,
  onChangeName,
  onChangePago,
  onChangeMobile,
  onChangeRef,
  onChangePaymentDate,
  onChangePaymentTime,
  onSubmit,
  onCancel,
  isSubmitting,
}: ManualRegisterFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!pago.trim()) errors.pago = 'Ingresa el monto.';
    else {
      try {
        normalizePagoAmount(pago);
      } catch {
        errors.pago = 'Monto inválido. Ejemplo: 15000,00';
      }
    }
    if (!mobile.trim()) errors.mobile = 'Ingresa el teléfono emisor.';
    if (!reference.trim()) errors.ref = 'Ingresa la referencia.';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    onSubmit();
  };

  const canSubmit = useMemo(
    () => Boolean(pago.trim() && mobile.trim() && reference.trim()),
    [pago, mobile, reference]
  );

  return (
    <Card style={styles.form}>
      <ThemedText variant="title">{copy.pagos.manualRegisterHeader}</ThemedText>
      <TextInput
        value={name}
        onChangeText={onChangeName}
        placeholder="Nombre (opcional)"
        label="Nombre"
      />
      <TextInput
        value={pago}
        onChangeText={(v) => {
          onChangePago(v);
          setFieldErrors((prev) => ({ ...prev, pago: '' }));
        }}
        placeholder="Monto (Bs.)"
        label="Monto"
        keyboardType="decimal-pad"
        error={fieldErrors.pago}
      />
      <TextInput
        value={mobile}
        onChangeText={(v) => {
          onChangeMobile(v);
          setFieldErrors((prev) => ({ ...prev, mobile: '' }));
        }}
        placeholder="Tel. emisor"
        label="Teléfono emisor"
        keyboardType="phone-pad"
        error={fieldErrors.mobile}
      />
      <TextInput
        value={reference}
        onChangeText={(v) => {
          onChangeRef(v);
          setFieldErrors((prev) => ({ ...prev, ref: '' }));
        }}
        placeholder="Referencia"
        label="Referencia"
        error={fieldErrors.ref}
      />
      <TextInput
        value={paymentDate}
        onChangeText={onChangePaymentDate}
        placeholder="Fecha (YYYY-MM-DD)"
        label="Fecha"
      />
      <TextInput
        value={paymentTime}
        onChangeText={onChangePaymentTime}
        placeholder="Hora (HH:MM)"
        label="Hora"
      />
      <PrimaryButton
        label={isSubmitting ? 'Guardando…' : 'Registrar pago'}
        onPress={handleSubmit}
        disabled={isSubmitting || !canSubmit}
      />
      {onCancel ? (
        <PrimaryButton
          label={copy.pagos.cancelManual}
          variant="secondary"
          onPress={onCancel}
          disabled={isSubmitting}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  form: { marginHorizontal: spacing.md, padding: spacing.md, gap: spacing.sm },
});
