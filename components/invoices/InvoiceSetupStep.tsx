import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { FeedbackInline } from '@/components/feedback/FeedbackInline';
import { FilterChips } from '@/components/shared/FilterChips';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { radius, spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { InvoiceSetupErrors } from '@/types/invoice/invoice-wizard.types';
import type { RemoteClient } from '@/lib/api-client/clients/ClientApiService';
import { formatCurrency } from '@/lib/utils/format-invoice';
import { defaultPaymentTypeForCurrency } from '@/lib/invoices/invoice-draft';
import type { PaymentFormValues } from '@/types/payment/payment.schemas';
import { PAYMENT_TYPES, isPagoMovil, type PaymentType } from '@/types/payment/payment.types';
import type { GymService } from '@/types/service/service.types';

import { ClientPickerSection } from './ClientPickerSection';

interface InvoiceSetupStepProps {
  selectedClient: RemoteClient | null;
  onClientSelect: (client: RemoteClient | null) => void;
  selectedServiceId: string;
  onServiceSelect: (serviceId: string) => void;
  services: GymService[] | undefined;
  servicesLoading: boolean;
  paymentType: PaymentType | '';
  onPaymentTypeChange: (type: PaymentType) => void;
  payment: PaymentFormValues;
  onPaymentChange: (payment: PaymentFormValues) => void;
  errors: InvoiceSetupErrors;
}

export function InvoiceSetupStep({
  selectedClient,
  onClientSelect,
  selectedServiceId,
  onServiceSelect,
  services,
  servicesLoading,
  paymentType,
  onPaymentTypeChange,
  payment,
  onPaymentChange,
  errors,
}: InvoiceSetupStepProps) {
  const { colors } = useThemeColors();
  const activeServices = services ?? [];
  const selectedService = activeServices.find((s) => s.id === selectedServiceId);
  const showPagoMovil = paymentType && isPagoMovil(paymentType);

  const updatePayment = (partial: Partial<PaymentFormValues>) => {
    onPaymentChange({ ...payment, ...partial });
  };

  return (
    <View style={styles.container}>
      <ClientPickerSection
        selectedClient={selectedClient}
        onSelect={onClientSelect}
        error={errors.client}
      />

      <View style={styles.section}>
        <ThemedText variant="label" muted>
          {copy.facturas.fields.service}
        </ThemedText>
        {servicesLoading ? (
          <SkeletonCard />
        ) : activeServices.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <ThemedText variant="body" muted>
              {copy.facturas.shortcut.noServices}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.serviceList}>
            {activeServices.map((service) => {
              const selected = service.id === selectedServiceId;
              return (
                <Pressable
                  key={service.id}
                  onPress={() => onServiceSelect(service.id)}
                  style={[
                    styles.serviceRow,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primaryMuted : colors.surface,
                    },
                  ]}
                >
                  <ThemedText variant="body">{service.name}</ThemedText>
                  <ThemedText variant="mono" style={{ color: selected ? colors.primary : colors.textMuted }}>
                    {formatCurrency(service.price, service.currency)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}
        {errors.service ? <FeedbackInline message={errors.service} tone="error" compact /> : null}
      </View>

      {selectedServiceId ? (
        <View style={styles.section}>
          <ThemedText variant="label" muted>
            {copy.facturas.fields.paymentMethod}
          </ThemedText>
          <FilterChips
            options={PAYMENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            value={(paymentType || defaultPaymentTypeForCurrency(selectedService?.currency ?? 'USD')) as PaymentType}
            onChange={(v) => onPaymentTypeChange(v as PaymentType)}
          />
          {errors.payment ? (
            <FeedbackInline message={errors.payment} tone="error" compact />
          ) : null}
          <ThemedText variant="caption" muted>
            {copy.facturas.shortcut.payImmediatelyHelp}
          </ThemedText>
        </View>
      ) : null}

      {showPagoMovil ? (
        <View style={[styles.pagoBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <ThemedText variant="label">{copy.facturas.fields.paymentDetails}</ThemedText>
          <TextInput
            label={copy.facturas.fields.reference}
            placeholder={copy.pagos.detail.reference}
            value={payment.reference ?? ''}
            onChangeText={(reference) => updatePayment({ reference })}
            error={errors.reference}
          />
          <TextInput
            label={copy.facturas.fields.paymentDate}
            placeholder="YYYY-MM-DD"
            value={payment.paymentDate ?? ''}
            onChangeText={(paymentDate) => updatePayment({ paymentDate })}
            error={errors.paymentDate}
          />
          <TextInput
            label={copy.facturas.fields.paymentTime}
            placeholder="HH:MM"
            value={payment.paymentTime ?? ''}
            onChangeText={(paymentTime) => updatePayment({ paymentTime })}
            error={errors.paymentTime}
          />
        </View>
      ) : null}

      {selectedClient && selectedService && paymentType ? (
        <View style={styles.chips}>
          <View style={[styles.chip, { backgroundColor: colors.surfaceElevated }]}>
            <ThemedText variant="caption">{selectedClient.fullName}</ThemedText>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.surfaceElevated }]}>
            <ThemedText variant="caption">{selectedService.name}</ThemedText>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.primaryMuted }]}>
            <ThemedText variant="caption" style={{ color: colors.primary }}>
              {PAYMENT_TYPES.find((p) => p.value === paymentType)?.label}
            </ThemedText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  section: { gap: spacing.sm },
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  serviceList: { gap: spacing.xs },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pagoBox: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
