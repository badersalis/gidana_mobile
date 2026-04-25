import { ApiResponse, Wallet } from '../types';
import apiClient from './client';

export interface CreateWalletData {
  provider: string;
  nature?: string;
  phone_number?: string;
  email?: string;
  card_number?: string;
  cvv?: string;
  expiration_date?: string;
  password?: string;
  currency?: string;
  selected?: boolean;
}

export const walletApi = {
  list: () => apiClient.get<ApiResponse<Wallet[]>>('/wallets'),

  create: (data: CreateWalletData) => apiClient.post<ApiResponse<Wallet>>('/wallets', data),

  update: (id: number, data: Partial<CreateWalletData>) =>
    apiClient.put<ApiResponse<Wallet>>(`/wallets/${id}`, data),

  delete: (id: number) => apiClient.delete(`/wallets/${id}`),

  select: (id: number) => apiClient.patch(`/wallets/${id}/select`),

  refreshBalance: (id: number) =>
    apiClient.post<ApiResponse<{ balance: number; currency: string }>>(
      `/wallets/${id}/refresh-balance`
    ),
};
