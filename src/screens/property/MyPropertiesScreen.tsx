import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from './MyPropertiesScreen.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Chip, Text } from 'react-native-paper';
import { propertyApi } from '../../api/properties';
import { Property } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { COLORS } from '../../utils/theme';

export default function MyPropertiesScreen() {
  const navigation = useNavigation<any>();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadMyProperties();
    }, [])
  );

  async function loadMyProperties() {
    try {
      setLoading(true);
      const { data } = await propertyApi.myListings();
      setProperties(data.data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger vos annonces');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
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
              await propertyApi.delete(id);
              setProperties((prev) => prev.filter((p) => p.id !== id));
            } catch (e: any) {
              Alert.alert('Erreur', e.response?.data?.error ?? 'Impossible de supprimer l\'annonce');
            }
          },
        },
      ]
    );
  }

  async function handleToggleAvailability(item: Property) {
    setTogglingId(item.id);
    try {
      await propertyApi.toggleAvailability(item.id);
      setProperties((prev) =>
        prev.map((p) => p.id === item.id ? { ...p, is_available: !p.is_available } : p)
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error ?? 'Impossible de modifier la disponibilité');
    } finally {
      setTogglingId(null);
    }
  }

  function renderItem({ item }: { item: Property }) {
    const mainImage = item.images?.find((i) => i.is_main) ?? item.images?.[0];
    const isToggling = togglingId === item.id;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
          activeOpacity={0.85}
        >
          {mainImage ? (
            <Image source={{ uri: mainImage.filename }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImage, styles.imagePlaceholder]}>
              <Ionicons name="home-outline" size={32} color={COLORS.textLight} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.primary} />
            <Text style={styles.cardLocation}>{item.neighborhood}, {item.country}</Text>
          </View>
          <Text style={styles.cardPrice}>{formatCurrency(item.price, item.currency)}</Text>

          <View style={styles.chipsRow}>
            <TouchableOpacity
              onPress={() => handleToggleAvailability(item)}
              disabled={isToggling}
              activeOpacity={0.7}
            >
              <Chip
                compact
                style={[styles.statusChip, item.is_available ? styles.availableChip : styles.unavailableChip]}
              >
                <Text style={styles.chipText}>
                  {isToggling ? '...' : item.is_available ? 'Disponible' : 'Indisponible'}
                </Text>
              </Chip>
            </TouchableOpacity>
            <Chip compact style={styles.typeChip}>
              <Text style={styles.typeChipText}>{item.transaction_type}</Text>
            </Chip>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('AddProperty', { mode: 'edit', propertyId: item.id, property: item })}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil-outline" size={15} color={COLORS.primary} />
              <Text style={styles.editBtnText}>Modifier</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={15} color="#ef4444" />
              <Text style={styles.deleteBtnText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes annonces</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProperty')}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={26} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : properties.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="home-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Aucune annonce</Text>
          <Text style={styles.emptySubtitle}>Publiez votre première propriété</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate('AddProperty')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.createBtnText}>Publier une annonce</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={loadMyProperties}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

