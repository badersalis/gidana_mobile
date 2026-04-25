import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, FAB, Text } from 'react-native-paper';
import WalletCard from '../../components/WalletCard';
import { walletApi } from '../../api/wallet';
import { useAuthStore } from '../../store/authStore';
import { Wallet } from '../../types';
import { COLORS } from '../../utils/theme';

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const { data } = await walletApi.list();
      setWallets(data.data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  async function handleSelect(id: number) {
    try {
      await walletApi.select(id);
      setWallets((prev) =>
        prev.map((w) => ({ ...w, selected: w.id === id }))
      );
    } catch {}
  }

  async function handleDelete(id: number) {
    Alert.alert(
      'Supprimer le portefeuille',
      'Êtes-vous sûr de vouloir supprimer ce portefeuille ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            await walletApi.delete(id);
            setWallets((prev) => prev.filter((w) => w.id !== id));
          },
        },
      ]
    );
  }

  async function handleRefreshBalance(wallet: Wallet) {
    try {
      const { data } = await walletApi.refreshBalance(wallet.id);
      setWallets((prev) =>
        prev.map((w) => w.id === wallet.id ? { ...w, balance: data.data.balance } : w)
      );
    } catch {}
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.authPrompt}>
        <Ionicons name="wallet-outline" size={64} color={COLORS.border} />
        <Text style={styles.authTitle}>Connectez-vous pour accéder à votre portefeuille</Text>
        <Text style={styles.authSub}>Gérez vos moyens de paiement et transactions</Text>
        <Button mode="contained" onPress={() => navigation.navigate('Login')} style={styles.authBtn}>
          Se connecter
        </Button>
        <Button mode="outlined" onPress={() => navigation.navigate('Register')} style={styles.regBtn} textColor={COLORS.primary}>
          Créer un compte
        </Button>
      </View>
    );
  }

  if (loading) return <ActivityIndicator style={styles.loader} color={COLORS.primary} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={wallets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <WalletCard
            wallet={item}
            onPress={() => handleRefreshBalance(item)}
            onSelect={() => handleSelect(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>Aucun portefeuille</Text>
            <Text style={styles.emptySubtext}>Ajoutez un moyen de paiement pour commencer</Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.headerTitle}>Mes portefeuilles</Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddWallet')}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { marginTop: 100 },
  header: { padding: 16, paddingTop: 20 },
  headerTitle: { fontWeight: '700', color: COLORS.text },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.textLight, marginTop: 16 },
  emptySubtext: { color: COLORS.textLight, textAlign: 'center', marginTop: 8 },
  fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: COLORS.primary },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  authTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginTop: 16 },
  authSub: { color: COLORS.textLight, textAlign: 'center', marginBottom: 8 },
  authBtn: { width: '100%', borderRadius: 8 },
  regBtn: { width: '100%', borderRadius: 8, borderColor: COLORS.primary },
});
