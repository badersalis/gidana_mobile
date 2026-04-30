import apiClient from './client';

export interface AlertInput {
  neighborhood?: string;
  property_type?: string;
  min_rooms?: number;
  max_price?: number;
  transaction_type?: string;
}

export const alertsApi = {
  getAll: () => apiClient.get('/alerts'),
  create: (data: AlertInput) => apiClient.post('/alerts', data),
  update: (id: number, data: Partial<AlertInput & { is_active: boolean }>) =>
    apiClient.put(`/alerts/${id}`, data),
  delete: (id: number) => apiClient.delete(`/alerts/${id}`),
};
