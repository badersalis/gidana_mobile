import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../utils/theme';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, updateUser, logout } = useAuthStore();
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone_number ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(t('editProfile.requiredFields'), t('editProfile.requiredFieldsDesc'));
      return;
    }
    setSaving(true);
    try {
      const { data } = await apiClient.put('/users/profile', {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        phone_number: phone.trim() || undefined,
      });
      updateUser(data.data);
      Alert.alert(t('editProfile.profileUpdated'), t('editProfile.profileUpdatedDesc'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert(t('common.error'), t('editProfile.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = () => {
    Alert.alert(
      t('editProfile.deleteAccount'),
      t('editProfile.deleteWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('editProfile.deleteConfirm'), style: 'destructive', onPress: performDeleteRequest },
      ]
    );
  };

  const performDeleteRequest = async () => {
    setDeleting(true);
    try {
      await apiClient.delete('/users/profile');
      await logout();
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })
      );
      Alert.alert(t('editProfile.requestSent'), t('editProfile.requestSentDesc'));
    } catch {
      Alert.alert(t('common.error'), t('editProfile.requestError'));
      setDeleting(false);
    }
  };

  if (deleting) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('editProfile.sending')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('editProfile.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('editProfile.personalInfo')}</Text>
            <TextInput
              label={t('editProfile.firstName')}
              value={firstName}
              onChangeText={setFirstName}
              mode="outlined"
              style={styles.input}
              activeOutlineColor={COLORS.primary}
              outlineColor="#e9ecef"
            />
            <TextInput
              label={t('editProfile.lastName')}
              value={lastName}
              onChangeText={setLastName}
              mode="outlined"
              style={styles.input}
              activeOutlineColor={COLORS.primary}
              outlineColor="#e9ecef"
            />
            <TextInput
              label={t('editProfile.email')}
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              activeOutlineColor={COLORS.primary}
              outlineColor="#e9ecef"
            />
            <TextInput
              label={t('editProfile.phone')}
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              activeOutlineColor={COLORS.primary}
              outlineColor="#e9ecef"
            />
          </View>

          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            buttonColor={COLORS.primary}
            style={styles.saveBtn}
            contentStyle={styles.saveBtnContent}
            labelStyle={styles.saveBtnLabel}
          >
            {t('editProfile.save')}
          </Button>

          <View style={styles.dangerSection}>
            <View style={styles.dangerHeader}>
              <Ionicons name="warning-outline" size={18} color="#ef4444" />
              <Text style={styles.dangerTitle}>{t('editProfile.dangerZone')}</Text>
            </View>
            <Text style={styles.dangerDesc}>{t('editProfile.dangerDesc')}</Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeleteRequest}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
              <Text style={styles.deleteBtnText}>{t('editProfile.deleteAccount')}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#666' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins-SemiBold', color: '#333' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  input: { backgroundColor: '#fff' },
  saveBtn: { borderRadius: 12 },
  saveBtnContent: { paddingVertical: 6 },
  saveBtnLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 15 },
  dangerSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#fee2e2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 4,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dangerTitle: { fontSize: 15, fontFamily: 'Poppins-SemiBold', color: '#ef4444' },
  dangerDesc: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    lineHeight: 20,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff5f5',
    marginTop: 4,
  },
  deleteBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#ef4444',
  },
});
