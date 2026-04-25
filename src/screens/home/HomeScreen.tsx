import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { ActivityIndicator, Text, Avatar } from 'react-native-paper';
import GuestPromptModal from '../../components/GuestPromptModal';
import PropertyCard from '../../components/PropertyCard';
import { favoritesApi } from '../../api/favorites';
import { propertyApi } from '../../api/properties';
import { useAuthStore } from '../../store/authStore';
import { Property } from '../../types';
import { COLORS } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
  { label: 'Studios', type: 'Studio', image: require('../../../assets/studio.jpg'), icon: 'business-outline' },
  { label: 'Apparts', type: 'Appartement', image: require('../../../assets/appart.jpg'), icon: 'home-outline' },
  { label: 'Maisons', type: 'Maison', image: require('../../../assets/home.jpg'), icon: 'house-outline' },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const guestTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const guestIntervalRef = useRef<ReturnType<typeof setInterval>>();

  async function loadFeatured() {
    try {
      const { data } = await propertyApi.featured();
      setFeatured(data.data);
    } catch (error) {
      console.error('Error loading featured:', error);
    }
    setLoading(false);
  }

  useEffect(() => { loadFeatured(); }, []);

  useEffect(() => {
    if (isAuthenticated) return;
    guestTimerRef.current = setTimeout(() => {
      setShowGuestModal(true);
      guestIntervalRef.current = setInterval(() => setShowGuestModal(true), 240000);
    }, 20000);
    return () => {
      clearTimeout(guestTimerRef.current);
      clearInterval(guestIntervalRef.current);
    };
  }, [isAuthenticated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeatured();
    setRefreshing(false);
  }, []);

  async function handleToggleFavorite(property: Property) {
    if (!isAuthenticated) { navigation.navigate('Login'); return; }
    try {
      await favoritesApi.toggle(property.id);
      setFeatured((prev) =>
        prev.map((p) => p.id === property.id ? { ...p, is_favorited: !p.is_favorited } : p)
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Custom Header with Logo */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.logo}>Gidana</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Explore')}
            >
              <Ionicons name="search-outline" size={22} color="#fff" />
            </TouchableOpacity>
            
            {isAuthenticated ? (
              <>
                <TouchableOpacity 
                  style={styles.addPropertyBtn}
                  onPress={() => navigation.navigate('AddProperty')}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Profile')}
                  style={styles.avatarLink}
                >
                  <Avatar.Image 
                    size={34} 
                    source={{ uri: user?.profile_picture || 'https://www.gravatar.com/avatar/placeholder?d=mp' }}
                  />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.loginBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginBtnText}>Connexion</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Modern Hero Section ── */}
        <View style={styles.heroSection}>
          <ImageBackground
            source={require('../../../assets/hero-img.jpeg')}
            style={styles.heroBg}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0.9)']}
              locations={[0, 0.6, 1]}
              style={styles.heroOverlay}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>
                  Trouvez votre{'\n'}
                  <Text style={styles.heroTitleHighlight}>logement idéal</Text>
                </Text>
                
                <Text style={styles.heroSubtitle}>
                  Découvrez des studios, appartements et maisons à louer
                </Text>
                
                <TouchableOpacity 
                  style={styles.searchBar}
                  onPress={() => navigation.navigate('Explore')}
                >
                  <Ionicons name="search-outline" size={20} color="#999" />
                  <Text style={styles.searchPlaceholder}>Rechercher une propriété...</Text>
                  <View style={styles.searchButton}>
                    <Ionicons name="options-outline" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* ── Categories Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionSubtitle}>Catégories</Text>
              <Text style={styles.sectionTitle}>Explorez par type</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigation.navigate('Explore')}
            >
              <Text style={styles.viewAllText}>Tout voir</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((item, index) => (
              <TouchableOpacity
                key={item.type}
                style={styles.catCard}
                onPress={() => navigation.navigate('Explore', { propertyType: item.type })}
                activeOpacity={0.88}
              >
                <Image
                  source={item.image}
                  style={styles.catImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.catOverlay}
                >
                  <Ionicons name={item.icon as any} size={24} color="#fff" />
                  <Text style={styles.catLabel}>{item.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Featured Properties ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionSubtitle}>Recommandations</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Explore')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>Voir tout</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loader} color={COLORS.primary} />
          ) : featured.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="home-outline" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Aucune propriété disponible</Text>
              <Text style={styles.emptyText}>
                Revenez bientôt, de nouvelles propriétés seront ajoutées.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('Explore')}
              >
                <Text style={styles.emptyBtnText}>Explorer maintenant</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={featured}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <PropertyCard
                  property={item}
                  onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
                  onFavoriteToggle={() => handleToggleFavorite(item)}
                />
              )}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <GuestPromptModal
        visible={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        onSignUp={() => { setShowGuestModal(false); navigation.navigate('Register'); }}
        onSignIn={() => { setShowGuestModal(false); navigation.navigate('Login'); }}
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
  content: { 
    paddingTop: 0,
  },

  // ── Custom Header with Logo ──
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Poppins-Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPropertyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLink: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  loginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  loginBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },

  // ── Modern Hero Section ──
  heroSection: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  heroBg: { width: '100%', height: height * 0.4 },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    lineHeight: 38,
    fontFamily: 'Poppins-Bold',
  },
  heroTitleHighlight: {
    color: '#fff', // Changed from COLORS.primary to white for better legibility
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#999',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 50,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Sections ──
  section: { 
    paddingHorizontal: 20, 
    marginBottom: 28,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'Poppins-Bold',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primary,
    fontFamily: 'Poppins-Medium',
  },

  // ── Modern Category Cards ──
  categoriesContainer: {
    gap: 12,
  },
  catCard: {
    width: width * 0.3,
    height: width * 0.4,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  catImage: {
    width: '100%',
    height: '100%',
  },
  catOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    justifyContent: 'flex-end',
  },
  catLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    fontFamily: 'Poppins-SemiBold',
  },

  // ── Empty State ──
  loader: { marginVertical: 40 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
  },
});