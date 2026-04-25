import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../utils/theme';

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function isValidPhone(v: string) {
  return /^\+[1-9]\d{6,14}$/.test(v);
}

function validate(
  firstName: string,
  lastName: string,
  identifierType: 'email' | 'phone',
  identifier: string,
  password: string,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!firstName.trim()) {
    errors.firstName = 'Ce champ est obligatoire';
  } else if (firstName.trim().length < 2) {
    errors.firstName = 'Minimum 2 caractères';
  }

  if (!lastName.trim()) {
    errors.lastName = 'Ce champ est obligatoire';
  } else if (lastName.trim().length < 2) {
    errors.lastName = 'Minimum 2 caractères';
  }

  if (!identifier.trim()) {
    errors.identifier = 'Ce champ est obligatoire';
  } else if (identifierType === 'email' && !isValidEmail(identifier.trim())) {
    errors.identifier = 'Adresse email invalide';
  } else if (identifierType === 'phone' && !isValidPhone(identifier.trim())) {
    errors.identifier = 'Format invalide. Exemple: +221771234567';
  }

  if (!password) {
    errors.password = 'Ce champ est obligatoire';
  } else if (password.length < 6) {
    errors.password = 'Minimum 6 caractères';
  }

  return errors;
}

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const register = useAuthStore((s) => s.register);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState('');

  const formErrors = useMemo(
    () => validate(firstName, lastName, identifierType, identifier, password),
    [firstName, lastName, identifierType, identifier, password],
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
      setServerError(e.response?.data?.error ?? "Erreur lors de l'inscription");
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

        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez Gidana pour trouver votre logement idéal</Text>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <TextInput
                mode="outlined"
                label="Prénom"
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
                label="Nom"
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
              { value: 'email', label: 'Email', style: { borderRadius: 12 } },
              { value: 'phone', label: 'Téléphone', style: { borderRadius: 12 } },
            ]}
            style={styles.segmented}
            theme={{ colors: { primary: COLORS.primary } }}
          />

          <View>
            <TextInput
              mode="outlined"
              label={identifierType === 'email' ? 'Adresse email' : 'Téléphone (+221XXXXXXXXX)'}
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
              label="Mot de passe (min. 6 caractères)"
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
            S'inscrire
          </Button>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Déjà un compte ?{' '}
              <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { flexGrow: 1, padding: 24 },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  title: { fontSize: 32, fontFamily: 'Poppins-Bold', color: COLORS.primary, marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: 'Poppins-Regular', color: COLORS.textLight, marginBottom: 32 },
  form: { gap: 4 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  input: { backgroundColor: '#fff', fontFamily: 'Poppins-Regular' },
  segmented: { marginBottom: 4 },
  serverError: { textAlign: 'center', fontSize: 13 },
  button: { marginTop: 8, borderRadius: 50 },
  buttonContent: { paddingVertical: 6, height: 50 },
  loginLink: { alignItems: 'center', paddingVertical: 12 },
  loginText: { fontFamily: 'Poppins-Regular', fontSize: 14, color: COLORS.textLight },
});
