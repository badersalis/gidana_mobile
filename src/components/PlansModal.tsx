import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useEffect, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/theme';

interface PlansModalProps {
  visible: boolean;
  onClose: () => void;
  defaultTab?: 'seekers' | 'landlords';
}

type SeekerTier = 'basic' | 'essential' | 'pro';
type LandlordTier = 'free' | 'standard' | 'agency';

const SEEKER_TIERS: SeekerTier[] = ['basic', 'essential', 'pro'];
const LANDLORD_TIERS: LandlordTier[] = ['free', 'standard', 'agency'];

const SEEKER_COLORS: Record<SeekerTier, string> = {
  basic:     '#64748b',
  essential: COLORS.primary,
  pro:       '#7c3aed',
};

const LANDLORD_COLORS: Record<LandlordTier, string> = {
  free:     '#64748b',
  standard: COLORS.primary,
  agency:   '#b45309',
};

function FeatureRow({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function PlanCard({
  name,
  price,
  perMonth,
  features,
  color,
  popular,
  isCurrent,
  onChoose,
}: {
  name: string;
  price: string;
  perMonth: string;
  features: string[];
  color: string;
  popular?: boolean;
  isCurrent?: boolean;
  onChoose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={[styles.card, popular && styles.cardPopular, { borderColor: popular ? color : '#e9ecef' }]}>
      {popular && (
        <View style={[styles.popularBadge, { backgroundColor: color }]}>
          <Text style={styles.popularText}>{t('plans.popular')}</Text>
        </View>
      )}
      <Text style={[styles.cardName, { color }]}>{name}</Text>
      <View style={styles.priceRow}>
        <Text style={[styles.cardPrice, { color: price === '0' ? '#aaa' : '#111' }]}>
          {price === '0' ? t('plans.free') : price}
        </Text>
        {price !== '0' && <Text style={styles.perMonth}>{perMonth}</Text>}
      </View>
      <View style={styles.featureList}>
        {features.map((f, i) => <FeatureRow key={i} text={f} />)}
      </View>
      <TouchableOpacity
        style={[
          styles.chooseBtn,
          { backgroundColor: isCurrent ? '#f3f4f6' : color },
        ]}
        onPress={onChoose}
        activeOpacity={0.85}
        disabled={isCurrent}
      >
        <Text style={[styles.chooseBtnText, { color: isCurrent ? '#aaa' : '#fff' }]}>
          {isCurrent ? t('plans.current') : t('plans.choose')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PlansModal({ visible, onClose, defaultTab = 'seekers' }: PlansModalProps) {
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(800)).current;
  const [tab, setTab] = useState<'seekers' | 'landlords'>(defaultTab);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 160,
      }).start();
    } else {
      translateY.setValue(800);
    }
  }, [visible]);

  function handleChoose(_plan: string) {
    // TODO: wire to payment flow
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={COLORS.textLight} />
          </TouchableOpacity>

          {/* Title */}
          <View style={styles.titleRow}>
            <LinearGradient
              colors={[COLORS.secondary, COLORS.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleIcon}
            >
              <Ionicons name="sparkles" size={18} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>{t('plans.title')}</Text>
          </View>

          {/* Tab toggle */}
          <View style={styles.tabRow}>
            {(['seekers', 'landlords'] as const).map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.tab, tab === key && styles.tabActive]}
                onPress={() => setTab(key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
                  {t(`plans.${key}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Plan cards */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cards}
            bounces={false}
          >
            {tab === 'seekers'
              ? SEEKER_TIERS.map((tier) => (
                  <PlanCard
                    key={tier}
                    name={t(`plans.seeker.${tier}.name`)}
                    price={t(`plans.seeker.${tier}.price`)}
                    perMonth={t('plans.perMonth')}
                    features={[
                      t(`plans.seeker.${tier}.f1`),
                      t(`plans.seeker.${tier}.f2`),
                      t(`plans.seeker.${tier}.f3`),
                    ]}
                    color={SEEKER_COLORS[tier]}
                    popular={tier === 'essential'}
                    isCurrent={tier === 'basic'}
                    onChoose={() => handleChoose(tier)}
                  />
                ))
              : LANDLORD_TIERS.map((tier) => (
                  <PlanCard
                    key={tier}
                    name={t(`plans.landlord.${tier}.name`)}
                    price={t(`plans.landlord.${tier}.price`)}
                    perMonth={t('plans.perMonth')}
                    features={[
                      t(`plans.landlord.${tier}.f1`),
                      t(`plans.landlord.${tier}.f2`),
                      t(`plans.landlord.${tier}.f3`),
                    ]}
                    color={LANDLORD_COLORS[tier]}
                    popular={tier === 'standard'}
                    isCurrent={tier === 'free'}
                    onChoose={() => handleChoose(tier)}
                  />
                ))}

            <View style={{ height: 20 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    maxHeight: '92%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  titleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#111',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#888',
  },
  tabTextActive: {
    color: '#111',
    fontFamily: 'Poppins-SemiBold',
  },
  cards: {
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    padding: 20,
    position: 'relative',
  },
  cardPopular: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  popularText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: '#fff',
    letterSpacing: 0.5,
  },
  cardName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 16,
  },
  cardPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
  },
  perMonth: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#888',
  },
  featureList: {
    gap: 10,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#444',
    flex: 1,
  },
  chooseBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  chooseBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
});
