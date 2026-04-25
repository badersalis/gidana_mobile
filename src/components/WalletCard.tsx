import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { formatCurrency } from '../utils/currency';
import { COLORS } from '../utils/theme';
import { Wallet } from '../types';

const PROVIDER_ICONS: Record<string, string> = {
  Nita: 'phone-portrait-outline',
  MPesa: 'phone-portrait-outline',
  Visa: 'card-outline',
  Mastercard: 'card-outline',
  PayPal: 'logo-paypal',
};

const PROVIDER_COLORS: Record<string, string> = {
  Nita: '#1B4F72',
  MPesa: '#2ECC71',
  Visa: '#1A56BB',
  Mastercard: '#EB5757',
  PayPal: '#003087',
};

interface Props {
  wallet: Wallet;
  onPress?: () => void;
  onSelect?: () => void;
  onDelete?: () => void;
}

export default function WalletCard({ wallet, onPress, onSelect, onDelete }: Props) {
  const color = PROVIDER_COLORS[wallet.provider] ?? COLORS.primary;
  const icon = PROVIDER_ICONS[wallet.provider] ?? 'wallet-outline';

  const identifier =
    wallet.masked_phone || wallet.masked_email || wallet.masked_card || '';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Card style={[styles.card, { borderLeftColor: color }]} elevation={2}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
              <Ionicons name={icon as any} size={24} color={color} />
            </View>
            <View style={styles.info}>
              <Text style={styles.provider}>{wallet.provider}</Text>
              {identifier ? <Text style={styles.identifier}>{identifier}</Text> : null}
            </View>
            {wallet.selected && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedText}>Par défaut</Text>
              </View>
            )}
          </View>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Solde</Text>
            <Text style={[styles.balance, { color }]}>
              {formatCurrency(wallet.balance, wallet.currency)}
            </Text>
          </View>

          <View style={styles.actions}>
            {onSelect && !wallet.selected && (
              <TouchableOpacity style={styles.actionBtn} onPress={onSelect}>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.secondary} />
                <Text style={[styles.actionText, { color: COLORS.secondary }]}>Définir par défaut</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
                <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                <Text style={[styles.actionText, { color: COLORS.danger }]}>Supprimer</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16, marginVertical: 8, borderRadius: 12,
    backgroundColor: COLORS.card, borderLeftWidth: 4,
  },
  content: { paddingVertical: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  provider: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  identifier: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  selectedBadge: { backgroundColor: COLORS.secondaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  selectedText: { fontSize: 11, color: COLORS.secondary, fontWeight: '600' },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  balanceLabel: { fontSize: 13, color: COLORS.textLight },
  balance: { fontSize: 20, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13 },
});
