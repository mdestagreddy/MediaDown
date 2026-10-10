import { useState, useCallback, useMemo } from 'react';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  detectLocale,
  LOCALE_STORAGE_KEY,
  translate
} from '../locales';
import { LocaleContext } from './LocaleContext';

export const LocaleProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(detectLocale);

  const setLocale = useCallback((newLocale) => {
    if (!SUPPORTED_LOCALES[newLocale]) return;
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    setLocaleState(newLocale);
  }, []);

  const messages = SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES[DEFAULT_LOCALE];

  const t = useCallback((key, vars) => translate(messages, key, vars), [messages]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
    messages
  }), [locale, setLocale, t, messages]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
};

export default LocaleProvider;
