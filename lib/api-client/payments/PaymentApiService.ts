import { BaseApiClient } from '@/lib/api-client/base/BaseApiClient';

export interface RemotePayment {
  id: number;
  userId: string;
  reference: string;
  amount: string;
  payerName: string | null;
  payerPhone: string | null;
  bank: string | null;
  status: 'confirmado' | 'pendiente' | 'rechazado';
  paymentDate: string;
  paymentTime: string;
  notes: string | null;
  notificationKey: string | null;
  source: 'web' | 'mobile';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreatePaymentInput {
  reference: string;
  amount: string;
  payerName?: string | null;
  payerPhone?: string;
  bank?: string;
  status: 'confirmado' | 'pendiente' | 'rechazado';
  paymentDate: string;
  paymentTime: string;
  notificationKey: string;
  source: 'mobile';
}

export interface UpdatePaymentInput {
  reference: string;
  amount: string;
  payerName?: string | null;
  payerPhone?: string;
  bank?: string;
  status: 'confirmado' | 'pendiente' | 'rechazado';
  paymentDate: string;
  paymentTime: string;
  notes?: string;
  notificationKey?: string;
  source?: 'mobile';
}

export class PaymentApiService extends BaseApiClient {
  async create(input: CreatePaymentInput): Promise<RemotePayment> {
    return this.request<RemotePayment>('/api/v1/payments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async list(): Promise<RemotePayment[]> {
    return this.request<RemotePayment[]>('/api/v1/payments');
  }

  async update(id: number, input: UpdatePaymentInput): Promise<RemotePayment> {
    return this.request<RemotePayment>(`/api/v1/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }
}

export const paymentApiService = new PaymentApiService();
