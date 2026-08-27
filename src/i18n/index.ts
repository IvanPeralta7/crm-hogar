import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import en from './locales/en.json';

const STORAGE_KEY = 'sanctuary-lang';

const savedLanguage = localStorage.getItem(STORAGE_KEY);
const browserLanguage = navigator.language.startsWith('es') ? 'es' : 'en';

void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: savedLanguage ?? browserLanguage,
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
});

export function setAppLanguage(lang: 'es' | 'en') {
  void i18n.changeLanguage(lang);
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
}

export default i18n;
