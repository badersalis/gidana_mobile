import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import TransactionItem from '../../components/TransactionItem';
import { transactionApi } from '../../api/transactions';
import { Transaction } from '../../types';
import { COLORS } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TransactionsScreen() {
  const navigation = useNavigation<any>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  async function load(p = 1, reset = false) {
    if (p === 1) setLoading(true);
    try {
      const { data } = await transactionApi.list(p);
      if (reset || p === 1) {
        setTransactions(data.data);
      } else {
        setTransactions((prev) => [...prev, ...data.data]);
      }
      setTotalPages(data.pages);
      setPage(p);
    } catch {}
    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => { load(1, true); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(1, true);
    setRefreshing(false);
  }, []);

  function loadMore() {
    if (page < totalPages && !loadingMore && !loading) {
      setLoadingMore(true);
      load(page + 1);
    }
  }

  if (loading) return <ActivityIndicator style={styles.loader} color={COLORS.primary} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.headerTitle}>Historique</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PayService')}>
              <Ionicons name="add-circle" size={30} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={COLORS.primary} /> : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>Aucune transaction</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { marginTop: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 20 },
  headerTitle: { fontWeight: '700', color: COLORS.text },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: COLORS.textLight, marginTop: 12 },
});
