import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import ExploreScreen from '../screens/explore/ExploreScreen';
import FavoritesScreen from '../screens/favorites/FavoritesScreen';
import HomeScreen from '../screens/home/HomeScreen';
import PayServiceScreen from '../screens/payment/PayServiceScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import AddPropertyScreen from '../screens/property/AddPropertyScreen';
import MyPropertiesScreen from '../screens/property/MyPropertiesScreen';
import MyRentalsScreen from '../screens/property/MyRentalsScreen';
import PropertyDetailScreen from '../screens/property/PropertyDetailScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import AddWalletScreen from '../screens/wallet/AddWalletScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import ConversationsScreen from '../screens/messages/ConversationsScreen';
import ChatScreen from '../screens/messages/ChatScreen';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { useNotifications } from '../hooks/useNotifications';
import { useWebSocket, WsPropertyAlertData } from '../hooks/useWebSocket';
import { useAlertStore } from '../store/alertStore';
import { COLORS } from '../utils/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HEADER_OPTIONS = {
  headerStyle: { backgroundColor: COLORS.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontFamily: 'Poppins-SemiBold', fontSize: 18 },
  headerShadowVisible: false,
};

function HomeTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home: ['home', 'home-outline'],
            Explore: ['compass', 'compass-outline'],
            Favorites: ['heart', 'heart-outline'],
            Messages: ['chatbubbles', 'chatbubbles-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['circle', 'circle-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 68,
          borderTopWidth: 1,
          borderTopColor: '#e9ecef',
          paddingBottom: 10,
          paddingTop: 6,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('navigation.home', 'Home') }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: t('explore.title') }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: t('profile.favorites') }} />
      <Tab.Screen name="Messages" component={ConversationsScreen} options={{ title: t('profile.messages') }} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);
  const addNotification = useAlertStore((s) => s.addNotification);

  const handlePropertyAlert = useCallback((data: WsPropertyAlertData) => {
    addNotification({
      property_id: data.property_id,
      title: data.title,
      neighborhood: data.neighborhood,
      property_type: data.property_type,
      transaction_type: data.transaction_type,
      price: data.price,
      currency: data.currency,
    });
  }, [addNotification]);

  useWebSocket(() => {}, isAuthenticated, handlePropertyAlert);

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as any;
      if (data?.conversationId) {
        console.log('[Nav] notification tapped, conversationId:', data.conversationId);
      }
    },
    []
  );

  useNotifications(isAuthenticated ? handleNotificationResponse : undefined);

  const sharedScreens = (
    <>
      <Stack.Screen name="Tabs" component={HomeTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="PropertyDetail"
        component={PropertyDetailScreen}
        options={{ headerShown: false }}
      />
    </>
  );

  return (
    <Stack.Navigator screenOptions={HEADER_OPTIONS}>
      {isAuthenticated ? (
        <>
          {sharedScreens}
          <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="AddProperty"
            component={AddPropertyScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MyProperties"
            component={MyPropertiesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MyRentals"
            component={MyRentalsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Wallet"
            component={WalletScreen}
            options={{ title: t('navigation.wallet'), headerTitleStyle: { fontFamily: 'Poppins-SemiBold' } }}
          />
          <Stack.Screen
            name="AddWallet"
            component={AddWalletScreen}
            options={{ title: t('navigation.addWallet'), headerTitleStyle: { fontFamily: 'Poppins-SemiBold' } }}
          />
          <Stack.Screen
            name="Transactions"
            component={TransactionsScreen}
            options={{ title: t('navigation.transactions'), headerTitleStyle: { fontFamily: 'Poppins-SemiBold' } }}
          />
          <Stack.Screen
            name="PayService"
            component={PayServiceScreen}
            options={{ title: t('navigation.payService'), headerTitleStyle: { fontFamily: 'Poppins-SemiBold' } }}
          />
        </>
      ) : (
        <>
          {!hasSeenOnboarding && (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
          )}
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          {sharedScreens}
        </>
      )}
    </Stack.Navigator>
  );
}
