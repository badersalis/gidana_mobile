import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View, SafeAreaView, StatusBar } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import PropertyCard from '../../components/PropertyCard';
import { favoritesApi } from '../../api/favorites';
import { useAuthStore } from '../../store/authStore';
import { Property } from '../../types';
import { COLORS } from '../../utils/theme';

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
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
          <Text style={styles.emptyTitle}>Connectez-vous pour voir vos favoris</Text>
          <Text style={styles.emptyText}>Sauvegardez les propriétés qui vous intéressent</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.outlineBtnText}>Créer un compte</Text>
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
          <Text style={styles.loaderText}>Chargement des favoris...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
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
            <Text style={styles.emptyTitle}>Aucun favori</Text>
            <Text style={styles.emptyText}>
              Enregistrez des propriétés pour les retrouver ici
            </Text>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => navigation.navigate('Explore')}
              activeOpacity={0.85}
            >
              <Text style={styles.outlineBtnText}>Explorer</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={favorites.length === 0 ? styles.emptyContainer : styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
    gap: 12,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: 16,
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
  },
  outlineBtn: {
    width: '100%',
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  outlineBtnText: { 
    color: COLORS.primary, 
    fontWeight: '600', 
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
  },
});