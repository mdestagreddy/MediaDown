import { useContext } from 'react';
import { ColorAccentContext } from '../contexts/ColorAccentContext';

const useColorAccent = () => {
  const ctx = useContext(ColorAccentContext);
  if (!ctx) {
    throw new Error('useColorAccent must be used within a ColorAccentProvider');
  }
  return ctx;
};

export default useColorAccent;
