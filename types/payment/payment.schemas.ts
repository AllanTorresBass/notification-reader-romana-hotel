import { z } from 'zod';

const paymentTypeEnum = z.enum(['efectivo_bs', 'efectivo_usd', 'pago_movil']);

export const recordPaymentSchema = z.discriminatedUnion('paymentType', [
  z.object({
    paymentType: z.literal('efectivo_bs'),
  }),
  z.object({
    paymentType: z.literal('efectivo_usd'),
  }),
  z.object({
    paymentType: z.literal('pago_movil'),
    reference: z.string().min(1, 'La referencia es obligatoria'),
    paymentDate: z.string().min(1, 'La fecha de pago es obligatoria'),
    paymentTime: z.string().min(1, 'La hora de pago es obligatoria'),
  }),
]);

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const paymentFormSchema = z
  .object({
    paymentType: paymentTypeEnum,
    reference: z.string().optional(),
    paymentDate: z.string().optional(),
    paymentTime: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentType === 'pago_movil') {
      if (!data.reference?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'La referencia es obligatoria',
          path: ['reference'],
        });
      }
      if (!data.paymentDate?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'La fecha de pago es obligatoria',
          path: ['paymentDate'],
        });
      }
      if (!data.paymentTime?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'La hora de pago es obligatoria',
          path: ['paymentTime'],
        });
      }
    }
  });

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export function toRecordPaymentInput(data: PaymentFormValues): RecordPaymentInput {
  if (data.paymentType === 'pago_movil') {
    return {
      paymentType: 'pago_movil',
      reference: data.reference!.trim(),
      paymentDate: data.paymentDate!,
      paymentTime: data.paymentTime!,
    };
  }
  return { paymentType: data.paymentType };
}
