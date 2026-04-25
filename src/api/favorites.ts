import { PaginatedResponse, Property } from '../types';
import apiClient from './client';

export const favoritesApi = {
  list: (page = 1) =>
    apiClient.get<PaginatedResponse<Property>>('/favorites', { params: { page } }),

  toggle: (propertyId: number) =>
    apiClient.post<{ success: boolean; data: { favorited: boolean; message: string } }>(
      `/favorites/${propertyId}/toggle`
    ),
};
