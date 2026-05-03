import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

function Bone({ style }: { style?: object }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.bone, style, { opacity }]} />;
}

export default function PropertyCardSkeleton() {
  return (
    <View style={styles.card}>
      <Bone style={styles.image} />
      <View style={styles.body}>
        <Bone style={styles.titleLine} />
        <Bone style={styles.subLine} />
        <Bone style={styles.subLineShort} />
        <View style={styles.footer}>
          <Bone style={styles.priceLine} />
          <Bone style={styles.btnLine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  bone: { backgroundColor: '#e5e7eb', borderRadius: 6 },
  image: { width: '100%', height: 180, borderRadius: 0 },
  body: { padding: 14, gap: 10 },
  titleLine: { height: 17, width: '65%' },
  subLine: { height: 13, width: '50%' },
  subLineShort: { height: 13, width: '40%' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  priceLine: { height: 20, width: '35%' },
  btnLine: { height: 32, width: 68, borderRadius: 50 },
});
