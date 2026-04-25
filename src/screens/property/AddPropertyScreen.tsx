import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { 
  Alert, 
  Image, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  SafeAreaView, 
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { Button, Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { propertyApi } from '../../api/properties';
import { COLORS } from '../../utils/theme';

const { width } = Dimensions.get('window');
const PROPERTY_TYPES = ['Studio', 'Appart', 'Maison'];
const CURRENCIES = ['XOF', 'EUR', 'USD'];
const SHOWER_TYPES = ['interne', 'externe'];

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

export default function AddPropertyScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [country, setCountry] = useState('');
  const [propertyType, setPropertyType] = useState('Appart');
  const [transactionType, setTransactionType] = useState('À louer');
  const [rooms, setRooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [surface, setSurface] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('XOF');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showerType, setShowerType] = useState('interne');
  const [hasWater, setHasWater] = useState(false);
  const [hasElectricity, setHasElectricity] = useState(false);
  const [hasCourtyard, setHasCourtyard] = useState(false);
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
    if (!title || !neighborhood || !country || !rooms || !bathrooms || !price) {
      showAlert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (images.length < 3) {
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
      await propertyApi.create(formData);
      showAlert('Succès', 'Propriété ajoutée avec succès', () => navigation.goBack());
    } catch (e: any) {
      showAlert('Erreur', e.response?.data?.error ?? 'Erreur lors de l\'ajout');
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
        <Text style={styles.headerTitle}>Ajouter une propriété</Text>
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
          <Text style={styles.sectionTitle}>Localisation</Text>
          
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
          
          <TextInput 
            mode="outlined" 
            label="Adresse exacte (optionnel)" 
            value={address} 
            onChangeText={setAddress} 
            style={styles.input}
            outlineColor="#e9ecef"
            activeOutlineColor={COLORS.primary}
          />
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
            label="Surface (m²)" 
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
            label="WhatsApp" 
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
          {loading ? 'Publication en cours...' : 'Publier la propriété'}
        </Button>
        
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
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
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa',
  },
  scroll: { 
    padding: 16, 
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontFamily: 'Poppins-Bold', 
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: COLORS.primary,
  },
  sectionDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginBottom: 12,
  },
  label: { 
    fontSize: 14, 
    fontFamily: 'Poppins-Medium',
    color: '#666', 
    marginBottom: 8, 
    marginTop: 8,
  },
  input: { 
    marginBottom: 12, 
    backgroundColor: '#fff',
    fontSize: 15,
  },
  row: { 
    flexDirection: 'row', 
    gap: 12,
  },
  half: { 
    flex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  optionTextActive: {
    color: '#fff',
  },
  imageGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10,
  },
  imageWrapper: { 
    position: 'relative',
    width: (width - 62) / 3,
    height: (width - 62) / 3,
  },
  imageThumb: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 10,
  },
  removeImage: { 
    position: 'absolute', 
    top: -6, 
    right: -6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2,
  },
  imageNumber: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  imageNumberText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
  },
  addImageBtn: {
    width: (width - 62) / 3,
    height: (width - 62) / 3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  addImageText: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: COLORS.primary,
  },
  checkboxContainer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  priceContainer: {
    marginBottom: 12,
  },
  priceInput: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  currencySelector: {
    flexDirection: 'row',
    gap: 10,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  currencyButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  currencyText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  currencyTextActive: {
    color: '#fff',
  },
  submitBtn: { 
    marginTop: 8, 
    borderRadius: 12,
  },
  submitContent: { 
    paddingVertical: 10,
    height: 50,
  },
  submitLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});