import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import styles from './AddWalletScreen.styles';
import { Button, SegmentedButtons, Switch, Text, TextInput } from 'react-native-paper';
import { walletApi } from '../../api/wallet';
import { COLORS } from '../../utils/theme';

const PROVIDERS = ['Nita', 'MPesa', 'PayPal', 'Visa', 'Mastercard'];
const CURRENCIES = ['XOF', 'EUR', 'USD'];

export default function AddWalletScreen() {
  const navigation = useNavigation<any>();
  const [provider, setProvider] = useState('Nita');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [expiration, setExpiration] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('XOF');
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMobileMoney = provider === 'Nita' || provider === 'MPesa';
  const isPayPal = provider === 'PayPal';
  const isCard = provider === 'Visa' || provider === 'Mastercard';

  async function handleAdd() {
    setLoading(true);
    try {
      await walletApi.create({
        provider,
        phone_number: isMobileMoney ? phone : undefined,
        email: isPayPal ? email : undefined,
        card_number: isCard ? cardNumber : undefined,
        cvv: isCard ? cvv : undefined,
        expiration_date: isCard ? expiration : undefined,
        password: (isMobileMoney || isPayPal) ? password : undefined,
        currency,
        selected: setAsDefault,
      });
      Alert.alert('Portefeuille ajouté', 'Vous pouvez maintenant l\'utiliser pour vos paiements.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error ?? 'Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text variant="titleMedium" style={styles.label}>Fournisseur</Text>
      <View style={styles.providerGrid}>
        {PROVIDERS.map((p) => (
          <Button
            key={p}
            mode={provider === p ? 'contained' : 'outlined'}
            onPress={() => setProvider(p)}
            style={styles.providerBtn}
            compact
          >
            {p}
          </Button>
        ))}
      </View>

      {isMobileMoney && (
        <>
          <TextInput mode="outlined" label="Numéro de téléphone (+XXXXXXXXXXX)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
          <TextInput mode="outlined" label="Code PIN / Mot de passe" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
        </>
      )}

      {isPayPal && (
        <>
          <TextInput mode="outlined" label="Adresse email PayPal" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
          <TextInput mode="outlined" label="Mot de passe PayPal" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
        </>
      )}

      {isCard && (
        <>
          <TextInput mode="outlined" label="Numéro de carte" value={cardNumber} onChangeText={setCardNumber} keyboardType="numeric" maxLength={16} style={styles.input} />
          <View style={styles.row}>
            <TextInput mode="outlined" label="CVV" value={cvv} onChangeText={setCvv} keyboardType="numeric" maxLength={4} style={[styles.input, styles.half]} />
            <TextInput mode="outlined" label="Expiration (MM/AA)" value={expiration} onChangeText={setExpiration} placeholder="MM/AA" style={[styles.input, styles.half]} />
          </View>
        </>
      )}

      <Text variant="titleMedium" style={styles.label}>Devise</Text>
      <SegmentedButtons
        value={currency}
        onValueChange={setCurrency}
        buttons={CURRENCIES.map((c) => ({ value: c, label: c }))}
        style={styles.segmented}
      />

      <View style={styles.switchRow}>
        <Text>Définir comme portefeuille par défaut</Text>
        <Switch value={setAsDefault} onValueChange={setSetAsDefault} />
      </View>

      <Button
        mode="contained" onPress={handleAdd}
        loading={loading} disabled={loading}
        style={styles.button} contentStyle={styles.buttonContent}
      >
        Ajouter le portefeuille
      </Button>
    </ScrollView>
  );
}

