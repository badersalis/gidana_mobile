import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../utils/theme';
import styles from './LoginScreen.styles';

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function isValidPhone(v: string) {
  return /^\+[1-9]\d{6,14}$/.test(v);
}

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const login = useAuthStore((s) => s.login);
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState('');

  function validate(identifier: string, password: string): Record<string, string> {
    const errors: Record<string, string> = {};
    const id = identifier.trim();
    if (!id) {
      errors.identifier = t('common.required');
    } else if (id.includes('@') && !isValidEmail(id)) {
      errors.identifier = t('auth.invalidEmail');
    } else if (id.startsWith('+') && !isValidPhone(id)) {
      errors.identifier = t('auth.invalidPhone');
    }
    if (!password) {
      errors.password = t('common.required');
    }
    return errors;
  }

  const formErrors = useMemo(() => validate(identifier, password), [identifier, password, t]);
  const isValid = Object.keys(formErrors).length === 0;

  function touch(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function err(field: string): string | undefined {
    return touched[field] ? formErrors[field] : undefined;
  }

  async function handleLogin() {
    setTouched({ identifier: true, password: true });
    if (!isValid) return;
    setServerError('');
    setLoading(true);
    try {
      await login(identifier.trim(), password);
    } catch (e: any) {
      setServerError(e.response?.data?.error ?? t('auth.wrongCredentials'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="home" size={22} color="#fff" />
          </View>
        </View>

        <View style={styles.form}>
          <View>
            <TextInput
              mode="outlined"
              label={t('auth.emailOrPhone')}
              value={identifier}
              onChangeText={(v) => { setIdentifier(v); setServerError(''); }}
              onBlur={() => touch('identifier')}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!err('identifier')}
              left={<TextInput.Icon icon="account" />}
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
              label={t('auth.password')}
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
            onPress={handleLogin}
            loading={loading}
            disabled={loading || !isValid}
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor={COLORS.primary}
          >
            {t('auth.login')}
          </Button>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
            <Text style={styles.registerText}>
              {t('auth.noAccount')}{' '}
              <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{t('auth.register')}</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Tabs')} style={styles.guestLink}>
            <Text style={styles.guestText}>{t('auth.browseWithoutAccount')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
