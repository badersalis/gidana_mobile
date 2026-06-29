import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { propertyApi } from '../api/properties';
import { walletApi } from '../api/wallet';
import { Wallet } from '../types';
import { COLORS } from '../utils/theme';

type Step = 'select' | 'processing' | 'revealed';

interface ContactUnlockModalProps {
  visible: boolean;
  onClose: () => void;
  propertyId: number;
  ownerName: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  onUnlocked: () => void;
}

const PROVIDER_META: Record<
  string,
  { label: string; color: string; icon: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  OrangeMoney: { label: 'Orange Money', color: '#FF6600', icon: 'phone-portrait-outline' },
  Moov:        { label: 'Moov Money',   color: '#00A0E4', icon: 'phone-portrait-outline' },
  MPesa:       { label: 'M-Pesa',       color: '#00A550', icon: 'phone-portrait-outline' },
  Nita:        { label: 'Nita',         color: COLORS.primary, icon: 'wallet-outline' },
  Visa:        { label: 'Visa',         color: '#1A1F71', icon: 'card-outline' },
  Mastercard:  { label: 'Mastercard',   color: '#EB001B', icon: 'card-outline' },
  PayPal:      { label: 'PayPal',       color: '#003087', icon: 'logo-paypal' },
};

function walletLabel(wallet: Wallet): string {
  const meta = PROVIDER_META[wallet.provider];
  const name = meta?.label ?? wallet.provider;
  const identifier = wallet.masked_phone ?? wallet.masked_card ?? wallet.masked_email ?? '';
  return identifier ? `${name} — ${identifier}` : name;
}

export default function ContactUnlockModal({
  visible,
  onClose,
  propertyId,
  ownerName,
  phoneNumber,
  whatsappNumber,
  onUnlocked,
}: ContactUnlockModalProps) {
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(600)).current;
  const [step, setStep] = useState<Step>('select');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [loadingWallets, setLoadingWallets] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | undefined>(phoneNumber);
  const [revealedWhatsApp, setRevealedWhatsApp] = useState<string | undefined>(whatsappNumber);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
      }).start();
      loadWallets();
    } else {
      translateY.setValue(600);
      setStep('select');
    }
  }, [visible]);

  async function loadWallets() {
    setLoadingWallets(true);
    try {
      const { data } = await walletApi.list();
      setWallets(data.data ?? []);
      const defaultWallet = data.data?.find((w) => w.selected) ?? data.data?.[0];
      if (defaultWallet) setSelectedWalletId(defaultWallet.id);
    } catch {
      // silently fail — UI shows empty state
    } finally {
      setLoadingWallets(false);
    }
  }

  async function handlePay() {
    if (!selectedWalletId) return;
    setStep('processing');
    try {
      const { data } = await propertyApi.unlockContact(propertyId, selectedWalletId);
      const unlock = data.data;
      setRevealedPhone(unlock.phone_number);
      setRevealedWhatsApp(unlock.whatsapp_number);
      setStep('revealed');
      onUnlocked();
    } catch (e: any) {
      setStep('select');
      Alert.alert(t('common.error'), e.response?.data?.error ?? t('contactUnlock.unlockError'));
    }
  }

  function openWhatsApp(number: string) {
    const clean = number.replace(/\D/g, '');
    Linking.openURL(`whatsapp://send?phone=${clean}`).catch(() =>
      Alert.alert(t('propertyDetail.whatsappNotAvailable'), t('propertyDetail.whatsappNotAvailableDesc'))
    );
  }

  function openCall(number: string) {
    Linking.openURL(`tel:${number}`);
  }

  const contactNumber = revealedPhone ?? revealedWhatsApp;

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

          {/* ── SELECT STEP ── */}
          {step === 'select' && (
            <>
              <View style={styles.header}>
                <View style={styles.iconCircle}>
                  <Ionicons name="lock-closed-outline" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.title}>{t('contactUnlock.title')}</Text>
                <Text style={styles.subtitle}>{t('contactUnlock.subtitle')}</Text>

                <View style={styles.priceBadge}>
                  <Ionicons name="pricetag-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.priceText}>{t('contactUnlock.price')}</Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>{t('contactUnlock.selectWallet')}</Text>

              {loadingWallets ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
              ) : wallets.length === 0 ? (
                <View style={styles.emptyWallets}>
                  <Ionicons name="wallet-outline" size={36} color={COLORS.textLight} />
                  <Text style={styles.emptyText}>{t('contactUnlock.noWalletsDesc')}</Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.walletList}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {wallets.map((wallet) => {
                    const meta = PROVIDER_META[wallet.provider] ?? {
                      label: wallet.provider,
                      color: COLORS.primary,
                      icon: 'wallet-outline' as const,
                    };
                    const selected = selectedWalletId === wallet.id;
                    return (
                      <TouchableOpacity
                        key={wallet.id}
                        style={[styles.walletRow, selected && styles.walletRowSelected]}
                        activeOpacity={0.7}
                        onPress={() => setSelectedWalletId(wallet.id)}
                      >
                        <View style={[styles.walletIcon, { backgroundColor: meta.color + '18' }]}>
                          <Ionicons name={meta.icon} size={22} color={meta.color} />
                        </View>
                        <Text style={styles.walletLabel}>{walletLabel(wallet)}</Text>
                        <View style={[styles.radio, selected && styles.radioSelected]}>
                          {selected && <View style={styles.radioInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {wallets.length === 0 ? (
                <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
                  <Text style={styles.secondaryBtnText}>{t('contactUnlock.addWallet')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.payBtnWrapper, !selectedWalletId && styles.payBtnDisabled]}
                  onPress={handlePay}
                  disabled={!selectedWalletId}
                >
                  <LinearGradient
                    colors={[COLORS.secondary, COLORS.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.payBtn}
                  >
                    <Ionicons name="lock-open-outline" size={18} color="#fff" />
                    <Text style={styles.payBtnText}>{t('contactUnlock.confirm')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* ── PROCESSING STEP ── */}
          {step === 'processing' && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.processingText}>{t('contactUnlock.processing')}</Text>
            </View>
          )}

          {/* ── REVEALED STEP ── */}
          {step === 'revealed' && (
            <>
              <View style={styles.header}>
                <View style={[styles.iconCircle, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="checkmark-circle" size={36} color="#10b981" />
                </View>
                <Text style={styles.title}>{t('contactUnlock.successTitle')}</Text>
                <Text style={styles.subtitle}>{ownerName}</Text>
              </View>

              {contactNumber && (
                <View style={styles.contactCard}>
                  <Text style={styles.contactNumber}>{contactNumber}</Text>
                </View>
              )}

              <View style={styles.contactActions}>
                {(revealedPhone || revealedWhatsApp) && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                    onPress={() => openWhatsApp((revealedWhatsApp ?? revealedPhone)!)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>{t('contactUnlock.whatsapp')}</Text>
                  </TouchableOpacity>
                )}
                {revealedPhone && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                    onPress={() => openCall(revealedPhone)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="call-outline" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>{t('contactUnlock.call')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
                <Text style={styles.secondaryBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </>
          )}
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
    maxHeight: '85%',
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
    marginBottom: 20,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primaryLight ?? '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#111',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary + '14',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: COLORS.primary,
  },
  sectionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#555',
    marginBottom: 10,
  },
  walletList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    marginBottom: 10,
  },
  walletRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletLabel: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  emptyWallets: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  payBtnWrapper: {
    marginTop: 4,
  },
  payBtnDisabled: {
    opacity: 0.45,
  },
  payBtn: {
    borderRadius: 50,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  payBtnText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
  },
  centered: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 40,
  },
  processingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: COLORS.textLight,
  },
  contactCard: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#f8fdf8',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#d1fae5',
    marginBottom: 20,
  },
  contactNumber: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#111',
    letterSpacing: 1,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
  secondaryBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#555',
  },
});
