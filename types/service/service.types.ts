export interface GymService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PaginatedServicesResponse {
  data: GymService[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
