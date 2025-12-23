import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ar from './locales/ar';
import en from './locales/en';
import fr from './locales/fr';
import amz from './locales/amz';

// ============================================
// i18n SETUP - 4 Languages Support
// ============================================

const resources = {
  ar: { translation: ar },
  en: { translation: en },
  fr: { translation: fr },
  amz: { translation: amz },
};

const LANGUAGE_STORAGE_KEY = 'user_language';

// Get initial language
const getInitialLanguage = (): string => {
  const deviceLang = Localization.locale.split('-')[0];
  if (['ar', 'en', 'fr', 'amz'].includes(deviceLang)) {
    return deviceLang;
  }
  return 'ar'; // Default to Arabic
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Load saved language preference
export const loadSavedLanguage = async (): Promise<void> => {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLang && ['ar', 'en', 'fr', 'amz'].includes(savedLang)) {
      await i18n.changeLanguage(savedLang);
    }
  } catch (error) {
    console.log('Error loading saved language:', error);
  }
};

// Change language and persist
export const changeLanguage = async (lang: string): Promise<void> => {
  try {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (error) {
    console.log('Error changing language:', error);
  }
};

// Check if current language is RTL
export const isRTL = (): boolean => {
  const lang = i18n.language;
  return lang === 'ar' || lang === 'amz';
};

export default i18n;
