import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

async function registerPushToken() {
  if (Platform.OS === 'web') return;

  // Remote push notifications don't work in Expo Go on Android (SDK 53+).
  // Skip silently — a development build is required for real push tokens.
  if (isExpoGo()) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;

  if (existing !== 'granted') {
    const { status: requested } = await Notifications.requestPermissionsAsync();
    status = requested;
  }

  if (status !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1B4F72',
    });
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    await apiClient.patch('/users/push-token', { push_token: token });
  } catch (e) {
    console.warn('[Notifications] Failed to register push token:', e);
  }
}

export function useNotifications(
  onResponse?: (response: Notifications.NotificationResponse) => void
) {
  const onResponseRef = useRef(onResponse);
  onResponseRef.current = onResponse;

  useEffect(() => {
    registerPushToken();

    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      onResponseRef.current?.(res);
    });

    return () => sub.remove();
  }, []);
}
