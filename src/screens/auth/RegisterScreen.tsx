import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Divider, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../utils/theme';
import styles from './RegisterScreen.styles';

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function isValidPhone(v: string) {
  return /^\+[1-9]\d{6,14}$/.test(v);
}

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const register = useAuthStore((s) => s.register);
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);

  function validate(
    firstName: string,
    lastName: string,
    identifierType: 'email' | 'phone',
    identifier: string,
    password: string,
  ): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) {
      errors.firstName = t('common.required');
    } else if (firstName.trim().length < 2) {
      errors.firstName = t('common.min2Chars');
    }
    if (!lastName.trim()) {
      errors.lastName = t('common.required');
    } else if (lastName.trim().length < 2) {
      errors.lastName = t('common.min2Chars');
    }
    if (!identifier.trim()) {
      errors.identifier = t('common.required');
    } else if (identifierType === 'email' && !isValidEmail(identifier.trim())) {
      errors.identifier = t('auth.invalidEmail');
    } else if (identifierType === 'phone' && !isValidPhone(identifier.trim())) {
      errors.identifier = t('auth.invalidPhone');
    }
    if (!password) {
      errors.password = t('common.required');
    } else if (password.length < 6) {
      errors.password = t('common.min6Chars');
    }
    return errors;
  }

  const formErrors = useMemo(
    () => validate(firstName, lastName, identifierType, identifier, password),
    [firstName, lastName, identifierType, identifier, password, t],
  );
  const isValid = Object.keys(formErrors).length === 0;

  function touch(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function err(field: string): string | undefined {
    return touched[field] ? formErrors[field] : undefined;
  }

  function handleTypeChange(v: string) {
    setIdentifierType(v as 'email' | 'phone');
    setIdentifier('');
    setTouched((t) => ({ ...t, identifier: false }));
  }

  async function handleRegister() {
    setTouched({ firstName: true, lastName: true, identifier: true, password: true });
    if (!isValid) return;
    setServerError('');
    setLoading(true);
    try {
      await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: identifierType === 'email' ? identifier.trim() : undefined,
        phone_number: identifierType === 'phone' ? identifier.trim() : undefined,
        password,
      });
    } catch (e: any) {
      setServerError(e.response?.data?.error ?? t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.title}>{t('auth.createAccount')}</Text>
        <Text style={styles.subtitle}>{t('auth.joinGidana')}</Text>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <TextInput
                mode="outlined"
                label={t('auth.firstName')}
                value={firstName}
                onChangeText={(v) => { setFirstName(v); setServerError(''); }}
                onBlur={() => touch('firstName')}
                error={!!err('firstName')}
                style={styles.input}
                outlineColor="#e9ecef"
                activeOutlineColor={COLORS.primary}
              />
              <HelperText type="error" visible={!!err('firstName')}>
                {err('firstName')}
              </HelperText>
            </View>
            <View style={styles.halfField}>
              <TextInput
                mode="outlined"
                label={t('auth.lastName')}
                value={lastName}
                onChangeText={(v) => { setLastName(v); setServerError(''); }}
                onBlur={() => touch('lastName')}
                error={!!err('lastName')}
                style={styles.input}
                outlineColor="#e9ecef"
                activeOutlineColor={COLORS.primary}
              />
              <HelperText type="error" visible={!!err('lastName')}>
                {err('lastName')}
              </HelperText>
            </View>
          </View>

          <SegmentedButtons
            value={identifierType}
            onValueChange={handleTypeChange}
            buttons={[
              { value: 'email', label: t('auth.email'), style: { borderRadius: 12 } },
              { value: 'phone', label: t('auth.phone'), style: { borderRadius: 12 } },
            ]}
            style={styles.segmented}
            theme={{ colors: { primary: COLORS.primary } }}
          />

          <View>
            <TextInput
              mode="outlined"
              label={identifierType === 'email' ? t('auth.emailAddress') : t('auth.phoneInput')}
              value={identifier}
              onChangeText={(v) => { setIdentifier(v); setServerError(''); }}
              onBlur={() => touch('identifier')}
              keyboardType={identifierType === 'email' ? 'email-address' : 'phone-pad'}
              autoCapitalize="none"
              error={!!err('identifier')}
              left={<TextInput.Icon icon={identifierType === 'email' ? 'email' : 'phone'} />}
              style={styles.input}
              outlineColor="#e9ecef"
              activeOutlineColor={COLORS.primary}
            />
            <HelperText type="error" visible={!!err('identifier')}>
              {err('identifier')}
            </HelperText>
          </View>

          <View>
            <TextInput
              mode="outlined"
              label={t('auth.passwordMin')}
              value={password}
              onChangeText={(v) => { setPassword(v); setServerError(''); }}
              onBlur={() => touch('password')}
              secureTextEntry={!showPassword}
              error={!!err('password')}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
              outlineColor="#e9ecef"
              activeOutlineColor={COLORS.primary}
            />
            <HelperText type="error" visible={!!err('password')}>
              {err('password')}
            </HelperText>
          </View>

          {!!serverError && (
            <HelperText type="error" visible style={styles.serverError}>
              {serverError}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading || !isValid}
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor={COLORS.primary}
          >
            {t('auth.signUp')}
          </Button>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={styles.loginText}>
              {t('auth.alreadyAccount')}{' '}
              <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{t('auth.signIn')}</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.privacyConsent}>
            {t('auth.privacyConsent')}{' '}
            <Text style={styles.privacyLink} onPress={() => setShowPrivacy(true)}>
              {t('auth.privacyPolicy')}
            </Text>{' '}
            {t('auth.of')}{' '}
            <Text style={{ fontFamily: 'Poppins-SemiBold', color: COLORS.textLight }}>
              Gidana Plateforms SARL
            </Text>
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showPrivacy}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPrivacy(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('auth.privacy.title')}</Text>
              <TouchableOpacity onPress={() => setShowPrivacy(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Divider />
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.policySectionTitle}>{t('auth.privacy.section1Title')}</Text>
              <Text style={styles.policyText}>{t('auth.privacy.section1')}</Text>

              <Text style={styles.policySectionTitle}>{t('auth.privacy.section2Title')}</Text>
              <Text style={styles.policyText}>{t('auth.privacy.section2')}</Text>

              <Text style={styles.policySectionTitle}>{t('auth.privacy.section3Title')}</Text>
              <Text style={styles.policyText}>{t('auth.privacy.section3')}</Text>

              <Text style={styles.policySectionTitle}>{t('auth.privacy.section4Title')}</Text>
              <Text style={styles.policyText}>{t('auth.privacy.section4')}</Text>

              <Text style={styles.policySectionTitle}>{t('auth.privacy.section5Title')}</Text>
              <Text style={styles.policyText}>
                {t('auth.privacy.section5')}{' '}
                <Text
                  style={{ color: COLORS.primary }}
                  onPress={() => Linking.openURL('mailto:support@gidana.app')}
                >
                  support@gidana.app
                </Text>
              </Text>

              <Text style={styles.policySectionTitle}>{t('auth.privacy.section6Title')}</Text>
              <Text style={styles.policyText}>{t('auth.privacy.section6')}</Text>

              <View style={styles.policyFooter}>
                <Text style={styles.policyFooterText}>{t('auth.privacy.footer')}</Text>
                <Text style={styles.policyFooterSub}>{t('auth.privacy.allRights')}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
