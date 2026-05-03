import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import styles from './WalletScreen.styles';
import { ActivityIndicator, Button, FAB, Text } from 'react-native-paper';
import WalletCard from '../../components/WalletCard';
import { useTranslation } from 'react-i18next';
import { walletApi } from '../../api/wallet';
import { useAuthStore } from '../../store/authStore';
import { Wallet } from '../../types';
import { COLORS } from '../../utils/theme';

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
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
      t('wallet.deleteTitle'),
      t('wallet.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('wallet.delete'), style: 'destructive',
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
        <Text style={styles.authTitle}>{t('wallet.loginPrompt')}</Text>
        <Text style={styles.authSub}>{t('wallet.loginPromptDesc')}</Text>
        <Button mode="contained" onPress={() => navigation.navigate('Login')} style={styles.authBtn}>
          {t('wallet.signIn')}
        </Button>
        <Button mode="outlined" onPress={() => navigation.navigate('Register')} style={styles.regBtn} textColor={COLORS.primary}>
          {t('wallet.createAccount')}
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
            <Text style={styles.emptyText}>{t('wallet.noWallets')}</Text>
            <Text style={styles.emptySubtext}>{t('wallet.noWalletsDesc')}</Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.headerTitle}>{t('wallet.title')}</Text>
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

