import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, CommonActions } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
} from 'react-native';
import styles, { guestStyles } from './ProfileScreen.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Divider, Text, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { favoritesApi } from '../../api/favorites';
import { propertyApi } from '../../api/properties';
import { rentalApi } from '../../api/rentals';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../utils/theme';

function GuestProfilePrompt() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  return (
    <SafeAreaView style={guestStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <TouchableOpacity style={guestStyles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <View style={guestStyles.content}>
        <View style={guestStyles.iconContainer}>
          <Ionicons name="person-outline" size={80} color={COLORS.primary} />
        </View>
        <Text style={guestStyles.title}>{t('profile.loginPrompt')}</Text>
        <Text style={guestStyles.sub}>{t('profile.loginPromptDesc')}</Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Login')}
          style={guestStyles.btn}
          buttonColor={COLORS.primary}
          labelStyle={guestStyles.btnLabel}
        >
          {t('profile.signIn')}
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Register')}
          style={guestStyles.regBtn}
          textColor={COLORS.primary}
          labelStyle={guestStyles.btnLabel}
        >
          {t('profile.createAccount')}
        </Button>
      </View>
    </SafeAreaView>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout, updateUser } = useAuthStore();
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [stats, setStats] = useState({ properties: 0, rentals: 0, favorites: 0 });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      propertyApi.myListings().catch(() => null),
      rentalApi.myRentals().catch(() => null),
      favoritesApi.list(1).catch(() => null),
    ]).then(([props, rents, favs]) => {
      setStats({
        properties: props?.data?.data?.length ?? 0,
        rentals: rents?.data?.data?.length ?? 0,
        favorites: (favs?.data as any)?.total ?? 0,
      });
    });
  }, [user]);

  async function handlePickAvatar() {
    if (Platform.OS === 'web') {
      window.alert(t('profile.webPhotoNotAvailable'));
      return;
    }
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('profile.permissionDenied'), t('profile.galleryPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    setUploading(true);
    const uri = result.assets[0].uri;
    const ext = uri.split('.').pop() ?? 'jpg';
    const formData = new FormData();
    formData.append('picture', { uri, type: `image/${ext}`, name: `avatar_${Date.now()}.${ext}` } as any);
    try {
      const { data } = await apiClient.post('/users/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.data);
      Alert.alert(t('profile.photoUpdated'), t('profile.photoUpdatedDesc'));
    } catch {
      Alert.alert(t('common.error'), t('profile.photoError'));
    } finally {
      setUploading(false);
    }
  }

  const performLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }], index: 0 } }],
        })
      );
    } catch {
      Alert.alert(t('common.error'), t('profile.logoutError'));
      setLoggingOut(false);
    }
  };

  const handleLogout = () =>
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: performLogout },
    ]);

  if (loggingOut) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('profile.loggingOut')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) return <GuestProfilePrompt />;

  const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();
  const memberSince = user.created_at ? new Date(user.created_at).getFullYear() : '2024';

  const STAT_ITEMS = [
    { label: t('profile.properties'), count: stats.properties, screen: 'MyProperties' },
    { label: t('profile.rentals'), count: stats.rentals, screen: 'MyRentals' },
    { label: t('profile.favorites'), count: stats.favorites, screen: 'Favorites' },
  ] as const;

  const MENU_ITEMS = [
    {
      icon: 'home-outline',
      title: t('profile.myListings'),
      desc: t('profile.manageProperties'),
      onPress: () => navigation.navigate('MyProperties'),
    },
    {
      icon: 'chatbubbles-outline',
      title: t('profile.messages'),
      desc: t('profile.myConversations'),
      onPress: () => navigation.navigate('Tabs', { screen: 'Messages' }),
    },
    {
      icon: 'key-outline',
      title: t('profile.myRentals'),
      desc: t('profile.viewRentals'),
      onPress: () => navigation.navigate('MyRentals'),
    },
    {
      icon: 'heart-outline',
      title: t('profile.myFavorites'),
      desc: t('profile.savedProperties'),
      onPress: () => navigation.navigate('Tabs', { screen: 'Favorites' }),
    },
    {
      icon: 'settings-outline',
      title: t('profile.accountSettings'),
      desc: t('profile.editInfo'),
      onPress: () => navigation.navigate('EditProfile'),
    },
  ] as const;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <TouchableOpacity
            onPress={handlePickAvatar}
            disabled={uploading}
            style={styles.avatarContainer}
            activeOpacity={0.8}
          >
            {uploading ? (
              <View style={[styles.avatar, styles.avatarUploading]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : user.profile_picture ? (
              <Image
                source={{ uri: user.profile_picture }}
                style={styles.avatar}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <Avatar.Text
                size={80}
                label={initials}
                style={{ backgroundColor: COLORS.primary }}
                labelStyle={{ fontSize: 32, fontFamily: 'Poppins-Bold' }}
              />
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
          <Text style={styles.memberSince}>{t('profile.memberSince', { year: memberSince })}</Text>
          {user.email ? <Text style={styles.contactInfo}>{user.email}</Text> : null}
        </View>

        <View style={styles.statsContainer}>
          {STAT_ITEMS.map((item, idx) => (
            <React.Fragment key={item.label}>
              {idx > 0 && <View style={styles.statDivider} />}
              <TouchableOpacity
                style={styles.statCard}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.screen === 'Favorites') {
                    navigation.navigate('Tabs', { screen: 'Favorites' });
                  } else {
                    navigation.navigate(item.screen as any);
                  }
                }}
              >
                <Text style={styles.statNumber}>{item.count}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item, idx) => (
            <React.Fragment key={item.title}>
              {idx > 0 && <Divider style={styles.divider} />}
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDescription}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <View style={styles.copyright}>
          <Text style={styles.copyrightText}>{t('profile.copyright')}</Text>
          <Text style={styles.copyrightSub}>{t('profile.allRights')}</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
