import { z } from 'zod';

import { recordPaymentSchema } from '@/types/payment/payment.schemas';

export const invoiceStatusEnum = z.enum([
  'draft',
  'pending',
  'paid',
  'cancelled',
  'overdue',
]);

export const invoiceLineItemInputSchema = z.object({
  serviceId: z.string().min(1, 'El servicio es obligatorio'),
  serviceName: z.string().min(1, 'El nombre del servicio es obligatorio'),
  description: z.string().nullable().optional(),
  quantity: z.number().min(1, 'La cantidad debe ser al menos 1'),
  unitPrice: z.number().min(0, 'El precio debe ser positivo'),
});

export const invoiceCreateSchema = z
  .object({
    clientId: z.string().min(1, 'El cliente es obligatorio'),
    issueDate: z.string().optional(),
    dueDate: z.string().optional(),
    taxRate: z.number().min(0).max(100).default(0),
    discount: z.number().min(0).default(0),
    currency: z.string().default('USD'),
    notes: z.string().nullable().optional(),
    status: invoiceStatusEnum.default('draft'),
    payment: recordPaymentSchema.optional(),
    lineItems: z.array(invoiceLineItemInputSchema).min(1, 'Agrega al menos un artículo'),
  })
  .superRefine((data, ctx) => {
    const subtotal = data.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    if (data.discount > subtotal) {
      ctx.addIssue({
        code: 'custom',
        message: 'El descuento no puede superar el subtotal',
        path: ['discount'],
      });
    }
    if (data.status === 'paid' && !data.payment) {
      ctx.addIssue({
        code: 'custom',
        message: 'Los datos de pago son obligatorios',
        path: ['payment'],
      });
    }
    if (data.payment && data.status !== 'paid') {
      ctx.addIssue({
        code: 'custom',
        message: 'El estado debe ser pagada cuando hay datos de pago',
        path: ['status'],
      });
    }
    if (data.status === 'cancelled' || data.status === 'overdue') {
      ctx.addIssue({
        code: 'custom',
        message: 'Estado inválido para una factura nueva',
        path: ['status'],
      });
    }
  });

export type InvoiceStatus = z.infer<typeof invoiceStatusEnum>;
export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemInputSchema>;
export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;

export type InvoiceListParamsInput = {
  search?: string;
  status?: InvoiceStatus;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};
