import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../utils/theme';

interface Props {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({ rating, maxStars = 5, size = 20, interactive = false, onRate }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: maxStars }, (_, i) => {
        const filled = i < Math.round(rating);
        return interactive ? (
          <TouchableOpacity key={i} onPress={() => onRate?.(i + 1)}>
            <Ionicons name={filled ? 'star' : 'star-outline'} size={size} color={filled ? COLORS.accent : COLORS.border} />
          </TouchableOpacity>
        ) : (
          <Ionicons key={i} name={filled ? 'star' : 'star-outline'} size={size} color={filled ? COLORS.accent : COLORS.border} />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
