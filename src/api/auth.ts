import { ApiResponse, User } from '../types';
import apiClient from './client';

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: (identifier: string, password: string) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { identifier, password }),

  register: (data: {
    first_name: string;
    last_name: string;
    email?: string;
    phone_number?: string;
    password: string;
  }) => apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data),

  getMe: () => apiClient.get<ApiResponse<User>>('/auth/me'),
};
