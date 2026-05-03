import axios from 'axios';
import { storage } from '../utils/storage';
import { useNetworkStore } from '../store/networkStore';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

// Retry up to 3 times on pure network errors (no server response).
// Backoff: 1 s → 2 s → 4 s between attempts.
const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;

// Require 2 consecutive network-level failures before showing the offline banner,
// so a single dropped packet doesn't flip the UI.
const OFFLINE_THRESHOLD = 2;

let consecutiveNetworkFailures = 0;

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 s — enough headroom for 2G/edge connections
});

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    consecutiveNetworkFailures = 0;
    useNetworkStore.getState().setOnline(true);
    return response;
  },
  async (error) => {
    const retries: number = (error.config as any).__retries ?? 0;

    // Network error (no response from server) — retry with exponential backoff
    if (!error.response && retries < MAX_RETRIES) {
      (error.config as any).__retries = retries + 1;
      await sleep(BACKOFF_BASE_MS * 2 ** retries); // 1 s, 2 s, 4 s
      return apiClient(error.config);
    }

    if (!error.response) {
      consecutiveNetworkFailures += 1;
      if (consecutiveNetworkFailures >= OFFLINE_THRESHOLD) {
        useNetworkStore.getState().setOnline(false);
      }
    } else {
      consecutiveNetworkFailures = 0;
      useNetworkStore.getState().setOnline(true);
      if (error.response.status === 401) {
        await storage.deleteItemAsync('auth_token');
        await storage.deleteItemAsync('auth_login_at');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
