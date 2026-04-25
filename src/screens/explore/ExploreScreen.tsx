import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import PropertyCard from '../../components/PropertyCard';
import { favoritesApi } from '../../api/favorites';
import { propertyApi } from '../../api/properties';
import { searchApi } from '../../api/search';
import { useAuthStore } from '../../store/authStore';
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
      const suggestionsData = await searchApi.getSuggestions(searchQuery);
      setSuggestions(suggestionsData);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
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
              Alert.alert('Succès', 'Historique effacé');
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
        <View style={styles.searchField}>
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
              if (searchQuery.length >= 2 && suggestions.length > 0) {
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

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <View style={styles.suggestionsContainer}>
            {loadingSuggestions ? (
              <View style={styles.suggestionItem}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : suggestions.length > 0 ? (
              <>
                <Text style={styles.suggestionsHeader}>Suggestions</Text>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => performSearch(suggestion)}
                  >
                    <Ionicons name="search-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
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
                {propertyType} ×
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
              placeholder="0 €"
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
              placeholder="0 m²"
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
            </View>
          }
          contentContainerStyle={properties.length === 0 ? styles.emptyContainer : styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search section
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    zIndex: 1,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 8,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    paddingVertical: 10,
    fontFamily: 'Poppins-Regular',
  },
  clearBtn: {
    padding: 4,
    flexShrink: 0,
  },

  // Suggestions dropdown
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 300,
    zIndex: 1000,
  },
  suggestionsHeader: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#999',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
  },
  clearHistoryText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: COLORS.primary,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },

  // Filter chips
  filterChips: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#495057',
  },
  chipTextActive: { color: '#fff' },

  // Advanced Filters
  advancedFilters: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#666',
    marginBottom: 6,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#333',
    backgroundColor: '#f8f9fa',
  },
  applyFiltersBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  applyFiltersText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },

  // Results
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
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  emptyContainer: { flexGrow: 1 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  resetBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  resetBtnText: {
    color: COLORS.primary,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
});