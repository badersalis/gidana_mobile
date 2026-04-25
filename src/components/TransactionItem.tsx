import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatCurrency, formatDate } from '../utils/currency';
import { COLORS } from '../utils/theme';
import { Transaction } from '../types';

interface Props {
  transaction: Transaction;
}

const SERVICE_ICONS: Record<string, string> = {
  starlink: 'wifi',
  'canal+': 'tv',
  transfer: 'swap-horizontal',
  default: 'cash',
};

export default function TransactionItem({ transaction }: Props) {
  const isIncome = transaction.nature === 'income';
  const color = isIncome ? COLORS.secondary : COLORS.danger;
  const prefix = isIncome ? '+' : '-';
  const iconName = (SERVICE_ICONS[transaction.service_provider?.toLowerCase()] ?? SERVICE_ICONS.default) as any;

  const statusColors: Record<string, string> = {
    done: COLORS.secondary,
    failed: COLORS.danger,
    ongoing: COLORS.accent,
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={iconName} size={22} color={color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.service}>{transaction.service_provider}</Text>
        <Text style={styles.detail}>{transaction.service}</Text>
        <Text style={styles.date}>{formatDate(transaction.created_at)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color }]}>
          {prefix}{formatCurrency(transaction.amount, transaction.currency)}
        </Text>
        <View style={[styles.statusDot, { backgroundColor: statusColors[transaction.status] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, backgroundColor: COLORS.card, borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 12 },
  service: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  detail: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  date: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 16, fontWeight: '700' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});
