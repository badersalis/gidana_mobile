import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { rentalApi } from '../../api/rentals';
import { Rental } from '../../types';
import { formatCurrency, formatDate } from '../../utils/currency';
import { COLORS } from '../../utils/theme';

const STATUS_COLORS: Record<Rental['status'], string> = {
  pending: '#f59e0b',
  occupied: COLORS.primary,
  available: '#22c55e',
  completed: '#6b7280',
};

export default function MyRentalsScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      rentalApi
        .myRentals()
        .then(({ data }) => setRentals(data.data ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('myRentals.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={rentals}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="key-outline" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyText}>{t('myRentals.noRentals')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const img =
              item.property?.images?.find((i) => i.is_main) ?? item.property?.images?.[0];
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate('PropertyDetail', { id: item.property_id })
                }
                activeOpacity={0.8}
              >
                {img ? (
                  <Image
                    source={{ uri: img.filename }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.cardImage, styles.imagePlaceholder]}>
                    <Ionicons name="home-outline" size={32} color={COLORS.textLight} />
                  </View>
                )}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.property?.title ?? t('myRentals.property')}
                  </Text>
                  <View style={styles.row}>
                    <Ionicons name="location-outline" size={13} color={COLORS.textLight} />
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {item.property?.neighborhood}, {item.property?.country}
                    </Text>
                  </View>
                  <Text style={styles.cardPrice}>
                    {formatCurrency(item.monthly_price, item.property?.currency ?? 'XOF')}/mois
                  </Text>
                  <View style={styles.cardMeta}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: STATUS_COLORS[item.status] + '22' },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                        {t(`myRentals.status.${item.status}`)}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>{t('myRentals.since', { date: formatDate(item.start_date) })}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins-SemiBold', color: '#333' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontFamily: 'Poppins-Regular', fontSize: 15, color: COLORS.textLight },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardImage: { width: 100, height: 110 },
  imagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { flex: 1, padding: 10, gap: 4 },
  cardTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#333' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardSub: { fontFamily: 'Poppins-Regular', fontSize: 12, color: COLORS.textLight, flex: 1 },
  cardPrice: { fontFamily: 'Poppins-Bold', fontSize: 14, color: COLORS.primary },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusText: { fontFamily: 'Poppins-Medium', fontSize: 11 },
  dateText: { fontFamily: 'Poppins-Regular', fontSize: 11, color: COLORS.textLight },
});
