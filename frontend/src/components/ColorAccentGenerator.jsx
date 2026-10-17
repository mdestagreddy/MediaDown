import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Palette, X, Check } from 'lucide-react';
import './ColorAccentGenerator.css';
import useLocale from '../hooks/useLocale';
import useColorAccent from '../hooks/useColorAccent';

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const ColorAccentGenerator = () => {
  const { t } = useLocale();
  const {
    currentPreset,
    currentAccentColor,
    presets,
    selectPreset,
    selectCustomColor,
    resetColor,
  } = useColorAccent();

  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(currentAccentColor);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  const displayedValue = isInputFocused ? draftValue : currentAccentColor;

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 250;
      const popoverHeight = 310;
      const spacing = 8;

      let top = rect.bottom + spacing;
      let left = rect.right - popoverWidth;

      if (left < 8) {
        left = 8;
      }
      if (left + popoverWidth > window.innerWidth - 8) {
        left = window.innerWidth - popoverWidth - 8;
      }

      if (top + popoverHeight > window.innerHeight - 8) {
        top = rect.top - popoverHeight - spacing;
        if (top < 8) {
          top = 8;
        }
      }

      setPopoverPos({ top, left });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handlePresetSelect = (id) => {
    selectPreset(id);
  };

  const handleColorPickerChange = (e) => {
    const val = e.target.value;
    selectCustomColor(val);
    setDraftValue(val);
  };

  const handleTextInputChange = (e) => {
    const val = e.target.value;
    setDraftValue(val);
    if (HEX_RE.test(val)) {
      selectCustomColor(val);
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    setDraftValue(currentAccentColor);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    if (!HEX_RE.test(draftValue)) {
      setDraftValue(currentAccentColor);
    }
  };

  return (
    <div className="color-accent-generator">
      <button
        ref={buttonRef}
        type="button"
        className="btn-secondary theme-toggle color-accent-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={t('colorAccent.title')}
        aria-label={t('colorAccent.title')}
        aria-expanded={isOpen}
      >
        <Palette size={16} />
        <span>{t('colorAccent.title')}</span>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className="color-accent-popover"
            style={{ top: `${popoverPos.top}px`, left: `${popoverPos.left}px` }}
          >
            <div className="color-accent-popover-header">
              <h3 className="color-accent-title">{t('colorAccent.title')}</h3>
              <button
                type="button"
                className="color-accent-close"
                onClick={() => setIsOpen(false)}
                title={t('common.close')}
              >
                <X size={14} />
              </button>
            </div>

            <div className="color-accent-presets-label">{t('colorAccent.presetsLabel')}</div>
            <div className="color-accent-presets-grid">
              {presets.map((preset) => {
                const isSelected = currentPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`color-preset-swatch ${isSelected ? 'active' : ''}`}
                    data-palette={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    title={t(`colorAccent.presets.${preset.id}`)}
                    aria-label={t(`colorAccent.presets.${preset.id}`)}
                  >
                    {isSelected && <Check size={14} className="color-preset-check" />}
                  </button>
                );
              })}
            </div>

            <div className="color-accent-custom-section">
              <label className="color-custom-label">{t('colorAccent.customLabel')}</label>
              <div className="color-custom-row">
                <input
                  type="color"
                  value={currentAccentColor}
                  onChange={handleColorPickerChange}
                  className="color-picker-native"
                  aria-label={t('colorAccent.customLabel')}
                />
                <input
                  type="text"
                  value={displayedValue}
                  onChange={handleTextInputChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className="color-custom-input select-control t-sm"
                  placeholder="#000000"
                />
              </div>
            </div>

            <button
              type="button"
              className="btn-secondary btn-sm color-accent-reset"
              onClick={resetColor}
            >
              {t('colorAccent.resetBtn')}
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ColorAccentGenerator;
