import { BaseApiClient } from '@/lib/api-client/base/BaseApiClient';

export interface RemotePaymentRegister {
  id: string;
  name: string | null;
  pago: string;
  mobile: string;
  invoiceId: string | null;
  notificationKey: string | null;
  invoiceStatus: 'pending' | 'paid' | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegisterResponse {
  register: RemotePaymentRegister;
  invoiceId: string;
}

export interface RegisterListResponse {
  data: RemotePaymentRegister[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PaymentRegisterApiService extends BaseApiClient {
  async create(input: {
    name: string | null;
    pago: string;
    mobile: string;
    notificationKey: string;
  }): Promise<CreateRegisterResponse> {
    return this.request<CreateRegisterResponse>('/api/v1/payment-registers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async list(page = 1, limit = 50): Promise<RegisterListResponse> {
    return this.request<RegisterListResponse>(
      `/api/v1/payment-registers?page=${page}&limit=${limit}`
    );
  }

  async confirmPayment(
    id: string,
    input: { reference: string; paymentDate: string; paymentTime: string }
  ): Promise<RemotePaymentRegister> {
    return this.request<RemotePaymentRegister>(
      `/api/v1/payment-registers/${id}/confirm-payment`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
  }

  async assignClient(id: string, clientId: string): Promise<RemotePaymentRegister> {
    return this.request<RemotePaymentRegister>(
      `/api/v1/payment-registers/${id}/assign-client`,
      {
        method: 'PATCH',
        body: JSON.stringify({ clientId }),
      }
    );
  }
}

export const paymentRegisterApiService = new PaymentRegisterApiService();
