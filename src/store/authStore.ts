import { create } from 'zustand';
import { authApi } from '../api/auth';
import { User } from '../types';
import { storage } from '../utils/storage';

const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: {
    first_name: string;
    last_name: string;
    email?: string;
    phone_number?: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  loadStoredAuth: async () => {
    try {
      const token = await storage.getItemAsync('auth_token');
      const loginAtStr = await storage.getItemAsync('auth_login_at');

      if (token) {
        if (loginAtStr && Date.now() - parseInt(loginAtStr, 10) > SESSION_MAX_AGE) {
          await storage.deleteItemAsync('auth_token');
          await storage.deleteItemAsync('auth_login_at');
        } else {
          const { data } = await authApi.getMe();
          set({ user: data.data, token, isAuthenticated: true });
        }
      }
    } catch {
      await storage.deleteItemAsync('auth_token');
      await storage.deleteItemAsync('auth_login_at');
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (identifier, password) => {
    const { data } = await authApi.login(identifier, password);
    await storage.setItemAsync('auth_token', data.data.token);
    await storage.setItemAsync('auth_login_at', String(Date.now()));
    set({ user: data.data.user, token: data.data.token, isAuthenticated: true });
  },

  register: async (userData) => {
    const { data } = await authApi.register(userData);
    await storage.setItemAsync('auth_token', data.data.token);
    await storage.setItemAsync('auth_login_at', String(Date.now()));
    set({ user: data.data.user, token: data.data.token, isAuthenticated: true });
  },

  logout: async () => {
    await storage.deleteItemAsync('auth_token');
    await storage.deleteItemAsync('auth_login_at');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (user) => set({ user }),
}));
