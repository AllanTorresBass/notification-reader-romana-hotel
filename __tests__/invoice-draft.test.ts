import {
  buildCreatePayload,
  buildLineItemFromService,
  computeInvoiceTotals,
  defaultPaymentTypeForCurrency,
  getDefaultDates,
} from '@/lib/invoices/invoice-draft';
import type { GymService } from '@/types/service/service.types';

const sampleService: GymService = {
  id: 'svc-1',
  name: 'Membresía mensual',
  description: 'Acceso al gimnasio',
  price: 50,
  currency: 'USD',
  category: 'membership',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  deletedAt: null,
};

describe('invoice-draft', () => {
  it('computes totals with tax and discount', () => {
    const lineItems = [buildLineItemFromService(sampleService, 2)];
    const totals = computeInvoiceTotals(lineItems, 16, 5);
    expect(totals.subtotal).toBe(100);
    expect(totals.taxAmount).toBe(16);
    expect(totals.total).toBe(111);
  });

  it('builds line item from service', () => {
    const item = buildLineItemFromService(sampleService, 1);
    expect(item.serviceId).toBe('svc-1');
    expect(item.serviceName).toBe('Membresía mensual');
    expect(item.unitPrice).toBe(50);
    expect(item.quantity).toBe(1);
  });

  it('defaults payment type from currency', () => {
    expect(defaultPaymentTypeForCurrency('USD')).toBe('efectivo_usd');
    expect(defaultPaymentTypeForCurrency('VES')).toBe('efectivo_bs');
  });

  it('builds paid invoice payload', () => {
    const { today, dueDate } = getDefaultDates();
    const payload = buildCreatePayload({
      clientId: 'client-1',
      issueDate: today,
      dueDate,
      taxRate: 0,
      discount: 0,
      currency: 'USD',
      notes: null,
      lineItems: [buildLineItemFromService(sampleService)],
      status: 'paid',
      payment: { paymentType: 'efectivo_usd' },
    });

    expect(payload.status).toBe('paid');
    expect(payload.clientId).toBe('client-1');
    expect(payload.lineItems).toHaveLength(1);
    expect(payload.payment?.paymentType).toBe('efectivo_usd');
  });
});
