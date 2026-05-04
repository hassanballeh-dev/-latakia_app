import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { I18nManager } from 'react-native';
import { initReactI18next } from 'react-i18next';

import { restaurantConfig, APP_CONFIG } from './config';
import ar from '../locales/ar.json';
import nl from '../locales/nl.json';

export type Lang = 'ar' | 'nl';

const STORAGE_KEY = 'latakia.language';

export async function loadStoredLanguage(): Promise<Lang> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    if (v === 'ar' || v === 'nl') return v;
  } catch {}
  return APP_CONFIG.defaultLanguage;
}

export async function setLanguage(lang: Lang): Promise<{ rtlChanged: boolean }> {
  const wantRTL = lang === 'ar';
  const rtlChanged = I18nManager.isRTL !== wantRTL;
  await AsyncStorage.setItem(STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);
  if (rtlChanged) {
    // Direction changes don't take effect mid-render in React Native.
    // The caller should reload the app (Updates.reloadAsync) after this returns.
    I18nManager.allowRTL(wantRTL);
    I18nManager.forceRTL(wantRTL);
  }
  return { rtlChanged };
}

export function initI18n(initialLang: Lang) {
  if (i18n.isInitialized) return i18n;
  i18n.use(initReactI18next).init({
    resources: {
      ar: { translation: ar },
      nl: { translation: nl },
    },
    lng: initialLang,
    fallbackLng: 'nl',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
  return i18n;
}

// Helper: pick the right name field on a category/item for the current language.
export function localizedName<T extends { name_ar: string; name_nl: string }>(
  item: T,
  lang: Lang,
): string {
  return lang === 'ar' ? item.name_ar : item.name_nl;
}

// Currency formatter pinned to the configured currency, locale-formatted.
export function formatPrice(amount: number, lang: Lang): string {
  try {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar' : 'nl-NL', {
      style: 'currency',
      currency: restaurantConfig.currency,
    }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}

export default i18n;
