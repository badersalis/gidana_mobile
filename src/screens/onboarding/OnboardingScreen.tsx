import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import styles from './OnboardingScreen.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/appStore';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Trouvez votre\nlogement idéal',
    subtitle: 'Trouver un studio  n\'a jamais été aussi simple',
    highlight: 'Recherche simplifiée',
    features: [
      'Des milliers d\'annonces vérifiées',
      'Recherche par quartier, prix ou type',
      'Alertes personnalisées'
    ],
    image: require('../../../assets/hero-img.jpeg'),
    color: '#0D9488',
  },
  {
    title: 'Trouvez ce qui\nvous correspond',
    subtitle: 'Trouvez ce dont vous avez besoin dans votre budget et contactez le propriétaire',
    highlight: 'Mise en relation directe',
    features: [
      'Filtres adaptés à votre budget',
      'Contactez le propriétaire avant la visite',
      'Visites virtuelles disponibles'
    ],
    image: require('../../../assets/home.jpg'),
    color: '#0891B2',
  },
  {
    title: 'On s\'occupe\nde tout',
    subtitle: 'Nous gérons toutes les formalités pour vous',
    highlight: 'Accompagnement complet',
    features: [
      'Contrats de location simplifiés',
      'Gestion administrative automatisée',
      'Assistance juridique incluse'
    ],
    image: require('../../../assets/appart.jpg'),
    color: '#059669',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { completeOnboarding } = useAppStore();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const currentSlide = SLIDES[currentIndex];

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      handleFinish();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigation.navigate('Tabs');
  };

  const handleFinish = async () => {
    await completeOnboarding();
    navigation.navigate('Tabs');
  };

  const renderSlide = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [1.1, 1, 1.1],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slide, { width }]} key={index}>
        <View style={styles.imageContainer}>
          <Animated.Image
            source={item.image}
            style={[
              styles.image,
              {
                transform: [{ scale }],
                opacity,
              },
            ]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
            locations={[0, 0.4, 1]}
            style={styles.imageGradient}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Skip Button */}
      <TouchableOpacity
        style={[styles.skipButton, { top: insets.top + 16 }]}
        onPress={handleSkip}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
          style={styles.skipButtonGradient}
        >
          <Text style={styles.skipText}>Passer</Text>
          <Ionicons name="arrow-forward" size={16} color="#333" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Image Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Content Overlay */}
      <View style={[styles.contentOverlay, { paddingBottom: Math.max(insets.bottom, 30) }]}>
        <View style={styles.contentBackground} />
        
        {/* Main Message */}
        <Animated.View style={styles.mainMessageContainer}>
          <View style={styles.mainMessageBadge}>
            <LinearGradient
              colors={[currentSlide.color + '40', currentSlide.color + '20']}
              style={styles.mainMessageBadgeGradient}
            >
              <Ionicons name="star" size={16} color={currentSlide.color} />
              <Text style={[styles.mainMessageText, { color: currentSlide.color }]}>
                {currentSlide.subtitle}
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Title & Subtitle */}
        <Animated.View style={styles.textContainer}>
          <Text style={styles.title}>{currentSlide.title}</Text>
        </Animated.View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          {currentSlide.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: currentSlide.color + '20' }]}>
                <Ionicons name="checkmark" size={16} color={currentSlide.color} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Navigation Footer */}
        <View style={styles.footer}>
          <View style={styles.dotsContainer}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dotStatic,
                  {
                    backgroundColor: i === currentIndex ? currentSlide.color : 'rgba(255,255,255,0.4)',
                    width: i === currentIndex ? 24 : 6,
                  },
                ]}
              />
            ))}
          </View>
          
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.8}
            style={styles.nextButton}
          >
            <LinearGradient
              colors={[currentSlide.color, currentSlide.color + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex === SLIDES.length - 1 ? 'Commencer' : 'Continuer'}
              </Text>
              <Ionicons
                name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
                size={20}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

