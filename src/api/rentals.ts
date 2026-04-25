import { ApiResponse, Rental } from '../types';
import apiClient from './client';

export const rentalApi = {
  myRentals: () => apiClient.get<ApiResponse<Rental[]>>('/rentals'),

  create: (data: {
    property_id: number;
    start_date: string;
    end_date?: string;
    monthly_price: number;
  }) => apiClient.post<ApiResponse<Rental>>('/rentals', data),

  updateStatus: (id: number, status: string) =>
    apiClient.patch(`/rentals/${id}/status`, { status }),
};
