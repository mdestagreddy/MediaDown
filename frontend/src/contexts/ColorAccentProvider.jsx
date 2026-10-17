import { useState, useEffect, useCallback, useMemo } from 'react';
import { ColorAccentContext } from './ColorAccentContext';

const DEFAULT_COLOR_ACCENT = 'indigo';

const COLOR_PRESETS = [
  { id: 'indigo', primary: '#6366f1', secondary: '#06b6d4', tertiary: '#8b5cf6' },
  { id: 'violet', primary: '#8b5cf6', secondary: '#06b6d4', tertiary: '#a855f7' },
  { id: 'cyan', primary: '#06b6d4', secondary: '#38bdf8', tertiary: '#6366f1' },
  { id: 'emerald', primary: '#10b981', secondary: '#38bdf8', tertiary: '#34d399' },
  { id: 'rose', primary: '#f43f5e', secondary: '#fb7185', tertiary: '#ec4899' },
  { id: 'amber', primary: '#f59e0b', secondary: '#fbbf24', tertiary: '#f97316' },
  { id: 'blue', primary: '#3b82f6', secondary: '#60a5fa', tertiary: '#8b5cf6' },
  { id: 'teal', primary: '#14b8a3', secondary: '#10b981', tertiary: '#06b6d4' },
];

const COLOR_ACCENT_STORAGE_KEY = 'media-color-accent';
const CUSTOM_COLOR_STORAGE_KEY = 'media-color-accent-custom';

const hexToRgbParts = (hex) => {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

const hexToHsl = (hex) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s, hVal;
  if (max === min) {
    s = 0;
    hVal = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hVal = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hVal = (b - r) / d + 2; break;
      case b: hVal = (r - g) / d + 4; break;
      default: hVal = 0;
    }
    hVal *= 60;
  }
  return { h: Math.round(hVal), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToHex = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = (n) => {
    const color = n + h / 30;
    if (color > 6) return color - 6;
    if (color < 0) return color + 6;
    return color;
  };
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const color = k(n);
    const color2 = color - Math.floor(color);
    const color3 = Math.min(color2 - 0.5, 0.5);
    return color2 - Math.floor(2 * color3) / 2;
  };
  const toHex = (n) => {
    const hex = Math.round((f(n) + a * (1 - Math.abs(2 * f(n) - 1)) * 255));
    return hex.toString(16).padStart(2, '0');
  };
  return `#${toHex(0)}${toHex(1)}${toHex(2)}`;
};

const derivePaletteFromHex = (hex) => {
  const { h, s, l } = hexToHsl(hex);
  const secondary = hslToHex(h, Math.max(s - 10, 0), Math.min(l + 15, 90));
  const tertiary = hslToHex(h, Math.max(s - 20, 0), Math.max(l - 15, 10));
  return { primary: hex, secondary, tertiary };
};

const findPreset = (id) => COLOR_PRESETS.find((p) => p.id === id) || COLOR_PRESETS[0];

const applyColorVariables = (palette) => {
  const root = document.documentElement;
  const set = (prop, val) => root.style.setProperty(prop, val);

  set('--accent-indigo', palette.primary);
  set('--accent-indigo-rgb', hexToRgbParts(palette.primary));
  set('--accent-cyan', palette.secondary);
  set('--accent-cyan-rgb', hexToRgbParts(palette.secondary));
  set('--accent-violet', palette.tertiary);
  set('--accent-violet-rgb', hexToRgbParts(palette.tertiary));
  set('--color-custom-accent', palette.primary);
};

export const ColorAccentProvider = ({ children }) => {
  const [currentPreset, setCurrentPreset] = useState(() => {
    if (typeof localStorage === 'undefined') return DEFAULT_COLOR_ACCENT;
    return localStorage.getItem(COLOR_ACCENT_STORAGE_KEY) || DEFAULT_COLOR_ACCENT;
  });

  const [customColor, setCustomColor] = useState(() => {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem(CUSTOM_COLOR_STORAGE_KEY);
    if (stored && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(stored)) return stored;
    return null;
  });

  const selectPreset = useCallback((id) => {
    const preset = findPreset(id);
    setCurrentPreset(preset.id);
    setCustomColor(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COLOR_ACCENT_STORAGE_KEY, preset.id);
      localStorage.removeItem(CUSTOM_COLOR_STORAGE_KEY);
    }
    applyColorVariables({ id: preset.id, ...preset });
  }, []);

  const selectCustomColor = useCallback((hex) => {
    if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)) return;
    const palette = derivePaletteFromHex(hex);
    setCustomColor(hex);
    setCurrentPreset('custom');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COLOR_ACCENT_STORAGE_KEY, 'custom');
      localStorage.setItem(CUSTOM_COLOR_STORAGE_KEY, hex);
    }
    applyColorVariables({ id: 'custom', ...palette });
  }, []);

  const resetColor = useCallback(() => {
    const preset = findPreset(DEFAULT_COLOR_ACCENT);
    setCurrentPreset(preset.id);
    setCustomColor(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(COLOR_ACCENT_STORAGE_KEY);
      localStorage.removeItem(CUSTOM_COLOR_STORAGE_KEY);
    }
    applyColorVariables({ id: preset.id, ...preset });
  }, []);

  useEffect(() => {
    if (customColor) {
      const palette = derivePaletteFromHex(customColor);
      applyColorVariables({ id: 'custom', ...palette });
    } else {
      const preset = findPreset(currentPreset);
      applyColorVariables({ id: preset.id, ...preset });
    }
  }, [currentPreset, customColor]);

  const currentPresetData = useMemo(() => {
    if (currentPreset === 'custom' && customColor) {
      return { id: 'custom', name: 'Custom', primary: customColor };
    }
    return findPreset(currentPreset);
  }, [currentPreset, customColor]);

  const currentAccentColor = useMemo(() => {
    if (customColor) return customColor;
    return findPreset(currentPreset).primary;
  }, [currentPreset, customColor]);

  const value = useMemo(() => ({
    currentPreset,
    currentPresetData,
    currentAccentColor,
    customColor,
    presets: COLOR_PRESETS,
    selectPreset,
    selectCustomColor,
    resetColor,
  }), [currentPreset, currentPresetData, currentAccentColor, customColor, selectPreset, selectCustomColor, resetColor]);

  return (
    <ColorAccentContext.Provider value={value}>
      {children}
    </ColorAccentContext.Provider>
  );
};

export default ColorAccentProvider;
