import { useEffect, useRef, useCallback } from 'react';
import { storage } from '../utils/storage';
import { Message } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

function buildWsUrl(token: string): string {
  const wsBase = BASE_URL
    .replace(/^https/, 'wss')
    .replace(/^http(?!s)/, 'ws')
    .replace(/\/api\/v1\/?$/, '');
  return `${wsBase}/ws?token=${encodeURIComponent(token)}`;
}

export type WsMessageHandler = (msg: Message) => void;

export interface WsPropertyAlertData {
  property_id: number;
  title: string;
  neighborhood: string;
  property_type: string;
  transaction_type: string;
  price: number;
  currency: string;
}

export type WsPropertyAlertHandler = (data: WsPropertyAlertData) => void;

export function useWebSocket(
  onMessage: WsMessageHandler,
  enabled = true,
  onPropertyAlert?: WsPropertyAlertHandler
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;
  const alertHandlerRef = useRef(onPropertyAlert);
  alertHandlerRef.current = onPropertyAlert;

  const connect = useCallback(async () => {
    if (!mountedRef.current || !enabled) return;

    const token = await storage.getItemAsync('auth_token');
    if (!token) return;

    const ws = new WebSocket(buildWsUrl(token));
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string);
        if (payload?.type === 'new_message' && payload?.data) {
          handlerRef.current(payload.data as Message);
        } else if (payload?.type === 'property_alert' && payload?.data) {
          alertHandlerRef.current?.(payload.data as WsPropertyAlertData);
        }
      } catch {}
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      reconnectRef.current = setTimeout(connect, 4000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) connect();

    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect, enabled]);
}
