import { NavigationContainer } from '@react-navigation/native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import MainNavigator from './MainNavigator';

SplashScreen.preventAutoHideAsync();

export default function AppNavigator() {
  const { isLoading, loadStoredAuth } = useAuthStore();
  const { hasSeenOnboarding, checkOnboarding } = useAppStore();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    loadStoredAuth();
    checkOnboarding();
    Font.loadAsync({
      'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
      'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
      'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
      'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    }).then(() => setFontsLoaded(true));
  }, []);

  const ready = fontsLoaded && !isLoading && hasSeenOnboarding !== null;

  const onReady = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <Image
          source={require('../../assets/android-chrome-512x512.png')}
          style={{ width: 120, height: 120, borderRadius: 24 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <NavigationContainer onReady={onReady}>
      <MainNavigator />
    </NavigationContainer>
  );
}