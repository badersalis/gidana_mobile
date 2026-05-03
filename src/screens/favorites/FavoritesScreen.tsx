import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, TouchableOpacity, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import PropertyCard from '../../components/PropertyCard';
import { favoritesApi } from '../../api/favorites';
import { useAuthStore } from '../../store/authStore';
import { Property } from '../../types';
import { COLORS } from '../../utils/theme';
import styles from './FavoritesScreen.styles';

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const { data } = await favoritesApi.list();
      setFavorites(data.data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  async function handleRemoveFavorite(property: Property) {
    try {
      await favoritesApi.toggle(property.id);
      setFavorites((prev) => prev.filter((p) => p.id !== property.id));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.centered}>
          <View style={styles.iconContainer}>
            <Ionicons name="heart-outline" size={64} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t('favorites.loginPrompt')}</Text>
          <Text style={styles.emptyText}>{t('favorites.loginPromptDesc')}</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{t('favorites.signIn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.outlineBtnText}>{t('favorites.createAccount')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>{t('favorites.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('favorites.title')}</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        style={styles.container}
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PropertyCard
            property={{ ...item, is_favorited: true }}
            onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
            onFavoriteToggle={() => handleRemoveFavorite(item)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <View style={styles.iconContainer}>
              <Ionicons name="heart-outline" size={64} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('favorites.noFavorites')}</Text>
            <Text style={styles.emptyText}>{t('favorites.noFavoritesDesc')}</Text>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => navigation.navigate('Explore')}
              activeOpacity={0.85}
            >
              <Text style={styles.outlineBtnText}>{t('favorites.explore')}</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={favorites.length === 0 ? styles.emptyContainer : styles.listContainer}
      />
    </SafeAreaView>
  );
}

