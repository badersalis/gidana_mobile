import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from '../../hooks/useLocation';
import {
  FlatList,
  Image,
  ImageBackground,
  Modal,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import styles from './HomeScreen.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Text, Avatar, Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import GuestPromptModal from '../../components/GuestPromptModal';
import OfflineBanner from '../../components/OfflineBanner';
import PropertyCard from '../../components/PropertyCard';
import PropertyCardSkeleton from '../../components/PropertyCardSkeleton';
import { favoritesApi } from '../../api/favorites';
import { propertyApi } from '../../api/properties';
import { useAuthStore } from '../../store/authStore';
import { useAlertStore, PropertyNotification } from '../../store/alertStore';
import { formatCurrency } from '../../utils/currency';
import { Property } from '../../types';
import { COLORS } from '../../utils/theme';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [snackVisible, setSnackVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const { notifications, unreadCount, markAllRead } = useAlertStore();
  const guestTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const guestIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const { place: userPlace, loading: locationLoading, requestLocation } = useLocation();

  const CATEGORIES = [
    { label: t('home.studios'), type: 'Studio', image: require('../../../assets/studio.jpg'), icon: 'business-outline' },
    { label: t('home.apartments'), type: 'Appartement', image: require('../../../assets/appart.jpg'), icon: 'home-outline' },
    { label: t('home.houses'), type: 'Maison', image: require('../../../assets/home.jpg'), icon: 'home-outline' },
  ];

  useEffect(() => {
    requestLocation();
  }, []);

  async function loadFeatured(attempt = 1) {
    try {
      const { data } = await propertyApi.featured();
      setFeatured(data.data);
    } catch (error: any) {
      if (attempt < 3 && !error?.response) {
        await new Promise((r) => setTimeout(r, 3000 * attempt));
        return loadFeatured(attempt + 1);
      }
      console.error('Error loading featured:', error);
    }
    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadFeatured();
    }, [])
  );

  useEffect(() => {
    if (route.params?.added) setSnackVisible(true);
  }, [route.params?.added]);

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

            {isAuthenticated && (
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => { setNotifModalVisible(true); markAllRead(); }}
              >
                <Ionicons name="notifications-outline" size={22} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

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
                <Text style={styles.loginBtnText}>{t('home.login')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <OfflineBanner onRetry={onRefresh} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
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
                <TouchableOpacity style={styles.locationBadge} onPress={requestLocation} activeOpacity={0.7}>
                  <Ionicons name="location-sharp" size={14} color="rgba(255,255,255,0.9)" />
                  {locationLoading ? (
                    <ActivityIndicator size={12} color="rgba(255,255,255,0.8)" style={{ marginLeft: 4 }} />
                  ) : (
                    <Text style={styles.locationBadgeText}>
                      {userPlace
                        ? [userPlace.city, userPlace.country].filter(Boolean).join(', ')
                        : t('home.detectLocation')}
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.heroTitle}>
                  {t('home.heroTitle')}
                  <Text style={styles.heroTitleHighlight}>{t('home.heroTitleHighlight')}</Text>
                </Text>

                <Text style={styles.heroSubtitle}>{t('home.heroSubtitle')}</Text>

                <TouchableOpacity
                  style={styles.searchBar}
                  onPress={() => navigation.navigate('Explore')}
                >
                  <Ionicons name="search-outline" size={20} color="#999" />
                  <Text style={styles.searchPlaceholder}>
                    {userPlace?.city
                      ? t('home.searchInCity', { city: userPlace.city })
                      : t('home.searchProperty')}
                  </Text>
                  <View style={styles.searchButton}>
                    <Ionicons name="options-outline" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionSubtitle}>{t('home.categoriesSubtitle')}</Text>
              <Text style={styles.sectionTitle}>{t('home.categoriesTitle')}</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigation.navigate('Explore')}
            >
              <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((item) => (
              <TouchableOpacity
                key={item.type}
                style={styles.catCard}
                onPress={() => navigation.navigate('Explore', { propertyType: item.type })}
                activeOpacity={0.88}
              >
                <Image source={item.image} style={styles.catImage} resizeMode="cover" />
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionSubtitle}>{t('home.recommendations')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Explore')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>{t('home.seeAll')}</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <>
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
            </>
          ) : featured.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="home-outline" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>{t('home.noProperties')}</Text>
              <Text style={styles.emptyText}>{t('home.noPropertiesDesc')}</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('Explore')}
              >
                <Text style={styles.emptyBtnText}>{t('home.exploreNow')}</Text>
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

      <Modal
        visible={notifModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotifModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.notifOverlay}
          activeOpacity={1}
          onPress={() => setNotifModalVisible(false)}
        >
          <View style={styles.notifSheet}>
            <View style={styles.notifHandle} />
            <Text style={styles.notifTitle}>{t('home.newProperties')}</Text>
            {notifications.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Ionicons name="notifications-off-outline" size={40} color="#ccc" />
                <Text style={styles.notifEmptyText}>{t('home.noNotifications')}</Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(n: PropertyNotification) => n.id}
                renderItem={({ item }: { item: PropertyNotification }) => (
                  <TouchableOpacity
                    style={styles.notifItem}
                    onPress={() => {
                      setNotifModalVisible(false);
                      navigation.navigate('PropertyDetail', { id: item.property_id });
                    }}
                  >
                    <View style={styles.notifItemIcon}>
                      <Ionicons name="home-outline" size={22} color={COLORS.primary} />
                    </View>
                    <View style={styles.notifItemInfo}>
                      <Text style={styles.notifItemTitle}>{item.title}</Text>
                      <Text style={styles.notifItemSub}>
                        {item.property_type} · {item.neighborhood} · {item.transaction_type}
                      </Text>
                      <Text style={styles.notifItemPrice}>
                        {formatCurrency(item.price, item.currency)}
                        {item.transaction_type === 'À louer' ? t('home.perMonth') : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={4000}
        style={styles.snackbar}
        action={{ label: t('common.ok'), onPress: () => setSnackVisible(false) }}
      >
        {t('home.propertyAdded')}
      </Snackbar>
    </SafeAreaView>
  );
}
