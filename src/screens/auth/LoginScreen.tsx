import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../utils/theme';

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function isValidPhone(v: string) {
  return /^\+[1-9]\d{6,14}$/.test(v);
}

function validate(identifier: string, password: string): Record<string, string> {
  const errors: Record<string, string> = {};
  const id = identifier.trim();

  if (!id) {
    errors.identifier = 'Ce champ est obligatoire';
  } else if (id.includes('@') && !isValidEmail(id)) {
    errors.identifier = 'Adresse email invalide';
  } else if (id.startsWith('+') && !isValidPhone(id)) {
    errors.identifier = 'Format téléphone invalide (+XXXXXXXXXXX)';
  }

  if (!password) {
    errors.password = 'Ce champ est obligatoire';
  }

  return errors;
}

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const login = useAuthStore((s) => s.login);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState('');

  const formErrors = useMemo(() => validate(identifier, password), [identifier, password]);
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
      setServerError(e.response?.data?.error ?? 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="home" size={22} color="#fff" />
          </View>
        </View>

        <View style={styles.form}>
          <View>
            <TextInput
              mode="outlined"
              label="Email ou téléphone"
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
              label="Mot de passe"
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
            Se connecter
          </Button>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
            <Text style={styles.registerText}>
              Pas de compte ?{' '}
              <Text style={{ color: COLORS.primary, fontWeight: '700' }}>S'inscrire</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Tabs')} style={styles.guestLink}>
            <Text style={styles.guestText}>Explorer sans compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoBadge: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: { fontSize: 28, fontFamily: 'Poppins-Bold', color: '#111', marginBottom: 4 },
  subtitle: { fontFamily: 'Poppins-Regular', fontSize: 14, color: COLORS.textLight },
  form: { gap: 4 },
  input: { backgroundColor: '#fff', fontFamily: 'Poppins-Regular' },
  serverError: { textAlign: 'center', fontSize: 13 },
  button: { marginTop: 8, borderRadius: 50 },
  buttonContent: { paddingVertical: 6, height: 50 },
  registerLink: { alignItems: 'center', paddingVertical: 12 },
  registerText: { fontFamily: 'Poppins-Regular', fontSize: 14, color: COLORS.textLight },
  guestLink: { alignItems: 'center', paddingVertical: 8 },
  guestText: { fontFamily: 'Poppins-Regular', fontSize: 13, color: COLORS.textLight, textDecorationLine: 'underline' },
});
