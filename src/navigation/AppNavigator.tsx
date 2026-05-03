import { NavigationContainer } from '@react-navigation/native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import MainNavigator from './MainNavigator';

SplashScreen.preventAutoHideAsync();

function LoadingDots() {
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence(
        dots.flatMap((dot) => [
          Animated.timing(dot, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 280, useNativeDriver: true }),
        ])
      )
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {dots.map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#1B4F72',
            opacity: anim,
          }}
        />
      ))}
    </View>
  );
}

export default function AppNavigator() {
  const { isLoading, loadStoredAuth } = useAuthStore();
  const { hasSeenOnboarding, checkOnboarding } = useAppStore();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Dismiss the native splash immediately so our custom loading screen is visible.
    SplashScreen.hideAsync();

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

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', gap: 32 }}>
        <Image
          source={require('../../assets/android-chrome-512x512.png')}
          style={{ width: 72, height: 72, borderRadius: 16 }}
          resizeMode="contain"
        />
        <LoadingDots />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
  );
}
