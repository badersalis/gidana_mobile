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
  Dimensions,
  Platform,
} from 'react-native';
import styles from './AddPropertyScreen.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { geocodingApi, GeoPlace } from '../../api/geocoding';
import { useLocation } from '../../hooks/useLocation';
import { propertyApi } from '../../api/properties';
import { Property } from '../../types';
import { COLORS } from '../../utils/theme';

const { width } = Dimensions.get('window');
const PROPERTY_TYPES = ['Studio', 'Appart', 'Maison'];
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

  const toSelectorType = (t?: string) =>
    t === 'Appartement' ? 'Appart' : (t ?? 'Appart');

  const [loading, setLoading] = useState(false);

  // Location & address autocomplete
  const { loading: locationLoading, requestLocation } = useLocation();
  const [addressSuggestions, setAddressSuggestions] = useState<GeoPlace[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const addressDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleDetectLocation() {
    const place = await requestLocation();
    if (!place) {
      showAlert('Erreur', 'Impossible de détecter votre position. Vérifiez les permissions.');
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
  const [propertyType, setPropertyType] = useState(toSelectorType(editProperty?.property_type));
  const [transactionType, setTransactionType] = useState(editProperty?.transaction_type ?? 'À louer');
  const [rooms, setRooms] = useState(editProperty?.rooms != null ? String(editProperty.rooms) : '');
  const [bathrooms, setBathrooms] = useState(editProperty?.bathrooms != null ? String(editProperty.bathrooms) : '');
  const [surface, setSurface] = useState(editProperty?.surface != null ? String(editProperty.surface) : '');
  const [price, setPrice] = useState(editProperty?.price != null ? String(editProperty.price) : '');
  const [currency, setCurrency] = useState(editProperty?.currency ?? 'XOF');
  const [whatsapp, setWhatsapp] = useState(editProperty?.whatsapp_contact ?? '');
  const [phone, setPhone] = useState(editProperty?.phone_contact ?? '');
  const [address, setAddress] = useState(editProperty?.exact_address ?? '');
  const [showerType, setShowerType] = useState(editProperty?.shower_type ?? 'interne');
  const [hasWater, setHasWater] = useState(editProperty?.has_water ?? false);
  const [hasElectricity, setHasElectricity] = useState(editProperty?.has_electricity ?? false);
  const [hasCourtyard, setHasCourtyard] = useState(editProperty?.has_courtyard ?? false);
  const [images, setImages] = useState<string[]>([]);

  async function pickImages() {
    if (Platform.OS === 'web') {
      showAlert('Information', 'L\'ajout de photos sera bientôt disponible sur le web');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      showAlert('Permission refusée', 'Vous devez autoriser l\'accès à la galerie pour ajouter des photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    
    if (!result.canceled) {
      const remainingSlots = 10 - images.length;
      const newImages = result.assets.slice(0, remainingSlots).map((a) => a.uri);
      
      if (newImages.length < result.assets.length) {
        showAlert('Limite atteinte', `Vous ne pouvez ajouter que ${remainingSlots} photo(s) supplémentaire(s)`);
      }
      
      setImages((prev) => [...prev, ...newImages]);
    }
  }

  async function removeImage(index: number) {
    const confirmMessage = 'Voulez-vous vraiment supprimer cette image ?';
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        setImages((prev) => prev.filter((_, i) => i !== index));
      }
    } else {
      Alert.alert(
        'Supprimer l\'image',
        confirmMessage,
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Supprimer', 
            style: 'destructive',
            onPress: () => setImages((prev) => prev.filter((_, i) => i !== index))
          }
        ]
      );
    }
  }

  async function handleSubmit() {
    if (!title || !neighborhood || !country || !rooms || !bathrooms || !price || !whatsapp) {
      showAlert('Erreur', 'Veuillez remplir tous les champs obligatoires (WhatsApp inclus)');
      return;
    }
    if (!isEditMode && images.length < 3) {
      showAlert('Erreur', `Minimum 3 photos requises (vous en avez ${images.length})`);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('neighborhood', neighborhood);
    formData.append('country', country);
    formData.append('property_type', propertyType === 'Appart' ? 'Appartement' : propertyType);
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
        showAlert('Succès', 'Votre annonce a été mise à jour', () => navigation.goBack());
      } else {
        await propertyApi.create(formData);
        navigation.navigate('Home', { added: Date.now() });
      }
    } catch (e: any) {
      showAlert('Erreur', e.response?.data?.error ?? (isEditMode ? 'Erreur lors de la modification' : 'Erreur lors de l\'ajout'));
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
        <Text style={styles.headerTitle}>{isEditMode ? 'Modifier l\'annonce' : 'Ajouter une propriété'}</Text>
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
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.sectionSubtitle}>{images.length}/10</Text>
          </View>
          <Text style={styles.sectionDescription}>Ajoutez au moins 3 photos</Text>
          
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
                <Text style={styles.addImageText}>Ajouter</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          
          <TextInput 
            mode="outlined" 
            label="Titre *" 
            value={title} 
            onChangeText={setTitle} 
            style={styles.input}
            outlineColor="#e9ecef"
            activeOutlineColor={COLORS.primary}
          />
          
          <TextInput 
            mode="outlined" 
            label="Description" 
            value={description} 
            onChangeText={setDescription} 
            multiline 
            numberOfLines={3} 
            style={styles.input}
            outlineColor="#e9ecef"
            activeOutlineColor={COLORS.primary}
          />

          <Text style={styles.label}>Type de bien</Text>
          <View style={styles.buttonGroup}>
            {PROPERTY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.optionButton, propertyType === type && styles.optionButtonActive]}
                onPress={() => setPropertyType(type)}
              >
                <Text style={[styles.optionText, propertyType === type && styles.optionTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Type de transaction</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, transactionType === 'À louer' && styles.optionButtonActive]}
              onPress={() => setTransactionType('À louer')}
            >
              <Text style={[styles.optionText, transactionType === 'À louer' && styles.optionTextActive]}>
                Location
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, transactionType === 'À vendre' && styles.optionButtonActive]}
              onPress={() => setTransactionType('À vendre')}
            >
              <Text style={[styles.optionText, transactionType === 'À vendre' && styles.optionTextActive]}>
                Vente
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Localisation</Text>
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
                {locationLoading ? 'Détection…' : 'Détecter ma position'}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            mode="outlined"
            label="Quartier *"
            value={neighborhood}
            onChangeText={setNeighborhood}
            style={styles.input}
            outlineColor="#e9ecef"
            activeOutlineColor={COLORS.primary}
          />

          <TextInput
            mode="outlined"
            label="Pays *"
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
              label="Adresse exacte (optionnel)"
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
          <Text style={styles.sectionTitle}>Caractéristiques</Text>
          
          <View style={styles.row}>
            <TextInput 
              mode="outlined" 
              label="Pièces *" 
              value={rooms} 
              onChangeText={setRooms} 
              keyboardType="numeric" 
              style={[styles.input, styles.half]}
              outlineColor="#e9ecef"
              activeOutlineColor={COLORS.primary}
            />
            <TextInput 
              mode="outlined" 
              label="Salle de bain *" 
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
            label="Surface (mÂ²)" 
            value={surface} 
            onChangeText={setSurface} 
            keyboardType="numeric" 
            style={styles.input}
            outlineColor="#e9ecef"
            activeOutlineColor={COLORS.primary}
          />

          <Text style={styles.label}>Type de douche</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, showerType === 'interne' && styles.optionButtonActive]}
              onPress={() => setShowerType('interne')}
            >
              <Text style={[styles.optionText, showerType === 'interne' && styles.optionTextActive]}>
                Interne
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, showerType === 'externe' && styles.optionButtonActive]}
              onPress={() => setShowerType('externe')}
            >
              <Text style={[styles.optionText, showerType === 'externe' && styles.optionTextActive]}>
                Externe
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity style={styles.checkboxItem} onPress={() => setHasWater(!hasWater)}>
              <View style={[styles.checkbox, hasWater && styles.checkboxChecked]}>
                {hasWater && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Eau courante</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.checkboxItem} onPress={() => setHasElectricity(!hasElectricity)}>
              <View style={[styles.checkbox, hasElectricity && styles.checkboxChecked]}>
                {hasElectricity && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Électricité</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.checkboxItem} onPress={() => setHasCourtyard(!hasCourtyard)}>
              <View style={[styles.checkbox, hasCourtyard && styles.checkboxChecked]}>
                {hasCourtyard && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Cour</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price & Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prix et contact</Text>
          
          <View style={styles.priceContainer}>
            <TextInput 
              mode="outlined" 
              label="Prix *" 
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
            label="WhatsApp *"
            value={whatsapp}
            onChangeText={setWhatsapp} 
            keyboardType="phone-pad" 
            style={styles.input}
            outlineColor="#e9ecef"
            activeOutlineColor={COLORS.primary}
          />
          
          <TextInput 
            mode="outlined" 
            label="Téléphone" 
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
            ? (isEditMode ? 'Mise à jour...' : 'Publication en cours...')
            : (isEditMode ? 'Enregistrer les modifications' : 'Continuer')}
        </Button>
        
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

