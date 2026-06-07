import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InvoiceReviewStep } from '@/components/invoices/InvoiceReviewStep';
import { InvoiceSetupStep } from '@/components/invoices/InvoiceSetupStep';
import { InvoiceStepIndicator } from '@/components/invoices/InvoiceStepIndicator';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { useActiveGymServicesQuery } from '@/hooks/use-gym-services';
import { useInvoiceWizard } from '@/hooks/use-invoice-wizard';
import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  formatCreateInvoiceOutcome,
  formatErrorOutcome,
} from '@/lib/feedback/format-operation-outcome';
import { reportOutcomeWithPolicy } from '@/lib/feedback/report-feedback';
import type { OperationOutcome } from '@/types/feedback/operation-outcome.types';
import type { PaymentType } from '@/types/payment/payment.types';

const SUCCESS_NAV_DELAY_MS = 1600;

export default function NewInvoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const { data: services, isLoading: servicesLoading } = useActiveGymServicesQuery();
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wizard = useInvoiceWizard();
  const [actionFeedback, setActionFeedback] = useState<OperationOutcome | null>(null);

  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);
    };
  }, []);

  const handleBack = useCallback(() => {
    if (wizard.step === 'review') {
      wizard.setStep('setup');
      return;
    }
    if (wizard.requestDiscard()) return;
    router.back();
  }, [wizard, router]);

  const handleCancel = useCallback(() => {
    if (wizard.requestDiscard()) return;
    router.back();
  }, [wizard, router]);

  const handleConfirmDiscard = useCallback(() => {
    wizard.confirmDiscard();
    router.back();
  }, [wizard, router]);

  const handleSubmit = useCallback(async () => {
    setActionFeedback(null);
    try {
      const created = await wizard.handleSubmit();
      if (!created) return;

      const outcome = formatCreateInvoiceOutcome(created);
      setActionFeedback(outcome);
      reportOutcomeWithPolicy(outcome, { anchor: 'form' });

      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);
      navigateTimerRef.current = setTimeout(() => {
        navigateTimerRef.current = null;
        wizard.resetState();
        router.replace(`/invoices/${created.id}`);
      }, SUCCESS_NAV_DELAY_MS);
    } catch (error) {
      const outcome = formatErrorOutcome(
        'create_invoice',
        error,
        copy.facturas.createError
      );
      setActionFeedback(outcome);
      reportOutcomeWithPolicy(outcome, { anchor: 'form' });
    }
  }, [wizard, router]);

  const handleContinue = useCallback(() => {
    setActionFeedback(null);
    wizard.handleContinue();
  }, [wizard]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);

  const quantity = wizard.lineItems[0]?.quantity ?? 1;
  const isNavigatingAfterSuccess = actionFeedback?.status === 'completed';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: copy.facturas.shortcut.title,
          headerBackTitle: copy.tabs.facturas,
        }}
      />
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + spacing.xl + 80 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <ThemedText variant="subtitle" muted>
              {copy.facturas.shortcut.description}
            </ThemedText>
            <InvoiceStepIndicator
              step={wizard.step}
              setupLabel={copy.facturas.shortcut.steps.setup}
              reviewLabel={copy.facturas.shortcut.steps.review}
            />
          </View>

          {wizard.step === 'setup' ? (
            <InvoiceSetupStep
              selectedClient={wizard.selectedClient}
              onClientSelect={wizard.handleClientSelect}
              selectedServiceId={wizard.selectedServiceId}
              onServiceSelect={wizard.handleServiceSelect}
              services={services}
              servicesLoading={servicesLoading}
              paymentType={wizard.paymentType}
              onPaymentTypeChange={wizard.handlePaymentTypeChange}
              payment={wizard.payment}
              onPaymentChange={wizard.handlePaymentChange}
              errors={wizard.setupErrors}
            />
          ) : wizard.selectedClient && wizard.paymentType ? (
            <InvoiceReviewStep
              client={wizard.selectedClient}
              lineItems={wizard.lineItems}
              issueDate={wizard.issueDate}
              dueDate={wizard.dueDate}
              currency={wizard.currency}
              subtotal={wizard.totals.subtotal}
              taxAmount={wizard.totals.taxAmount}
              total={wizard.totals.total}
              payment={wizard.payment}
              paymentType={wizard.paymentType as PaymentType}
              quantity={quantity}
              taxRate={wizard.taxRate}
              discount={wizard.discount}
              notes={wizard.notes}
              onQuantityChange={wizard.handleQuantityChange}
              onIssueDateChange={wizard.setIssueDate}
              onDueDateChange={wizard.setDueDate}
              onTaxRateChange={wizard.setTaxRate}
              onDiscountChange={wizard.setDiscount}
              onNotesChange={wizard.setNotes}
              onPaymentChange={wizard.handlePaymentChange}
              submitError={wizard.submitError}
              actionFeedback={actionFeedback}
            />
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + spacing.sm,
            },
          ]}
        >
          <View style={styles.footerActions}>
            {wizard.step === 'review' ? (
              <Pressable onPress={handleBack} style={styles.secondaryBtn} disabled={isNavigatingAfterSuccess}>
                <ThemedText variant="label" style={{ color: colors.text }}>
                  {copy.facturas.shortcut.back}
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable onPress={handleCancel} style={styles.secondaryBtn}>
                <ThemedText variant="label" style={{ color: colors.text }}>
                  {copy.facturas.shortcut.cancel}
                </ThemedText>
              </Pressable>
            )}

            {wizard.step === 'setup' ? (
              <PrimaryButton
                label={copy.facturas.shortcut.continue}
                onPress={handleContinue}
                disabled={!wizard.canContinue}
                style={styles.primaryBtn}
              />
            ) : (
              <PrimaryButton
                label={
                  wizard.createInvoice.isPending
                    ? copy.facturas.shortcut.creating
                    : isNavigatingAfterSuccess
                      ? copy.facturas.shortcut.openingInvoice
                      : copy.facturas.shortcut.createPaid
                }
                onPress={() => void handleSubmit()}
                disabled={wizard.createInvoice.isPending || isNavigatingAfterSuccess}
                loading={wizard.createInvoice.isPending || isNavigatingAfterSuccess}
                style={styles.primaryBtn}
              />
            )}
          </View>
        </View>

        <ConfirmDialog
          visible={wizard.discardOpen}
          title={copy.facturas.shortcut.discardTitle}
          message={copy.facturas.shortcut.discardDescription}
          confirmLabel={copy.facturas.shortcut.discardConfirm}
          destructive
          onConfirm={handleConfirmDiscard}
          onCancel={() => wizard.setDiscardOpen(false)}
        />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  header: { gap: spacing.xs },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  secondaryBtn: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  primaryBtn: { flex: 1 },
});
