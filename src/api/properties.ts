import { ApiResponse, PaginatedResponse, Property, Review } from '../types';
import apiClient from './client';

export const propertyApi = {
  list: (params?: {
    page?: number;
    q?: string;
    property_type?: string;
    transaction_type?: string;
  }) => apiClient.get<PaginatedResponse<Property>>('/properties', { params }),

  featured: () => apiClient.get<ApiResponse<Property[]>>('/properties/featured'),

  get: (id: number) => apiClient.get<ApiResponse<Property>>(`/properties/${id}`),

  create: (formData: FormData) =>
    apiClient.post<ApiResponse<Property>>('/properties', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: number, formData: FormData) =>
    apiClient.put<ApiResponse<Property>>(`/properties/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: number) => apiClient.delete(`/properties/${id}`),

  myListings: () => apiClient.get<ApiResponse<Property[]>>('/properties/my/listings'),

  toggleAvailability: (id: number) => apiClient.patch(`/properties/${id}/availability`),

  addImage: (id: number, formData: FormData) =>
    apiClient.post(`/properties/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteImage: (imageId: number) => apiClient.delete(`/images/${imageId}`),

  setMainImage: (imageId: number) => apiClient.patch(`/images/${imageId}/main`),

  getReviews: (id: number) => apiClient.get<ApiResponse<Review[]>>(`/properties/${id}/reviews`),

  createReview: (id: number, data: { rating: number; comment?: string }) =>
    apiClient.post<ApiResponse<Review>>(`/properties/${id}/reviews`, data),

  deleteReview: (reviewId: number) => apiClient.delete(`/reviews/${reviewId}`),

  getSuggestions: (q: string) =>
    apiClient.get<ApiResponse<string[]>>('/search/suggestions', { params: { q } }),
};
