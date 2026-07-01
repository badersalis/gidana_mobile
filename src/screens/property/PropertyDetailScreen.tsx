import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import styles from './PropertyDetailScreen.styles';
import { ActivityIndicator, Button, Chip, Divider, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import StarRating from '../../components/StarRating';
import { favoritesApi } from '../../api/favorites';
import { messagingApi } from '../../api/messaging';
import { propertyApi } from '../../api/properties';
import { useAuthStore } from '../../store/authStore';
import { Property } from '../../types';
import { formatCurrency, formatDate } from '../../utils/currency';
import { COLORS } from '../../utils/theme';

const { width } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
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
      Alert.alert(t('common.error'), t('propertyDetail.propertyError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavorite() {
    if (!user) { navigation.navigate('Login'); return; }
    if (!property) return;
    try {
      await favoritesApi.toggle(property.id);
      setProperty((p) => (p ? { ...p, is_favorited: !p.is_favorited } : p));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  const isOwner = user?.id === property?.owner_id;
  const ownerUser = property?.user ?? property?.owner;

  async function handleDeleteProperty() {
    if (!property) return;
    Alert.alert(
      t('propertyDetail.deleteProperty'),
      t('propertyDetail.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('propertyDetail.deleteProperty'),
          style: 'destructive',
          onPress: async () => {
            try {
              await propertyApi.delete(property.id);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert(t('common.error'), e.response?.data?.error ?? t('propertyDetail.deleteError'));
            }
          },
        },
      ]
    );
  }

  async function handleSubmitReview() {
    if (!user) { navigation.navigate('Login'); return; }
    if (reviewRating === 0) {
      Alert.alert(t('common.error'), t('propertyDetail.ratingRequired'));
      return;
    }
    try {
      await propertyApi.createReview(id, { rating: reviewRating, comment: reviewComment });
      await loadProperty();
      setReviewRating(0);
      setReviewComment('');
      Alert.alert(t('propertyDetail.reviewPublished'), t('propertyDetail.reviewPublishedDesc'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e.response?.data?.error ?? t('propertyDetail.reviewError'));
    }
  }

  async function handleStartConversation() {
    if (!user) { navigation.navigate('Login'); return; }
    if (!property) return;
    setContactingOwner(true);
    try {
      const { data } = await messagingApi.startConversation(property.id);
      const conv = data.data;
      const owner = property.user ?? property.owner;
      const ownerName =
        `${owner?.first_name ?? ''} ${owner?.last_name ?? ''}`.trim() || t('propertyDetail.owner');
      const ownerInitials =
        `${owner?.first_name?.[0] ?? ''}${owner?.last_name?.[0] ?? ''}`.toUpperCase() || undefined;
      const autoMessage = t('propertyDetail.autoMessage', { title: property.title });
      navigation.navigate('Chat', {
        conversationId: conv.id,
        name: ownerName,
        autoMessage,
        otherUserAvatar: owner?.profile_picture ?? undefined,
        otherUserInitials: ownerInitials,
      });
    } catch (e: any) {
      Alert.alert(t('common.error'), e.response?.data?.error ?? t('propertyDetail.conversationError'));
    } finally {
      setContactingOwner(false);
    }
  }

  function openFullScreenImage(imageUrl: string) {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  }

  function getMemberSinceYear(): string {
    const raw = ownerUser?.member_since ?? ownerUser?.created_at;
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
    const rental = property.transaction_type === 'for_rent';
    let msg = `*${property.title}*\n`;
    msg += `${property.neighborhood}, ${property.country}\n`;
    msg += `${t(`propertyTypes.${property.property_type}`, property.property_type)} – ${property.transaction_type === 'for_rent' ? t('explore.forRent') : t('explore.forSale')}\n`;
    msg += `*${priceStr}${rental ? t('propertyDetail.perMonth') : ''}*\n`;
    msg += `${property.rooms} | ${property.bathrooms}`;
    if (property.surface) msg += ` | ${property.surface} m²`;
    msg += '\n';
    if (property.has_water || property.has_electricity || property.has_courtyard) {
      const items = [
        property.has_water && t('propertyDetail.runningWater'),
        property.has_electricity && t('propertyDetail.electricity'),
        property.has_courtyard && t('propertyDetail.courtyard'),
      ].filter(Boolean);
      msg += items.join(', ') + '\n';
    }
    msg += property.is_available ? t('propertyDetail.available') + '\n' : t('propertyDetail.unavailable') + '\n';
    if (property.description) msg += `\n${property.description}\n`;
    msg += '\n' + t('propertyDetail.moreOnGidana');
    return msg;
  }

  async function handleShareWhatsApp() {
    setShareModalVisible(false);
    if (!property) return;
    const message = buildShareText();
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() =>
      Alert.alert(t('propertyDetail.whatsappNotAvailable'), t('propertyDetail.whatsappNotAvailableDesc'))
    );
  }

  async function handleShareFacebook() {
    setShareModalVisible(false);
    if (!property) return;
    const message = buildShareText();
    Linking.openURL(`fb-messenger://share/?message=${encodeURIComponent(message)}`).catch(() =>
      Share.share({ message })
    );
  }

  async function handleShareNative() {
    setShareModalVisible(false);
    try {
      await Share.share({ message: buildShareText() });
    } catch (error) {
      console.error('Error in native share:', error);
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>{t('propertyDetail.loading')}</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.notFoundContainer}>
        <Ionicons name="home-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.notFound}>{t('propertyDetail.notFound')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{t('propertyDetail.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = property.images ?? [];
  const hasValidProfilePic =
    ownerUser?.profile_picture &&
    ownerUser.profile_picture.trim() !== '' &&
    !ownerImgError;

  return (
    <>
      <StatusBar style="light" translucent />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
                  <Image source={{ uri: img.filename }} style={styles.mainImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.mainImage, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={60} color={COLORS.textLight} />
            </View>
          )}

          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'transparent']}
            style={[styles.statusBarGradient, { height: insets.top + 60 }]}
            pointerEvents="none"
          />

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
                <Text style={styles.ownerEditText}>{t('propertyDetail.edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ownerDeleteBtn}
                onPress={handleDeleteProperty}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text style={styles.ownerDeleteText}>{t('propertyDetail.deleteProperty')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.titleRow}>
            <View style={styles.badges}>
              <Chip compact style={styles.transactionChip}>
                <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins-Medium' }}>
                  {property.transaction_type === 'for_rent' ? t('explore.forRent') : t('explore.forSale')}
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
                  {property.is_available ? t('propertyDetail.available') : t('propertyDetail.unavailable')}
                </Text>
              </Chip>
            </View>
          </View>

          <Text variant="headlineSmall" style={styles.title}>{property.title}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <Text style={styles.location}>
              {property.neighborhood}, {property.country}
            </Text>
          </View>

          <Text style={styles.price}>
            {formatCurrency(property.price, property.currency)}
            {property.transaction_type === 'for_rent' && (
              <Text style={styles.perMonth}>{t('propertyDetail.perMonth')}</Text>
            )}
          </Text>

          {property.review_count > 0 && (
            <TouchableOpacity style={styles.ratingRow}>
              <StarRating rating={property.average_rating} size={16} />
              <Text style={styles.ratingText}>
                {property.average_rating.toFixed(1)} ({property.review_count})
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          )}

          <Divider style={styles.divider} />

          <View style={styles.ownerSection}>
            <Text style={styles.sectionTitle}>{t('propertyDetail.owner')}</Text>
            <View style={styles.ownerCard}>
              {hasValidProfilePic ? (
                <Image
                  source={{ uri: ownerUser!.profile_picture }}
                  style={styles.ownerAvatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                  onError={() => setOwnerImgError(true)}
                />
              ) : (
                <View style={[styles.ownerAvatarPlaceholder, { backgroundColor: COLORS.primary + '20' }]}>
                  <Ionicons name="person-outline" size={30} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.ownerInfo}>
                <View style={styles.ownerNameRow}>
                  <Text style={styles.ownerName}>
                    {isOwner
                      ? t('propertyDetail.you')
                      : `${ownerUser?.first_name || ''} ${ownerUser?.last_name || ''}`.trim() ||
                        t('propertyDetail.owner')}
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#fff" />
                    <Text style={styles.verifiedText}>{t('propertyDetail.verified')}</Text>
                  </View>
                </View>
                <Text style={styles.ownerSince}>{t('propertyDetail.memberSince', { year: getMemberSinceYear() })}</Text>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.sectionTitle}>{t('propertyDetail.characteristics')}</Text>
          <View style={styles.detailsGrid}>
            {[
              { icon: 'home-outline', label: t(`propertyTypes.${property.property_type}`, property.property_type) },
              { icon: 'bed-outline', label: t('propertyDetail.rooms', { count: property.rooms }) },
              { icon: 'water-outline', label: t('propertyDetail.bathrooms', { count: property.bathrooms }) },
              property.surface ? { icon: 'resize-outline', label: `${property.surface} m²` } : null,
              property.shower_type
                ? {
                    icon: 'sparkles-outline',
                    label: property.shower_type === 'internal' ? t('propertyDetail.internalShower') : t('propertyDetail.externalShower'),
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

          {(property.has_water || property.has_electricity || property.has_courtyard) && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{t('propertyDetail.amenities')}</Text>
              <View style={styles.amenities}>
                {property.has_water && (
                  <Chip icon="water" compact style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{t('propertyDetail.runningWater')}</Text>
                  </Chip>
                )}
                {property.has_electricity && (
                  <Chip icon="flash" compact style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{t('propertyDetail.electricity')}</Text>
                  </Chip>
                )}
                {property.has_courtyard && (
                  <Chip icon="flower" compact style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{t('propertyDetail.courtyard')}</Text>
                  </Chip>
                )}
              </View>
            </>
          )}

          {property.description && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.sectionTitle}>{t('propertyDetail.description')}</Text>
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

          {!isOwner && (
            <Button
              mode="contained"
              icon="calendar-check"
              loading={contactingOwner}
              disabled={contactingOwner}
              onPress={handleStartConversation}
              style={styles.messageBtn}
              buttonColor={COLORS.primary}
              labelStyle={styles.messageBtnText}
            >
              {t('propertyDetail.reserve')}
            </Button>
          )}

          <Divider style={styles.divider} />

          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>{t('propertyDetail.reviews', { count: property.review_count })}</Text>
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
                      source={{ uri: review.user!.profile_picture }}
                      style={styles.reviewAvatar}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={150}
                      onError={() =>
                        setReviewImgErrors((prev) => ({ ...prev, [review.id]: true }))
                      }
                    />
                  ) : (
                    <View style={[styles.reviewAvatarPlaceholder, { backgroundColor: COLORS.primary + '20' }]}>
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

          {user && (
            <View style={styles.addReviewSection}>
              <Text style={[styles.sectionTitle, { marginTop: 8 }]}>{t('propertyDetail.leaveReview')}</Text>
              <View style={styles.ratingInput}>
                <Text style={styles.ratingLabel}>{t('propertyDetail.yourRating')}</Text>
                <StarRating rating={reviewRating} interactive onRate={setReviewRating} size={32} />
              </View>
              <TextInput
                mode="outlined"
                label={t('propertyDetail.yourComment')}
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
                {t('propertyDetail.publishReview')}
              </Button>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

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
            <Text style={styles.shareTitle}>{t('propertyDetail.shareProperty')}</Text>

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
                <Text style={styles.shareOptionLabel}>{t('propertyDetail.others')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.shareCancelBtn}
              onPress={() => setShareModalVisible(false)}
            >
              <Text style={styles.shareCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          )}
        </View>
      </Modal>
    </>
  );
}
