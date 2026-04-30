import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { geocodingApi, GeoPlace } from '../../api/geocoding';
import { useLocation } from '../../hooks/useLocation';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Alert,
} from 'react-native';
import styles from './ExploreScreen.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Text } from 'react-native-paper';
import PropertyCard from '../../components/PropertyCard';
import { favoritesApi } from '../../api/favorites';
import { propertyApi } from '../../api/properties';
import { searchApi } from '../../api/search';
import { useAuthStore } from '../../store/authStore';
import { alertsApi } from '../../api/alerts';
import { Property, SearchHistoryItem } from '../../types';
import { COLORS } from '../../utils/theme';

type TransactionFilter = 'Tout' | 'À louer' | 'À vendre';
const TRANSACTION_FILTERS: TransactionFilter[] = ['Tout', 'À louer', 'À vendre'];

export default function ExploreScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('Tout');
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Search suggestions & history
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [geoPlaces, setGeoPlaces] = useState<GeoPlace[]>([]);

  const { place: userPlace, loading: locationLoading, requestLocation } = useLocation();

  const searchInputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Load search history on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadSearchHistory();
    }
  }, [isAuthenticated]);

  // Get search suggestions as user types
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.length >= 2) {
      debounceTimer.current = setTimeout(() => {
        fetchSuggestions();
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  async function fetchSuggestions() {
    if (searchQuery.length < 2) return;

    setLoadingSuggestions(true);
    try {
      const [suggestionsData, places] = await Promise.all([
        searchApi.getSuggestions(searchQuery).catch(() => [] as string[]),
        geocodingApi.autocomplete(searchQuery).catch(() => [] as GeoPlace[]),
      ]);
      setSuggestions(suggestionsData);
      setGeoPlaces(places);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function handleNearMe() {
    const place = await requestLocation();
    if (place) {
      const query = place.city || place.neighborhood;
      if (query) performSearch(query);
    }
  }

  async function loadSearchHistory() {
    try {
      const history = await searchApi.getSearchHistory();
      setSearchHistory(history);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }

  async function saveSearchTerm(term: string) {
    if (!term.trim()) return;
    
    try {
      await searchApi.saveSearchHistory(term);
      if (isAuthenticated) {
        await loadSearchHistory();
      }
    } catch (error) {
      console.error('Error saving search term:', error);
    }
  }

  async function performSearch(query: string) {
    setSearchQuery(query);
    setShowSuggestions(false);
    setSuggestions([]);
    
    await saveSearchTerm(query);
    await loadProperties(1, true);
  }

  async function clearSearch() {
    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
    searchInputRef.current?.focus();
    await loadProperties(1, true);
  }

  async function clearSearchHistory() {
    if (!isAuthenticated) return;
    
    Alert.alert(
      'Effacer l\'historique',
      'Voulez-vous vraiment effacer tout votre historique de recherche ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            try {
              await searchApi.clearSearchHistory();
              setSearchHistory([]);
              Alert.alert('Historique effacé', 'Vos recherches récentes ont été supprimées.');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'effacer l\'historique');
            }
          },
        },
      ]
    );
  }

  // Accept property type from home screen categories
  useEffect(() => {
    if (route.params?.propertyType) {
      setPropertyType(route.params.propertyType);
    }
  }, [route.params?.propertyType]);

  async function loadProperties(p = 1, reset = false) {
    if (p === 1) setLoading(true);
    try {
      const { data } = await propertyApi.list({
        page: p,
        q: searchQuery || undefined,
        property_type: propertyType || undefined,
        transaction_type: activeFilter === 'Tout' ? undefined : activeFilter,
      });
      if (reset || p === 1) {
        setProperties(data.data);
      } else {
        setProperties((prev) => [...prev, ...data.data]);
      }
      setTotalPages(data.pages);
      setPage(p);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => { 
    loadProperties(1, true); 
  }, [searchQuery, activeFilter, propertyType]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProperties(1, true);
    setRefreshing(false);
  }, [searchQuery, activeFilter, propertyType]);

  function loadMore() {
    if (page < totalPages && !loadingMore && !loading) {
      setLoadingMore(true);
      loadProperties(page + 1);
    }
  }

  async function handleCreateAlert() {
    if (!isAuthenticated) { navigation.navigate('Login'); return; }
    const criteria: string[] = [];
    if (searchQuery) criteria.push(`Lieu : ${searchQuery}`);
    if (activeFilter !== 'Tout') criteria.push(`Transaction : ${activeFilter}`);
    if (propertyType) criteria.push(`Type : ${propertyType}`);
    Alert.alert(
      'Créer une alerte',
      `Vous serez notifié dès qu'une propriété correspond à :\n${criteria.length ? criteria.join('\n') : 'tous les critères actuels'}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Créer',
          onPress: async () => {
            try {
              await alertsApi.create({
                neighborhood: searchQuery || undefined,
                transaction_type: activeFilter !== 'Tout' ? activeFilter : undefined,
                property_type: propertyType || undefined,
              });
              Alert.alert('Alerte créée', 'Vous serez notifié dès qu\'une propriété correspond à vos critères.');
            } catch (e: any) {
              Alert.alert('Erreur', e.response?.data?.error ?? 'Impossible de créer l\'alerte');
            }
          },
        },
      ]
    );
  }

  async function handleToggleFavorite(property: Property) {
    if (!isAuthenticated) { navigation.navigate('Login'); return; }
    try {
      await favoritesApi.toggle(property.id);
      setProperties((prev) =>
        prev.map((p) => p.id === property.id ? { ...p, is_favorited: !p.is_favorited } : p)
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explorer</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search bar with suggestions */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <View style={[styles.searchField, { flex: 1 }]}>
            <Ionicons name="search-outline" size={20} color="#adb5bd" style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Quartier, ville, pays…"
              placeholderTextColor="#adb5bd"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="never"
              onSubmitEditing={() => performSearch(searchQuery)}
              onFocus={() => {
                if (searchQuery.length >= 2 && (suggestions.length > 0 || geoPlaces.length > 0)) {
                  setShowSuggestions(true);
                } else if (isAuthenticated && searchHistory.length > 0 && !searchQuery) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={20} color="#adb5bd" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.nearMeBtn} onPress={handleNearMe} activeOpacity={0.7}>
            {locationLoading ? (
              <ActivityIndicator size={18} color={COLORS.primary} />
            ) : (
              <Ionicons name="navigate" size={20} color={userPlace ? COLORS.primary : '#adb5bd'} />
            )}
          </TouchableOpacity>
        </View>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <View style={styles.suggestionsContainer}>
            {loadingSuggestions ? (
              <View style={styles.suggestionItem}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : suggestions.length > 0 || geoPlaces.length > 0 ? (
              <>
                {suggestions.length > 0 && (
                  <>
                    <Text style={styles.suggestionsHeader}>Suggestions</Text>
                    {suggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={`s-${index}`}
                        style={styles.suggestionItem}
                        onPress={() => performSearch(suggestion)}
                      >
                        <Ionicons name="search-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                {geoPlaces.length > 0 && (
                  <>
                    <Text style={styles.suggestionsHeader}>Lieux</Text>
                    {geoPlaces.map((place, index) => (
                      <TouchableOpacity
                        key={`g-${index}`}
                        style={styles.suggestionItem}
                        onPress={() => performSearch(place.city || place.neighborhood || place.displayName)}
                      >
                        <Ionicons name="location-outline" size={18} color="#e67e22" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.suggestionText} numberOfLines={1}>
                            {[place.neighborhood, place.city].filter(Boolean).join(', ') || place.displayName}
                          </Text>
                          {place.country ? (
                            <Text style={styles.suggestionSubtext}>{place.country}</Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </>
            ) : isAuthenticated && searchHistory.length > 0 && !searchQuery ? (
              <>
                <View style={styles.historyHeader}>
                  <Text style={styles.suggestionsHeader}>Recherches récentes</Text>
                  <TouchableOpacity onPress={clearSearchHistory}>
                    <Text style={styles.clearHistoryText}>Effacer</Text>
                  </TouchableOpacity>
                </View>
                {searchHistory.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.suggestionItem}
                    onPress={() => performSearch(item.search_term)}
                  >
                    <Ionicons name="time-outline" size={18} color="#999" />
                    <Text style={styles.suggestionText}>{item.search_term}</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : null}
          </View>
        )}

        {/* Filter chips: Tout / À louer / À vendre */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {TRANSACTION_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, activeFilter === f && styles.chipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
          {propertyType && (
            <TouchableOpacity
              style={[styles.chip, styles.chipActive]}
              onPress={() => setPropertyType(null)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, styles.chipTextActive]}>
                {propertyType} Ã—
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Advanced Filters (collapsible) */}
      {showFilters && (
        <View style={styles.advancedFilters}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Prix min</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="0 FCFA"
              placeholderTextColor="#adb5bd"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Prix max</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Illimité"
              placeholderTextColor="#adb5bd"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Surface min</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="0 mÂ²"
              placeholderTextColor="#adb5bd"
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity style={styles.applyFiltersBtn}>
            <Text style={styles.applyFiltersText}>Appliquer les filtres</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Chargement des propriétés...</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
              onFavoriteToggle={() => handleToggleFavorite(item)}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.loadingMoreText}>Chargement...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="home-outline" size={64} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Aucun résultat trouvé</Text>
              <Text style={styles.emptyText}>
                Aucune propriété ne correspond à vos critères de recherche.
              </Text>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setSearchQuery('');
                  setActiveFilter('Tout');
                  setPropertyType(null);
                  loadProperties(1, true);
                }}
              >
                <Text style={styles.resetBtnText}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
              {(searchQuery || activeFilter !== 'Tout' || propertyType) && (
                <TouchableOpacity style={styles.alertBtn} onPress={handleCreateAlert}>
                  <Ionicons name="notifications-outline" size={16} color="#fff" />
                  <Text style={styles.alertBtnText}>Créer une alerte pour cette recherche</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          contentContainerStyle={properties.length === 0 ? styles.emptyContainer : styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

