import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  Share,
  TouchableOpacity,
  View,
  Image,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import styles from './PropertyDetailScreen.styles';
import { ActivityIndicator, Button, Chip, Divider, Text, TextInput } from 'react-native-paper';
import StarRating from '../../components/StarRating';
import { favoritesApi } from '../../api/favorites';
import { messagingApi } from '../../api/messaging';
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
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [contactingOwner, setContactingOwner] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [ownerImgError, setOwnerImgError] = useState(false);
  const [reviewImgErrors, setReviewImgErrors] = useState<Record<number, boolean>>({});

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
      setProperty((p) => (p ? { ...p, is_favorited: !p.is_favorited } : p));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  const isOwner = user?.id === property?.owner_id;

  async function handleDeleteProperty() {
    if (!property) return;
    Alert.alert(
      'Supprimer l\'annonce',
      'Cette action est irréversible. Voulez-vous vraiment supprimer cette propriété ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await propertyApi.delete(property.id);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Erreur', e.response?.data?.error ?? 'Impossible de supprimer l\'annonce');
            }
          },
        },
      ]
    );
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
      Alert.alert('Avis publié', 'Merci pour votre retour !');
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error ?? 'Erreur lors de l\'ajout de l\'avis');
    }
  }

  async function handleStartConversation() {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    if (!property) return;
    setContactingOwner(true);
    try {
      const { data } = await messagingApi.startConversation(property.id);
      const conv = data.data;
      const ownerName =
        `${property.user?.first_name ?? ''} ${property.user?.last_name ?? ''}`.trim() || 'Propriétaire';
      navigation.navigate('Chat', { conversationId: conv.id, name: ownerName });
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error ?? 'Impossible de démarrer la conversation');
    } finally {
      setContactingOwner(false);
    }
  }

  function openFullScreenImage(imageUrl: string) {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  }

  function getMemberSinceYear(): string {
    const raw = property?.user?.member_since ?? property?.user?.created_at;
    if (!raw) return new Date().getFullYear().toString();
    try {
      const date = new Date(raw);
      if (!isNaN(date.getTime())) return date.getFullYear().toString();
    } catch {}
    return new Date().getFullYear().toString();
  }

  function buildShareText() {
    if (!property) return '';
    const priceStr = formatCurrency(property.price, property.currency);
    const rental = property.transaction_type === 'À louer';
    let msg = `*${property.title}*\n`;
    msg += `Quartier : ${property.neighborhood}, ${property.country}\n`;
    msg += `Type : ${property.property_type} – ${property.transaction_type}\n`;
    msg += `Prix : *${priceStr}${rental ? '/mois' : ''}*\n`;
    msg += `${property.rooms} pièce${property.rooms > 1 ? 's' : ''} | ${property.bathrooms} salle${
      property.bathrooms > 1 ? 's' : ''
    } de bain`;
    if (property.surface) msg += ` | ${property.surface} m²`;
    msg += '\n';
    if (property.has_water || property.has_electricity || property.has_courtyard) {
      const items = [
        property.has_water && 'Eau courante',
        property.has_electricity && 'Électricité',
        property.has_courtyard && 'Cour',
      ].filter(Boolean);
      msg += items.join(', ') + '\n';
    }
    msg += property.is_available ? 'Disponible\n' : 'Indisponible\n';
    if (property.description) msg += `\n${property.description}\n`;
    msg += '\nDécouvrez plus de biens sur Gidana.';
    return msg;
  }

  async function downloadPropertyImage(): Promise<string | null> {
    const mainImage = property?.images?.find((img) => img.is_main) ?? property?.images?.[0];
    if (!mainImage?.filename) return null;
    const ext = mainImage.filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const safeName = (property?.title ?? 'annonce')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .slice(0, 40);
    const localUri = `${FileSystem.cacheDirectory}Gidana-Annonce-${safeName}.${ext}`;
    try {
      const { uri } = await FileSystem.downloadAsync(mainImage.filename, localUri);
      return uri;
    } catch {
      return null;
    }
  }

  async function handleShareNative() {
    setShareModalVisible(false);
    const localUri = await downloadPropertyImage();
    try {
      if (localUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(localUri, {
          dialogTitle: buildShareText(),
          mimeType: 'image/jpeg',
        });
      } else {
        await Share.share({ message: buildShareText() });
      }
    } catch {}
  }

  async function handleShareWhatsApp() {
    setShareModalVisible(false);
    const localUri = await downloadPropertyImage();
    try {
      if (localUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(localUri, {
          dialogTitle: buildShareText(),
          mimeType: 'image/jpeg',
        });
      } else {
        const url = `whatsapp://send?text=${encodeURIComponent(buildShareText())}`;
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert(
        'WhatsApp non disponible',
        "Impossible d'ouvrir WhatsApp. Vérifiez qu'il est bien installé."
      );
    }
  }

  async function handleShareFacebook() {
    setShareModalVisible(false);
    const localUri = await downloadPropertyImage();
    try {
      if (localUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(localUri, {
          dialogTitle: buildShareText(),
          mimeType: 'image/jpeg',
        });
      } else {
        const mainImage = property?.images?.find((img) => img.is_main) ?? property?.images?.[0];
        const shareUrl = mainImage?.filename ? encodeURIComponent(mainImage.filename) : '';
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        await Linking.openURL(fbUrl);
      }
    } catch {
      await Share.share({ message: buildShareText() });
    }
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
  const hasValidProfilePic =
    property.user?.profile_picture &&
    property.user.profile_picture.trim() !== '' &&
    !ownerImgError;

  return (
    <>
      <StatusBar style="light" translucent />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image Gallery Carousel */}
        <View style={styles.gallery}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentImageIdx(idx);
              }}
            >
              {images.map((img) => (
                <TouchableOpacity
                  key={img.id}
                  activeOpacity={0.95}
                  onPress={() => openFullScreenImage(img.filename)}
                >
                  <Image source={{ uri: img.filename }} style={styles.mainImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.mainImage, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={60} color={COLORS.textLight} />
            </View>
          )}

          {images.length > 1 && (
            <View style={styles.dotsContainer}>
              {images.map((_, idx) => (
                <View key={idx} style={[styles.dot, idx === currentImageIdx && styles.dotActive]} />
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.shareBtn, { top: insets.top + 10 }]}
            onPress={() => setShareModalVisible(true)}
          >
            <Ionicons name="share-social-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.favoriteBtn, { top: insets.top + 10 }]}
            onPress={handleToggleFavorite}
          >
            <Ionicons
              name={property.is_favorited ? 'heart' : 'heart-outline'}
              size={26}
              color={property.is_favorited ? COLORS.danger : '#fff'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backBtnGallery, { top: insets.top + 10 }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIdx + 1} / {images.length}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Owner Actions */}
          {isOwner && (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={styles.ownerEditBtn}
                onPress={() =>
                  navigation.navigate('AddProperty', {
                    mode: 'edit',
                    propertyId: property.id,
                    property,
                  })
                }
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
                <Text style={styles.ownerEditText}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ownerDeleteBtn}
                onPress={handleDeleteProperty}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text style={styles.ownerDeleteText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Title & Price */}
          <View style={styles.titleRow}>
            <View style={styles.badges}>
              <Chip compact style={styles.transactionChip}>
                <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins-Medium' }}>
                  {property.transaction_type}
                </Text>
              </Chip>
              <Chip
                compact
                style={[
                  styles.statusChip,
                  property.is_available ? styles.availableChip : styles.unavailableChip,
                ]}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins-Medium' }}>
                  {property.is_available ? 'Disponible' : 'Indisponible'}
                </Text>
              </Chip>
            </View>
          </View>

          <Text variant="headlineSmall" style={styles.title}>
            {property.title}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <Text style={styles.location}>
              {property.neighborhood}, {property.country}
            </Text>
          </View>

          <Text style={styles.price}>
            {formatCurrency(property.price, property.currency)}
            {property.transaction_type === 'À louer' && (
              <Text style={styles.perMonth}> /mois</Text>
            )}
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
              {hasValidProfilePic ? (
                <Image
                  source={{ uri: property.user.profile_picture }}
                  style={styles.ownerAvatar}
                  onError={() => setOwnerImgError(true)}
                />
              ) : (
                <View
                  style={[
                    styles.ownerAvatarPlaceholder,
                    { backgroundColor: COLORS.primary + '20' },
                  ]}
                >
                  <Ionicons name="person-outline" size={30} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.ownerInfo}>
                <View style={styles.ownerNameRow}>
                  <Text style={styles.ownerName}>
                    {isOwner
                      ? 'Vous'
                      : `${property.user?.first_name || ''} ${property.user?.last_name || ''}`.trim() ||
                        'Propriétaire'}
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#fff" />
                    <Text style={styles.verifiedText}>Vérifié</Text>
                  </View>
                </View>
                {!isOwner && property.user?.email ? (
                  <Text style={styles.ownerContact}>{property.user.email}</Text>
                ) : null}
                {!isOwner && property.user?.phone_number ? (
                  <Text style={styles.ownerContact}>{property.user.phone_number}</Text>
                ) : null}
                <Text style={styles.ownerSince}>Membre depuis {getMemberSinceYear()}</Text>
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
              {
                icon: 'water-outline',
                label: `${property.bathrooms} salle de bain${property.bathrooms > 1 ? 's' : ''}`,
              },
              property.surface ? { icon: 'resize-outline', label: `${property.surface} m²` } : null,
              property.shower_type
                ? {
                    icon: 'sparkles-outline',
                    label: property.shower_type === 'interne' ? 'Douche interne' : 'Douche externe',
                  }
                : null,
            ]
              .filter(Boolean)
              .map((detail, idx) => (
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

          {/* Contact – in-app messaging only */}
          {!isOwner && (
            <Button
              mode="contained"
              icon="message-text"
              loading={contactingOwner}
              disabled={contactingOwner}
              onPress={handleStartConversation}
              style={styles.messageBtn}
              buttonColor={COLORS.primary}
              labelStyle={styles.messageBtnText}
            >
              Contacter le propriétaire
            </Button>
          )}

          {/* Reviews Section */}
          <Divider style={styles.divider} />

          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Avis ({property.review_count})</Text>
            {property.review_count > 0 && (
              <Text style={styles.averageRating}>{property.average_rating.toFixed(1)} ★</Text>
            )}
          </View>

          {(property.reviews ?? []).map((review) => {
            const hasValidReviewPic =
              review.user?.profile_picture && !reviewImgErrors[review.id];
            return (
              <View key={review.id} style={styles.review}>
                <View style={styles.reviewHeader}>
                  {hasValidReviewPic ? (
                    <Image
                      source={{ uri: review.user.profile_picture }}
                      style={styles.reviewAvatar}
                      onError={() =>
                        setReviewImgErrors((prev) => ({ ...prev, [review.id]: true }))
                      }
                    />
                  ) : (
                    <View
                      style={[
                        styles.reviewAvatarPlaceholder,
                        { backgroundColor: COLORS.primary + '20' },
                      ]}
                    >
                      <Ionicons name="person-outline" size={22} color={COLORS.primary} />
                    </View>
                  )}
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
            );
          })}

          {/* Add Review Section */}
          {user && (
            <View style={styles.addReviewSection}>
              <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Laisser un avis</Text>
              <View style={styles.ratingInput}>
                <Text style={styles.ratingLabel}>Votre note :</Text>
                <StarRating
                  rating={reviewRating}
                  interactive
                  onRate={setReviewRating}
                  size={32}
                />
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

      {/* Share Modal */}
      <Modal
        visible={shareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.shareOverlay}
          activeOpacity={1}
          onPress={() => setShareModalVisible(false)}
        >
          <View style={styles.shareSheet}>
            <View style={styles.shareHandle} />
            <Text style={styles.shareTitle}>Partager cette propriété</Text>

            <View style={styles.shareOptions}>
              <TouchableOpacity style={styles.shareOption} onPress={handleShareWhatsApp}>
                <View style={[styles.shareOptionIcon, { backgroundColor: '#25D366' }]}>
                  <Ionicons name="logo-whatsapp" size={26} color="#fff" />
                </View>
                <Text style={styles.shareOptionLabel}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareOption} onPress={handleShareFacebook}>
                <View style={[styles.shareOptionIcon, { backgroundColor: '#1877F2' }]}>
                  <Ionicons name="logo-facebook" size={26} color="#fff" />
                </View>
                <Text style={styles.shareOptionLabel}>Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareOption} onPress={handleShareNative}>
                <View style={[styles.shareOptionIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="share-outline" size={26} color="#fff" />
                </View>
                <Text style={styles.shareOptionLabel}>Autres</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.shareCancelBtn}
              onPress={() => setShareModalVisible(false)}
            >
              <Text style={styles.shareCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Full Screen Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeModalBtn} onPress={() => setModalVisible(false)}>
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

