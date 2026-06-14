import { useCallback, useEffect, useMemo, useState } from 'react';

import type { RemoteClient } from '@/lib/api-client/clients/ClientApiService';
import {
  buildCreatePayload,
  buildLineItemFromService,
  computeInvoiceTotals,
  defaultPaymentTypeForCurrency,
  getDefaultDates,
  getDefaultPaymentValues,
} from '@/lib/invoices/invoice-draft';
import {
  paymentFormSchema,
  toRecordPaymentInput,
  type PaymentFormValues,
} from '@/types/payment/payment.schemas';
import { isPagoMovil, type PaymentType } from '@/types/payment/payment.types';
import type { InvoiceLineItemInput } from '@/types/invoice/invoice.schemas';
import { useCreateInvoiceMutation } from '@/hooks/use-invoices';
import { useActiveGymServicesQuery } from '@/hooks/use-gym-services';
import { copy } from '@/constants/copy';

import type {
  InvoiceSetupErrors,
  InvoiceWizardStep,
} from '@/types/invoice/invoice-wizard.types';
export function useInvoiceWizard() {
  const createInvoice = useCreateInvoiceMutation();
  const { data: services } = useActiveGymServicesQuery();

  const [step, setStep] = useState<InvoiceWizardStep>('setup');
  const [selectedClient, setSelectedClient] = useState<RemoteClient | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType | ''>('');
  const [lineItems, setLineItems] = useState<InvoiceLineItemInput[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState<PaymentFormValues>(getDefaultPaymentValues());
  const [setupErrors, setSetupErrors] = useState<InvoiceSetupErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const refreshDates = useCallback(() => {
    const { today, dueDate: defaultDue } = getDefaultDates();
    setIssueDate(today);
    setDueDate(defaultDue);
    setPayment((prev) => ({
      ...prev,
      paymentDate: today,
      paymentTime: new Date().toTimeString().slice(0, 5),
    }));
  }, []);

  const resetState = useCallback(() => {
    setStep('setup');
    setSelectedClient(null);
    setSelectedServiceId('');
    setPaymentType('');
    setLineItems([]);
    setCurrency('USD');
    setTaxRate(0);
    setDiscount(0);
    setNotes('');
    setPayment(getDefaultPaymentValues());
    setSetupErrors({});
    setSubmitError(null);
    setIsDirty(false);
    refreshDates();
  }, [refreshDates]);

  useEffect(() => {
    refreshDates();
  }, [refreshDates]);

  const markDirty = () => setIsDirty(true);

  const handleClientSelect = (client: RemoteClient | null) => {
    setSelectedClient(client);
    markDirty();
    if (setupErrors.client) {
      setSetupErrors((e) => ({ ...e, client: undefined }));
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    markDirty();
    const service = services?.find((s) => s.id === serviceId);
    if (service) {
      setCurrency(service.currency);
      const defaultPayment = defaultPaymentTypeForCurrency(service.currency);
      setPaymentType(defaultPayment);
      setPayment((prev) => ({ ...prev, paymentType: defaultPayment }));
      setLineItems([buildLineItemFromService(service, lineItems[0]?.quantity ?? 1)]);
    }
    if (setupErrors.service) {
      setSetupErrors((e) => ({ ...e, service: undefined }));
    }
  };

  const handlePaymentTypeChange = (type: PaymentType) => {
    setPaymentType(type);
    markDirty();
    setPayment((prev) => ({ ...prev, paymentType: type }));
    if (setupErrors.payment) {
      setSetupErrors((e) => ({ ...e, payment: undefined }));
    }
  };

  const handlePaymentChange = (values: PaymentFormValues) => {
    markDirty();
    setPayment(values);
    setSetupErrors((e) => ({
      ...e,
      reference: undefined,
      paymentDate: undefined,
      paymentTime: undefined,
    }));
  };

  const handleQuantityChange = (quantity: number) => {
    if (quantity < 1 || lineItems.length === 0) return;
    markDirty();
    setLineItems([{ ...lineItems[0], quantity }]);
  };

  const validateSetup = (): boolean => {
    const errors: InvoiceSetupErrors = {};
    if (!selectedClient) errors.client = copy.facturas.errors.clientRequired;
    if (!selectedServiceId) errors.service = copy.facturas.errors.serviceRequired;
    if (!paymentType) errors.payment = copy.facturas.errors.paymentRequired;

    if (paymentType && isPagoMovil(paymentType)) {
      const paymentResult = paymentFormSchema.safeParse(payment);
      if (!paymentResult.success) {
        for (const issue of paymentResult.error.issues) {
          const field = issue.path[0];
          if (field === 'reference') errors.reference = issue.message;
          if (field === 'paymentDate') errors.paymentDate = issue.message;
          if (field === 'paymentTime') errors.paymentTime = issue.message;
        }
      }
    }

    setSetupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = () => {
    refreshDates();
    if (!validateSetup()) return;
    setStep('review');
    setSubmitError(null);
  };

  const validateReview = (): boolean => {
    if (paymentType && isPagoMovil(paymentType)) {
      const paymentResult = paymentFormSchema.safeParse(payment);
      if (!paymentResult.success) {
        setSubmitError(copy.facturas.errors.paymentDetailsRequired);
        return false;
      }
    }
    const totals = computeInvoiceTotals(lineItems, taxRate, discount);
    if (discount > totals.subtotal) {
      setSubmitError(copy.facturas.errors.discountExceedsSubtotal);
      return false;
    }
    setSubmitError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedClient || lineItems.length === 0 || !paymentType) return;
    if (!validateReview()) return;

    const paymentResult = paymentFormSchema.safeParse(payment);
    if (!paymentResult.success) return;

    const payload = buildCreatePayload({
      clientId: selectedClient.id,
      issueDate,
      dueDate,
      taxRate,
      discount,
      currency,
      notes: notes.trim() || null,
      lineItems,
      status: 'paid',
      payment: toRecordPaymentInput(paymentResult.data),
    });

    return createInvoice.mutateAsync(payload);
  };

  const requestDiscard = () => {
    if (isDirty) {
      setDiscardOpen(true);
      return true;
    }
    return false;
  };

  const confirmDiscard = () => {
    setDiscardOpen(false);
    resetState();
  };

  const totals = useMemo(
    () => computeInvoiceTotals(lineItems, taxRate, discount),
    [lineItems, taxRate, discount]
  );

  const canContinue = !!selectedClient && !!selectedServiceId && !!paymentType;
  const selectedService = services?.find((s) => s.id === selectedServiceId);

  return {
    step,
    setStep,
    selectedClient,
    selectedService,
    selectedServiceId,
    paymentType,
    lineItems,
    currency,
    issueDate,
    dueDate,
    taxRate,
    discount,
    notes,
    payment,
    setupErrors,
    submitError,
    discardOpen,
    setDiscardOpen,
    createInvoice,
    services,
    handleClientSelect,
    handleServiceSelect,
    handlePaymentTypeChange,
    handlePaymentChange,
    handleQuantityChange,
    setIssueDate,
    setDueDate,
    setTaxRate,
    setDiscount,
    setNotes,
    handleContinue,
    handleSubmit,
    requestDiscard,
    confirmDiscard,
    resetState,
    totals,
    canContinue,
    isDirty,
  };
}
