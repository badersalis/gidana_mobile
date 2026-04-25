import { ApiResponse, PaginatedResponse, Transaction } from '../types';
import apiClient from './client';

export const transactionApi = {
  list: (page = 1) =>
    apiClient.get<PaginatedResponse<Transaction>>('/transactions', { params: { page } }),

  payService: (data: {
    service: string;
    service_provider: string;
    plan?: string;
    wallet_id: number;
    amount?: number;
  }) =>
    apiClient.post<ApiResponse<{ message: string; amount: number; new_balance: number; transaction_id: number }>>(
      '/transactions/pay-service',
      data
    ),

  transfer: (data: {
    wallet_id: number;
    recipient: string;
    amount: number;
    provider: string;
  }) =>
    apiClient.post<ApiResponse<{ message: string; amount: number; new_balance: number; transaction_id: number }>>(
      '/transactions/transfer',
      data
    ),
};
