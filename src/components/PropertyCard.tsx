import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/currency';
import { COLORS } from '../utils/theme';
import { Property } from '../types';

interface Props {
  property: Property;
  onPress: () => void;
  onFavoriteToggle?: () => void;
}

export default function PropertyCard({ property, onPress, onFavoriteToggle }: Props) {
  const { t } = useTranslation();
  const mainImage = property.images?.find((i) => i.is_main) ?? property.images?.[0];
  const isRent = property.transaction_type === 'for_rent';

  return (
    <Card style={styles.card} elevation={2}>
      <View style={styles.imageContainer}>
        {mainImage ? (
          <Image
            source={{ uri: mainImage.filename }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="home-outline" size={40} color={COLORS.textLight} />
          </View>
        )}

        <View style={styles.badgeRow}>
          <View style={[styles.badge, isRent ? styles.rentBadge : styles.saleBadge]}>
            <Text style={styles.badgeText}>
              {isRent ? t('explore.forRent').toUpperCase() : t('explore.forSale').toUpperCase()}
            </Text>
          </View>
          {!property.is_available && (
            <View style={[styles.badge, styles.unavailableBadge]}>
              <Text style={styles.badgeText}>{t('propertyDetail.unavailable').toUpperCase()}</Text>
            </View>
          )}
        </View>

        {onFavoriteToggle && (
          <TouchableOpacity style={styles.favoriteBtn} onPress={onFavoriteToggle} activeOpacity={0.8}>
            <Ionicons
              name={property.is_favorited ? 'heart' : 'heart-outline'}
              size={20}
              color={property.is_favorited ? COLORS.danger : '#fff'}
            />
          </TouchableOpacity>
        )}
      </View>

      <Card.Content style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{property.title}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={COLORS.textLight} />
          <Text style={styles.location} numberOfLines={1}>
            {property.neighborhood}, {property.country}
          </Text>
        </View>

        <View style={styles.details}>
          {property.rooms ? (
            <View style={styles.detailItem}>
              <Ionicons name="albums-outline" size={13} color={COLORS.textLight} />
              <Text style={styles.detailText}>
                {property.rooms} {t(property.rooms === 1 ? 'propertyCard.room' : 'propertyCard.rooms')}
              </Text>
            </View>
          ) : null}
          {property.bathrooms ? (
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={13} color={COLORS.textLight} />
              <Text style={styles.detailText}>
                {property.bathrooms} {t(property.bathrooms === 1 ? 'propertyCard.bathroom' : 'propertyCard.bathrooms')}
              </Text>
            </View>
          ) : null}
          {property.surface ? (
            <View style={styles.detailItem}>
              <Ionicons name="expand-outline" size={13} color={COLORS.textLight} />
              <Text style={styles.detailText}>{property.surface} m²</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceLeft}>
            <Text style={styles.price}>{formatCurrency(property.price, property.currency)}</Text>
            {isRent && <Text style={styles.perMonth}>{t('home.perMonth')}</Text>}
            {property.review_count > 0 && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={COLORS.accent} />
                <Text style={styles.rating}>{property.average_rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.voirBtn} onPress={onPress} activeOpacity={0.8}>
            <Text style={styles.voirBtnText}>{t('propertyCard.view')}</Text>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.card,
  },
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  image: { width: '100%', height: 200 },
  imagePlaceholder: {
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  rentBadge: { backgroundColor: COLORS.primary },
  saleBadge: { backgroundColor: COLORS.secondary },
  unavailableBadge: { backgroundColor: COLORS.danger },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderRadius: 20,
    padding: 7,
  },

  content: { paddingTop: 10, paddingBottom: 12 },
  title: { fontFamily: 'Poppins-SemiBold', fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 },
  location: { fontFamily: 'Poppins-Regular', fontSize: 13, color: COLORS.textLight, flex: 1 },

  details: { marginBottom: 10 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  detailText: { fontFamily: 'Poppins-Regular', fontSize: 13, color: COLORS.textLight },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  priceLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  price: { fontFamily: 'Poppins-Bold', fontSize: 17, fontWeight: '700', color: COLORS.primary },
  perMonth: { fontFamily: 'Poppins-Regular', fontSize: 13, color: COLORS.textLight },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 6 },
  rating: { fontFamily: 'Poppins-Regular', fontSize: 12, color: COLORS.textLight },

  voirBtn: {
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  voirBtnText: { fontFamily: 'Poppins-SemiBold', color: COLORS.primary, fontWeight: '600', fontSize: 13 },
});
