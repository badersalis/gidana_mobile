import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, RadioButton, Text } from 'react-native-paper';
import { transactionApi } from '../../api/transactions';
import { walletApi } from '../../api/wallet';
import { Wallet } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { COLORS } from '../../utils/theme';

const SERVICES = [
  {
    provider: 'starlink',
    name: 'Starlink',
    plans: [
      { name: 'Basic', price: 50, currency: 'USD' },
      { name: 'Standard', price: 150, currency: 'USD' },
      { name: 'Premium', price: 500, currency: 'USD' },
    ],
  },
  {
    provider: 'canal+',
    name: 'Canal+',
    plans: [
      { name: 'Standard', price: 30, currency: 'USD' },
    ],
  },
];

export default function PayServiceScreen() {
  const navigation = useNavigation<any>();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [selectedPlan, setSelectedPlan] = useState(SERVICES[0].plans[0]);
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    walletApi.list().then(({ data }) => {
      setWallets(data.data);
      const defaultWallet = data.data.find((w: Wallet) => w.selected);
      if (defaultWallet) setSelectedWalletId(defaultWallet.id);
    });
  }, []);

  const serviceFee = selectedPlan.price * 0.1;
  const total = selectedPlan.price + serviceFee;

  async function handlePay() {
    if (!selectedWalletId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un portefeuille');
      return;
    }
    setLoading(true);
    try {
      await transactionApi.payService({
        service: selectedPlan.name,
        service_provider: selectedService.provider,
        plan: selectedPlan.name,
        wallet_id: selectedWalletId,
      });
      Alert.alert('Paiement réussi', `${selectedService.name} - ${selectedPlan.name} payé avec succès`, [
        { text: 'OK', onPress: () => navigation.navigate('Transactions') },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error ?? 'Échec du paiement');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text variant="titleMedium" style={styles.sectionTitle}>Service</Text>
      <View style={styles.serviceRow}>
        {SERVICES.map((s) => (
          <Chip
            key={s.provider}
            selected={selectedService.provider === s.provider}
            onPress={() => {
              setSelectedService(s);
              setSelectedPlan(s.plans[0]);
            }}
            style={[styles.chip, selectedService.provider === s.provider && styles.chipSelected]}
            textStyle={selectedService.provider === s.provider ? styles.chipTextSelected : undefined}
          >
            {s.name}
          </Chip>
        ))}
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>Plan</Text>
      {selectedService.plans.map((plan) => (
        <Card
          key={plan.name}
          style={[styles.planCard, selectedPlan.name === plan.name && styles.planCardSelected]}
          onPress={() => setSelectedPlan(plan)}
        >
          <Card.Content style={styles.planContent}>
            <View style={styles.planLeft}>
              <RadioButton
                value={plan.name}
                status={selectedPlan.name === plan.name ? 'checked' : 'unchecked'}
                onPress={() => setSelectedPlan(plan)}
                color={COLORS.primary}
              />
              <Text style={styles.planName}>{plan.name}</Text>
            </View>
            <Text style={styles.planPrice}>{formatCurrency(plan.price, plan.currency)}</Text>
          </Card.Content>
        </Card>
      ))}

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.sectionTitle}>Récapitulatif</Text>
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service</Text>
            <Text>{selectedService.name} - {selectedPlan.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Montant</Text>
            <Text>{formatCurrency(selectedPlan.price, selectedPlan.currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frais (10%)</Text>
            <Text>{formatCurrency(serviceFee, selectedPlan.currency)}</Text>
          </View>
          <Divider style={{ marginVertical: 8 }} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, styles.totalLabel]}>Total</Text>
            <Text style={styles.totalAmount}>{formatCurrency(total, selectedPlan.currency)}</Text>
          </View>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionTitle}>Payer avec</Text>
      {wallets.map((wallet) => (
        <Card
          key={wallet.id}
          style={[styles.walletCard, selectedWalletId === wallet.id && styles.walletCardSelected]}
          onPress={() => setSelectedWalletId(wallet.id)}
        >
          <Card.Content style={styles.planContent}>
            <View style={styles.planLeft}>
              <RadioButton
                value={String(wallet.id)}
                status={selectedWalletId === wallet.id ? 'checked' : 'unchecked'}
                onPress={() => setSelectedWalletId(wallet.id)}
                color={COLORS.primary}
              />
              <Text>{wallet.provider} · {formatCurrency(wallet.balance, wallet.currency)}</Text>
            </View>
          </Card.Content>
        </Card>
      ))}

      <Button
        mode="contained" onPress={handlePay}
        loading={loading} disabled={loading}
        style={styles.payBtn} contentStyle={styles.payContent}
      >
        Confirmer le paiement
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 16 },
  serviceRow: { flexDirection: 'row', gap: 10 },
  chip: { backgroundColor: COLORS.border },
  chipSelected: { backgroundColor: COLORS.primary },
  chipTextSelected: { color: '#fff' },
  planCard: { marginBottom: 8, borderWidth: 2, borderColor: 'transparent', borderRadius: 10 },
  planCardSelected: { borderColor: COLORS.primary },
  planContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  planLeft: { flexDirection: 'row', alignItems: 'center' },
  planName: { fontWeight: '600', color: COLORS.text },
  planPrice: { fontWeight: '700', color: COLORS.primary },
  divider: { marginVertical: 8 },
  summaryCard: { borderRadius: 10, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: COLORS.textLight },
  totalLabel: { fontWeight: '700', color: COLORS.text },
  totalAmount: { fontWeight: '800', color: COLORS.primary, fontSize: 16 },
  walletCard: { marginBottom: 8, borderWidth: 2, borderColor: 'transparent', borderRadius: 10 },
  walletCardSelected: { borderColor: COLORS.primary },
  payBtn: { marginTop: 24, borderRadius: 10 },
  payContent: { paddingVertical: 6 },
});
