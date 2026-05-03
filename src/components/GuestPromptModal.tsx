import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/theme';

interface GuestPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onSignUp: () => void;
  onSignIn: () => void;
}

export default function GuestPromptModal({ visible, onClose, onSignUp, onSignIn }: GuestPromptModalProps) {
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(500)).current;

  const BENEFITS = [
    t('guestModal.benefit1'),
    t('guestModal.benefit2'),
    t('guestModal.benefit3'),
  ];

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
      }).start();
    } else {
      translateY.setValue(500);
    }
  }, [visible]);

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

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="home" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.headerTitle}>{t('guestModal.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('guestModal.subtitle')}</Text>
          </View>

          <View style={styles.benefits}>
            {BENEFITS.map((benefit, i) => (
              <View key={i} style={styles.benefitRow}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={onSignUp} activeOpacity={0.85} style={styles.signUpWrapper}>
            <LinearGradient
              colors={[COLORS.secondary, COLORS.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signUpBtn}
            >
              <Ionicons name="person-add-outline" size={20} color="#fff" />
              <Text style={styles.signUpText}>{t('guestModal.signUpFree')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onSignIn} style={styles.signInRow}>
            <Text style={styles.signInLabel}>{t('guestModal.alreadyAccount')} </Text>
            <Text style={styles.signInLink}>{t('guestModal.signIn')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 20,
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
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#111',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  benefits: {
    gap: 14,
    marginBottom: 28,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#333',
    lineHeight: 20,
  },
  signUpWrapper: {
    marginBottom: 16,
  },
  signUpBtn: {
    borderRadius: 50,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  signUpText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textLight,
  },
  signInLink: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.primary,
  },
});
