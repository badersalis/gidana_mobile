import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
} from 'react-native';
import styles from './AddPropertyScreen.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { geocodingApi, GeoPlace } from '../../api/geocoding';
import { useLocation } from '../../hooks/useLocation';
import { useTranslation } from 'react-i18next';
import { propertyApi } from '../../api/properties';
import { Property } from '../../types';
import { COLORS } from '../../utils/theme';

const PROPERTY_TYPES = ['Studio', 'Apartment', 'House'];
const CURRENCIES = ['XOF', 'EUR', 'USD'];

// Helper function for alerts (works on both mobile and web)
const showAlert = (title: string, message?: string, onOk?: () => void) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (onOk) {
      const confirmed = window.confirm(message || title);
      if (confirmed && onOk) onOk();
    } else {
      window.alert(message || title);
    }
  } else {
    Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
  }
};

type RouteParams = {
  mode?: 'edit';
  propertyId?: number;
  property?: Property;
};

export default function AddPropertyScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params ?? {}) as RouteParams;
  const isEditMode = params.mode === 'edit';
  const editProperty = params.property;

  const toPropertyType = (v?: string) => (v === 'Apartment' || v === 'House' ? v : 'Studio');
  const toTransactionType = (v?: string) => (v === 'for_sale' ? 'for_sale' : 'for_rent');
  const toShowerType = (v?: string) => (v === 'external' ? 'external' : 'internal');

  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  // Location & address autocomplete
  const { loading: locationLoading, requestLocation } = useLocation();
  const [addressSuggestions, setAddressSuggestions] = useState<GeoPlace[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const addressDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleDetectLocation() {
    const place = await requestLocation();
    if (!place) {
      showAlert(t('common.error'), t('addProperty.locationError'));
      return;
    }
    if (place.neighborhood) setNeighborhood(place.neighborhood);
    if (place.country) setCountry(place.country);
    if (place.city) setAddress(place.city + (place.neighborhood ? `, ${place.neighborhood}` : ''));
  }

  function onAddressChange(text: string) {
    setAddress(text);
    if (addressDebounce.current) clearTimeout(addressDebounce.current);
    if (text.length >= 3) {
      addressDebounce.current = setTimeout(async () => {
        const places = await geocodingApi.autocomplete(text);
        setAddressSuggestions(places);
        setShowAddressSuggestions(places.length > 0);
      }, 350);
    } else {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    }
  }

  function selectAddressSuggestion(place: GeoPlace) {
    setAddress(place.displayName);
    if (!neighborhood && place.neighborhood) setNeighborhood(place.neighborhood);
    if (!country && place.country) setCountry(place.country);
    setShowAddressSuggestions(false);
  }

  const [title, setTitle] = useState(editProperty?.title ?? '');
  const [description, setDescription] = useState(editProperty?.description ?? '');
  const [neighborhood, setNeighborhood] = useState(editProperty?.neighborhood ?? '');
  const [country, setCountry] = useState(editProperty?.country ?? '');
  const [propertyType, setPropertyType] = useState(toPropertyType(editProperty?.property_type));
  const [transactionType, setTransactionType] = useState(toTransactionType(editProperty?.transaction_type));
  const [rooms, setRooms] = useState(editProperty?.rooms != null ? String(editProperty.rooms) : '');
  const [bathrooms, setBathrooms] = useState(editProperty?.bathrooms != null ? String(editProperty.bathrooms) : '');
  const [surface, setSurface] = useState(editProperty?.surface != null ? String(editProperty.surface) : '');
  const [price, setPrice] = useState(editProperty?.price != null ? String(editProperty.price) : '');
  const [currency, setCurrency] = useState(editProperty?.currency ?? 'XOF');
  const [whatsapp, setWhatsapp] = useState(editProperty?.whatsapp_contact ?? '');
  const [phone, setPhone] = useState(editProperty?.phone_contact ?? '');
  const [address, setAddress] = useState(editProperty?.exact_address ?? '');
  const [showerType, setShowerType] = useState(toShowerType(editProperty?.shower_type));
  const [hasWater, setHasWater] = useState(editProperty?.has_water ?? false);
  const [hasElectricity, setHasElectricity] = useState(editProperty?.has_electricity ?? false);
  const [hasCourtyard, setHasCourtyard] = useState(editProperty?.has_courtyard ?? false);
  const [images, setImages] = useState<string[]>([]);

  async function pickImages() {
    if (Platform.OS === 'web') {
      showAlert(t('common.ok'), t('addProperty.photoWebNotAvailable'));
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showAlert(t('addProperty.permissionDenied'), t('addProperty.galleryPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    
    if (!result.canceled) {
      const remainingSlots = 10 - images.length;
      const newImages = result.assets.slice(0, remainingSlots).map((a) => a.uri);
      
      if (newImages.length < result.assets.length) {
        showAlert(t('addProperty.photoLimit'), t('addProperty.photoLimitDesc', { count: remainingSlots }));
      }
      
      setImages((prev) => [...prev, ...newImages]);
    }
  }

  async function removeImage(index: number) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(t('addProperty.removeImageConfirm'));
      if (confirmed) {
        setImages((prev) => prev.filter((_, i) => i !== index));
      }
    } else {
      Alert.alert(
        t('addProperty.removeImage'),
        t('addProperty.removeImageConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('myProperties.delete'),
            style: 'destructive',
            onPress: () => setImages((prev) => prev.filter((_, i) => i !== index))
          }
        ]
      );
    }
  }

  async function handleSubmit() {
    if (!title || !neighborhood || !country || !rooms || !bathrooms || !price || !whatsapp) {
      showAlert(t('common.error'), t('addProperty.requiredFields'));
      return;
    }
    if (!isEditMode && images.length < 3) {
      showAlert(t('common.error'), t('addProperty.minPhotos', { count: images.length }));
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('neighborhood', neighborhood);
    formData.append('country', country);
    formData.append('property_type', propertyType);
    formData.append('transaction_type', transactionType);
    formData.append('rooms', rooms);
    formData.append('bathrooms', bathrooms);
    formData.append('surface', surface);
    formData.append('price', price);
    formData.append('currency', currency);
    formData.append('whatsapp_contact', whatsapp);
    formData.append('phone_contact', phone);
    formData.append('exact_address', address);
    formData.append('shower_type', showerType);
    formData.append('has_water', String(hasWater));
    formData.append('has_electricity', String(hasElectricity));
    formData.append('has_courtyard', String(hasCourtyard));

    images.forEach((uri, idx) => {
      const ext = uri.split('.').pop() ?? 'jpg';
      formData.append('images', {
        uri,
        type: `image/${ext}`,
        name: `image_${Date.now()}_${idx}.${ext}`,
      } as any);
    });

    try {
      if (isEditMode && params.propertyId) {
        await propertyApi.update(params.propertyId, formData);
        showAlert(t('addProperty.updateSuccess'), t('addProperty.updateSuccessDesc'), () => navigation.goBack());
      } else {
        await propertyApi.create(formData);
        navigation.navigate('Home', { added: Date.now() });
      }
    } catch (e: any) {
      showAlert(t('common.error'), e.response?.data?.error ?? (isEditMode ? t('addProperty.updateError') : t('addProperty.createError')));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? t('addProperty.titleEdit') : t('addProperty.titleAdd')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Photos Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('addProperty.photos')}</Text>
            <Text style={styles.sectionSubtitle}>{images.length}/10</Text>
          </View>
          <Text style={styles.sectionDescription}>{t('addProperty.atLeast3Photos')}</Text>
          
          <View style={styles.imageGrid}>
            {images.map((uri, idx) => (
              <View key={idx} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imageThumb} />
                <TouchableOpacity
                  style={styles.removeImage}
                  onPress={() => removeImage(idx)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.imageNumber}>
                  <Text style={styles.imageNumberText}>{idx + 1}</Text>
                </View>
              </View>
            ))}
            {images.length < 10 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImages} activeOpacity={0.7}>
                <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
                <Text style={styles.addImageText}>{t('addProperty.addPhoto')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('addProperty.generalInfo')}</Text>
          
          <TextInput 
            mode="outlined" 
            label={t('addProperty.titleLabel')}
            value={title} 
            onChangeText={setTitle} 
            style={styles.input}
            outlineColor="#e9ecef"
            activeOutlineColor={COLORS.primary}
          />
          
          <TextInput 
            mode="outlined" 
            label={t('addProperty.descriptionLabel')}
            value={description} 
            onChangeText={setDescription} 
            multiline 
            numberOfLines={3} 
            style={styles.input}
            outlineColor="#e9ecef"
            activeOutlineColor={COLORS.primary}
          />

          <Text style={styles.label}>{t('addProperty.propertyType')}</Text>
          <View style={styles.buttonGroup}>
            {PROPERTY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.optionButton, propertyType === type && styles.optionButtonActive]}
                onPress={() => setPropertyType(type)}
              >
                <Text style={[styles.optionText, propertyType === type && styles.optionTextActive]}>
                  {t(`propertyTypes.${type}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t('addProperty.transactionType')}</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, transactionType === 'for_rent' && styles.optionButtonActive]}
              onPress={() => setTransactionType('for_rent')}
            >
              <Text style={[styles.optionText, transactionType === 'for_rent' && styles.optionTextActive]}>
                {t('addProperty.forRent')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, transactionType === 'for_sale' && styles.optionButtonActive]}
              onPress={() => setTransactionType('for_sale')}
            >
              <Text style={[styles.optionText, transactionType === 'for_sale' && styles.optionTextActive]}>
                {t('addProperty.forSale')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('addProperty.locationSection')}</Text>
            <TouchableOpacity
              style={styles.detectBtn}
              onPress={handleDetectLocation}
              activeOpacity={0.7}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size={14} color={COLORS.primary} />
              ) : (
                <Ionicons name="navigate" size={15} color={COLORS.primary} />
              )}
              <Text style={styles.detectBtnText}>
                {locationLoading ? t('addProperty.detecting') : t('addProperty.detectLocation')}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            mode="outlined"
            label={t('addProperty.neighborhood')}
            value={neighborhood}
            onChangeText={setNeighborhood}
            style={styles.input}
            outlineColor="#e9ecef"
            activeOutlineColor={COLORS.primary}
          />

          <TextInput
            mode="outlined"
            label={t('addProperty.country')}
            value={country}
            onChangeText={setCountry}
            style={styles.input}
            outlineColor="#e9ecef"
            activeOutlineColor={COLORS.primary}
          />

          {/* Address with autocomplete */}
          <View style={styles.autocompleteWrapper}>
            <TextInput
              mode="outlined"
              label={t('addProperty.exactAddress')}
              value={address}
              onChangeText={onAddressChange}
              onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
              style={styles.input}
              outlineColor="#e9ecef"
              activeOutlineColor={COLORS.primary}
            />
            {showAddressSuggestions && (
              <View style={styles.addressDropdown}>
                {addressSuggestions.map((place, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.addressSuggestionItem}
                    onPress={() => selectAddressSuggestion(place)}
                  >
                    <Ionicons name="location-outline" size={16} color="#e67e22" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addressSuggestionText} numberOfLines={1}>
                        {[place.neighborhood, place.city].filter(Boolean).join(', ') || place.displayName}
                      </Text>
                      {place.country ? (
                        <Text style={styles.addressSuggestionSub}>{place.country}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('addProperty.features')}</Text>
          
          <View style={styles.row}>
            <TextInput 
              mode="outlined" 
              label={t('addProperty.rooms')}
              value={rooms} 
              onChangeText={setRooms} 
              keyboardType="numeric" 
              style={[styles.input, styles.half]}
              outlineColor="#e9ecef"
              activeOutlineColor={COLORS.primary}
            />
            <TextInput 
              mode="outlined" 
              label={t('addProperty.bathrooms')}
              value={bathrooms} 
              onChangeText={setBathrooms} 
              keyboardType="numeric" 
              style={[styles.input, styles.half]}
              outlineColor="#e9ecef"
              activeOutlineColor={COLORS.primary}
            />
          </View>
          
          <TextInput 
            mode="outlined" 
            label={t('addProperty.surface')}
            value={surface} 
            onChangeText={setSurface} 
            keyboardType="numeric" 
            style={styles.input}
            outlineColor="#e9ecef"
            activeOutlineColor={COLORS.primary}
          />

          <Text style={styles.label}>{t('addProperty.showerType')}</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, showerType === 'internal' && styles.optionButtonActive]}
              onPress={() => setShowerType('internal')}
            >
              <Text style={[styles.optionText, showerType === 'internal' && styles.optionTextActive]}>
                {t('addProperty.internal')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, showerType === 'external' && styles.optionButtonActive]}
              onPress={() => setShowerType('external')}
            >
              <Text style={[styles.optionText, showerType === 'external' && styles.optionTextActive]}>
                {t('addProperty.external')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity style={styles.checkboxItem} onPress={() => setHasWater(!hasWater)}>
              <View style={[styles.checkbox, hasWater && styles.checkboxChecked]}>
                {hasWater && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>{t('addProperty.runningWater')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.checkboxItem} onPress={() => setHasElectricity(!hasElectricity)}>
              <View style={[styles.checkbox, hasElectricity && styles.checkboxChecked]}>
                {hasElectricity && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>{t('addProperty.electricity')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.checkboxItem} onPress={() => setHasCourtyard(!hasCourtyard)}>
              <View style={[styles.checkbox, hasCourtyard && styles.checkboxChecked]}>
                {hasCourtyard && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>{t('addProperty.courtyard')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price & Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('addProperty.priceContact')}</Text>
          
          <View style={styles.priceContainer}>
            <TextInput 
              mode="outlined" 
              label={t('addProperty.price')}
              value={price} 
              onChangeText={setPrice} 
              keyboardType="numeric" 
              style={styles.priceInput}
              outlineColor="#e9ecef"
              activeOutlineColor={COLORS.primary}
            />
            <View style={styles.currencySelector}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.currencyButton, currency === c && styles.currencyButtonActive]}
                  onPress={() => setCurrency(c)}
                >
                  <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            mode="outlined"
            label={t('addProperty.whatsapp')}
            value={whatsapp}
            onChangeText={setWhatsapp} 
            keyboardType="phone-pad" 
            style={styles.input}
            outlineColor="#e9ecef"
            activeOutlineColor={COLORS.primary}
          />
          
          <TextInput 
            mode="outlined" 
            label={t('addProperty.phone')}
            value={phone} 
            onChangeText={setPhone} 
            keyboardType="phone-pad" 
            style={styles.input}
            outlineColor="#e9ecef"
            activeOutlineColor={COLORS.primary}
          />
        </View>

        <Button
          mode="contained" 
          onPress={handleSubmit}
          loading={loading} 
          disabled={loading}
          style={styles.submitBtn} 
          contentStyle={styles.submitContent}
          buttonColor={COLORS.primary}
          labelStyle={styles.submitLabel}
        >
          {loading
            ? (isEditMode ? t('addProperty.updatingLoading') : t('addProperty.publishingLoading'))
            : (isEditMode ? t('addProperty.submitEdit') : t('addProperty.submitAdd'))}
        </Button>
        
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

