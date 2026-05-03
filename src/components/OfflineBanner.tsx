import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNetworkStore } from '../store/networkStore';

interface Props {
  onRetry?: () => void;
}

export default function OfflineBanner({ onRetry }: Props) {
  const isOnline = useNetworkStore((s) => s.isOnline);
  const { t } = useTranslation();
  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color="#16a34a" />
      <Text style={styles.text}>{t('offline.message')}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.retry}>{t('offline.retry')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 8,
  },
  text: {
    flex: 1,
    color: '#16a34a',
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
  },
  retry: {
    color: '#16a34a',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
