import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { 
  Alert, 
  Dimensions, 
  Linking, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Image,
  Modal,
  Platform 
} from 'react-native';
import { ActivityIndicator, Avatar, Button, Chip, Divider, Text, TextInput } from 'react-native-paper';
import StarRating from '../../components/StarRating';
import { favoritesApi } from '../../api/favorites';
import { propertyApi } from '../../api/properties';
import { useAuthStore } from '../../store/authStore';
import { Property } from '../../types';
import { formatCurrency, formatDate } from '../../utils/currency';
import { COLORS } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const user = useAuthStore((s) => s.user);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadProperty();
  }, [id]);

  async function loadProperty() {
    try {
      const { data } = await propertyApi.get(id);
      setProperty(data.data);
    } catch (error) {
      console.error('Error loading property:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la propriété');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavorite() {
    if (!user) { 
      navigation.navigate('Login'); 
      return; 
    }
    if (!property) return;
    try {
      await favoritesApi.toggle(property.id);
      setProperty((p) => p ? { ...p, is_favorited: !p.is_favorited } : p);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  async function handleSubmitReview() {
    if (!user) { 
      navigation.navigate('Login'); 
      return; 
    }
    if (reviewRating === 0) { 
      Alert.alert('Erreur', 'Veuillez sélectionner une note'); 
      return; 
    }
    try {
      await propertyApi.createReview(id, { rating: reviewRating, comment: reviewComment });
      await loadProperty();
      setReviewRating(0);
      setReviewComment('');
      Alert.alert('Succès', 'Votre avis a été ajouté');
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error ?? 'Erreur lors de l\'ajout de l\'avis');
    }
  }

  function handleContact(contactType: 'whatsapp' | 'phone') {
    if (!property) return;
    
    if (contactType === 'whatsapp' && property.whatsapp_contact) {
      const url = `whatsapp://send?phone=${property.whatsapp_contact.replace(/[^0-9]/g, '')}`;
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://wa.me/${property.whatsapp_contact.replace(/[^0-9]/g, '')}`);
        }
      }).catch(() => {
        Alert.alert('Erreur', 'WhatsApp n\'est pas installé sur cet appareil');
      });
    } else if (contactType === 'phone' && property.phone_contact) {
      Linking.openURL(`tel:${property.phone_contact}`);
    }
  }

  function openFullScreenImage(imageUrl: string) {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Chargement des détails...</Text>
      </View>
    );
  }
  
  if (!property) {
    return (
      <View style={styles.notFoundContainer}>
        <Ionicons name="home-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.notFound}>Propriété introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = property.images ?? [];

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.gallery}>
          {images.length > 0 ? (
            <TouchableOpacity onPress={() => openFullScreenImage(images[currentImageIdx]?.filename)}>
              <Image source={{ uri: images[currentImageIdx]?.filename }} style={styles.mainImage} resizeMode="cover" />
            </TouchableOpacity>
          ) : (
            <View style={[styles.mainImage, styles.imagePlaceholder]}>
              <Ionicons name="home-outline" size={60} color={COLORS.textLight} />
            </View>
          )}
          
          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnails}>
              {images.map((img, idx) => (
                <TouchableOpacity key={img.id} onPress={() => setCurrentImageIdx(idx)}>
                  <Image
                    source={{ uri: img.filename }}
                    style={[styles.thumb, idx === currentImageIdx && styles.thumbActive]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          <TouchableOpacity style={styles.favoriteBtn} onPress={handleToggleFavorite}>
            <Ionicons
              name={property.is_favorited ? 'heart' : 'heart-outline'}
              size={26}
              color={property.is_favorited ? COLORS.danger : '#fff'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.backBtnGallery} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Title & Price */}
          <View style={styles.titleRow}>
            <View style={styles.badges}>
              <Chip compact style={styles.transactionChip}>
                <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins-Medium' }}>
                  {property.transaction_type}
                </Text>
              </Chip>
              <Chip compact style={[styles.statusChip, property.is_available ? styles.availableChip : styles.unavailableChip]}>
                <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins-Medium' }}>
                  {property.is_available ? 'Disponible' : 'Indisponible'}
                </Text>
              </Chip>
            </View>
          </View>

          <Text variant="headlineSmall" style={styles.title}>{property.title}</Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <Text style={styles.location}>{property.neighborhood}, {property.country}</Text>
          </View>

          <Text style={styles.price}>
            {formatCurrency(property.price, property.currency)}
            {property.transaction_type === 'À louer' && <Text style={styles.perMonth}> /mois</Text>}
          </Text>

          {property.review_count > 0 && (
            <TouchableOpacity style={styles.ratingRow}>
              <StarRating rating={property.average_rating} size={16} />
              <Text style={styles.ratingText}>
                {property.average_rating.toFixed(1)} ({property.review_count} avis)
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          )}

          <Divider style={styles.divider} />

          {/* Owner Information */}
          <View style={styles.ownerSection}>
            <Text style={styles.sectionTitle}>Propriétaire</Text>
            <View style={styles.ownerCard}>
              <Avatar.Image 
                size={60} 
                source={{ 
                  uri: property.user?.profile_picture || 
                       'https://ui-avatars.com/api/?background=0D9488&color=fff&name=' + 
                       encodeURIComponent(`${property.user?.first_name || ''}+${property.user?.last_name || ''}`)
                }} 
              />
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>
                  {property.user?.first_name} {property.user?.last_name}
                </Text>
                <Text style={styles.ownerSince}>
                  Membre depuis {property.user?.created_at ? new Date(property.user.created_at).getFullYear() : '2024'}
                </Text>
                <View style={styles.ownerStats}>
                  <Text style={styles.ownerStat}>
                    <Ionicons name="location-outline" size={12} color={COLORS.textLight} /> {property.user?.country || 'Non spécifié'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Details */}
          <Text style={styles.sectionTitle}>Caractéristiques</Text>
          <View style={styles.detailsGrid}>
            {[
              { icon: 'home-outline', label: property.property_type },
              { icon: 'bed-outline', label: `${property.rooms} pièce${property.rooms > 1 ? 's' : ''}` },
              { icon: 'water-outline', label: `${property.bathrooms} salle de bain${property.bathrooms > 1 ? 's' : ''}` },
              property.surface ? { icon: 'resize-outline', label: `${property.surface} m²` } : null,
              property.shower_type ? { icon: 'sparkles-outline', label: property.shower_type === 'interne' ? 'Douche interne' : 'Douche externe' } : null,
            ].filter(Boolean).map((detail, idx) => (
              <View key={idx} style={styles.detailItem}>
                <Ionicons name={(detail as any).icon} size={20} color={COLORS.primary} />
                <Text style={styles.detailText}>{(detail as any).label}</Text>
              </View>
            ))}
          </View>

          {/* Amenities */}
          {(property.has_water || property.has_electricity || property.has_courtyard) && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Équipements</Text>
              <View style={styles.amenities}>
                {property.has_water && (
                  <Chip icon="water" compact style={styles.amenityChip}>
                    <Text style={styles.amenityText}>Eau courante</Text>
                  </Chip>
                )}
                {property.has_electricity && (
                  <Chip icon="flash" compact style={styles.amenityChip}>
                    <Text style={styles.amenityText}>Électricité</Text>
                  </Chip>
                )}
                {property.has_courtyard && (
                  <Chip icon="flower" compact style={styles.amenityChip}>
                    <Text style={styles.amenityText}>Cour</Text>
                  </Chip>
                )}
              </View>
            </>
          )}

          {property.description && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{property.description}</Text>
            </>
          )}

          {property.exact_address && (
            <View style={styles.addressRow}>
              <Ionicons name="map-outline" size={18} color={COLORS.primary} />
              <Text style={styles.address}>{property.exact_address}</Text>
            </View>
          )}

          <Divider style={styles.divider} />

          {/* Contact Buttons */}
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.contactRow}>
            {property.whatsapp_contact && (
              <Button
                mode="contained"
                icon="whatsapp"
                onPress={() => handleContact('whatsapp')}
                style={[styles.contactBtn, styles.whatsappBtn]}
                labelStyle={styles.contactBtnText}
              >
                WhatsApp
              </Button>
            )}
            {property.phone_contact && (
              <Button
                mode="outlined"
                icon="phone"
                onPress={() => handleContact('phone')}
                style={styles.contactBtn}
                labelStyle={styles.contactBtnOutlineText}
              >
                Appeler
              </Button>
            )}
          </View>

          {/* Reviews Section */}
          <Divider style={styles.divider} />
          
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Avis ({property.review_count})</Text>
            {property.review_count > 0 && (
              <Text style={styles.averageRating}>{property.average_rating.toFixed(1)} ★</Text>
            )}
          </View>

          {(property.reviews ?? []).map((review) => (
            <View key={review.id} style={styles.review}>
              <View style={styles.reviewHeader}>
                <Avatar.Text
                  size={40}
                  label={`${review.user?.first_name?.[0] ?? '?'}${review.user?.last_name?.[0] ?? ''}`}
                  style={{ backgroundColor: COLORS.primary + '20' }}
                  labelStyle={{ color: COLORS.primary, fontFamily: 'Poppins-Medium' }}
                />
                <View style={styles.reviewMeta}>
                  <Text style={styles.reviewAuthor}>
                    {review.user?.first_name} {review.user?.last_name}
                  </Text>
                  <StarRating rating={review.rating} size={14} />
                </View>
                <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
              </View>
              {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
            </View>
          ))}

          {/* Add Review Section */}
          {user && (
            <View style={styles.addReviewSection}>
              <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Laisser un avis</Text>
              <View style={styles.ratingInput}>
                <Text style={styles.ratingLabel}>Votre note :</Text>
                <StarRating rating={reviewRating} interactive onRate={setReviewRating} size={32} />
              </View>
              <TextInput
                mode="outlined"
                label="Votre commentaire (optionnel)"
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
                numberOfLines={3}
                style={styles.reviewInput}
                outlineColor="#e9ecef"
                activeOutlineColor={COLORS.primary}
              />
              <Button 
                mode="contained" 
                onPress={handleSubmitReview} 
                style={styles.submitReviewBtn}
                buttonColor={COLORS.primary}
              >
                Publier l'avis
              </Button>
            </View>
          )}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeModalBtn} 
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullScreenImage} 
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    gap: 12,
  },
  loaderText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    gap: 16,
  },
  notFound: { 
    fontFamily: 'Poppins-Medium',
    fontSize: 16, 
    color: COLORS.textLight,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 25,
  },
  backBtnText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },
  gallery: { 
    position: 'relative',
    backgroundColor: '#000',
  },
  mainImage: { 
    width, 
    height: height * 0.45,
  },
  imagePlaceholder: { 
    backgroundColor: '#f0f0f0', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  thumbnails: { 
    padding: 12, 
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  thumb: { 
    width: 60, 
    height: 60, 
    borderRadius: 8, 
    marginRight: 8, 
    borderWidth: 2, 
    borderColor: 'transparent' 
  },
  thumbActive: { 
    borderColor: COLORS.primary 
  },
  favoriteBtn: {
    position: 'absolute', 
    top: 16, 
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.4)', 
    borderRadius: 25, 
    padding: 10,
    zIndex: 1,
  },
  backBtnGallery: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 25,
    padding: 10,
    zIndex: 1,
  },
  content: { 
    padding: 20,
  },
  titleRow: { 
    flexDirection: 'row', 
    marginBottom: 12,
  },
  badges: { 
    flexDirection: 'row', 
    gap: 10,
  },
  transactionChip: {
    backgroundColor: COLORS.primary,
  },
  statusChip: {
    backgroundColor: COLORS.secondary,
  },
  availableChip: {
    backgroundColor: '#10b981',
  },
  unavailableChip: {
    backgroundColor: '#ef4444',
  },
  title: { 
    fontFamily: 'Poppins-Bold', 
    fontSize: 24,
    color: '#333', 
    marginBottom: 8,
  },
  locationRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 12,
  },
  location: { 
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  price: { 
    fontSize: 28, 
    fontFamily: 'Poppins-Bold', 
    color: COLORS.primary, 
    marginBottom: 8,
  },
  perMonth: { 
    fontSize: 14, 
    fontFamily: 'Poppins-Regular', 
    color: '#666',
  },
  ratingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    marginTop: 4,
  },
  ratingText: { 
    fontFamily: 'Poppins-Medium',
    fontSize: 13, 
    color: '#666',
  },
  divider: { 
    marginVertical: 20,
    backgroundColor: '#e9ecef',
  },
  ownerSection: {
    marginBottom: 8,
  },
  sectionTitle: { 
    fontFamily: 'Poppins-SemiBold', 
    fontSize: 18, 
    color: '#333', 
    marginBottom: 12,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  ownerSince: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  ownerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  ownerStat: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: '#666',
  },
  detailsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 16,
  },
  detailItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    width: '45%',
    paddingVertical: 6,
  },
  detailText: { 
    fontFamily: 'Poppins-Regular',
    fontSize: 14, 
    color: '#555',
  },
  amenities: { 
    flexDirection: 'row', 
    gap: 10, 
    flexWrap: 'wrap',
  },
  amenityChip: { 
    backgroundColor: '#f0fdf4',
  },
  amenityText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#10b981',
  },
  description: { 
    fontFamily: 'Poppins-Regular',
    fontSize: 14, 
    color: '#555', 
    lineHeight: 22,
  },
  addressRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  address: { 
    fontFamily: 'Poppins-Regular',
    fontSize: 13, 
    color: '#666', 
    flex: 1,
  },
  contactRow: { 
    flexDirection: 'row', 
    gap: 12,
    marginBottom: 8,
  },
  contactBtn: { 
    flex: 1, 
    borderRadius: 12,
    height: 48,
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
  },
  contactBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
  contactBtnOutlineText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: COLORS.primary,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  averageRating: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: COLORS.primary,
  },
  review: { 
    marginBottom: 16, 
    padding: 16, 
    backgroundColor: '#fff', 
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  reviewHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
  },
  reviewMeta: { 
    flex: 1,
  },
  reviewAuthor: { 
    fontFamily: 'Poppins-SemiBold', 
    fontSize: 14, 
    color: '#333',
    marginBottom: 4,
  },
  reviewDate: { 
    fontSize: 11, 
    fontFamily: 'Poppins-Regular', 
    color: '#999',
  },
  reviewComment: { 
    marginTop: 12, 
    fontFamily: 'Poppins-Regular',
    fontSize: 13, 
    color: '#555', 
    lineHeight: 20,
  },
  addReviewSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  ratingInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  ratingLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
  },
  reviewInput: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  submitReviewBtn: {
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 8,
  },
  fullScreenImage: {
    width: width,
    height: height,
  },
});