import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
const supportedLocales = ['en', 'fr'];
const lng = supportedLocales.includes(deviceLocale) ? deviceLocale : 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
