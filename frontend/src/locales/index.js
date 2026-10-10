import id from './id.json';
import en from './en.json';

export const SUPPORTED_LOCALES = {
  id,
  en
};

export const DEFAULT_LOCALE = 'id';
export const LOCALE_STORAGE_KEY = 'media-locale';

export const detectLocale = () => {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (saved && SUPPORTED_LOCALES[saved]) return saved;

  const browserLang = navigator.language?.split('-')[0] || 'en';
  if (SUPPORTED_LOCALES[browserLang]) return browserLang;

  return DEFAULT_LOCALE;
};

export const translate = (messages, key, vars = {}) => {
  const keys = key.split('.');
  let current = messages;
  for (const k of keys) {
    if (!current || typeof current !== 'object' || !(k in current)) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    current = current[k];
  }
  if (typeof current !== 'string') {
    console.warn(`Translation is not a string: ${key}`);
    return key;
  }
  return current.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
};
