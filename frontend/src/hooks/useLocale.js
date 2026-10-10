import { useContext } from 'react';
import { LocaleContext } from '../contexts/LocaleContext';

const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return ctx;
};

export default useLocale;
