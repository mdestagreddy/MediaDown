import { Settings, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import './OutputTemplateSelector.css';
import useLocale from '../hooks/useLocale';

const PRESETS = [
  { value: '%(title).120s [%(extractor_key)s, %(id)s].%(ext)s', label: 'Title [Platform, ID] (Default)' },
  { value: '%(title)s.%(ext)s', label: 'Title Only' },
  { value: '%(uploader)s - %(title)s.%(ext)s', label: 'Uploader - Title' },
  { value: '%(uploader)s/%(title)s.%(ext)s', label: 'Uploader / Title (Folder)' },
  { value: '%(playlist_index)s - %(title)s.%(ext)s', label: 'Index - Title' },
  { value: '%(title).120s [%(uploader)s].%(ext)s', label: 'Title [Uploader]' }
];

const TEMPLATE_VARS = ['title', 'id', 'ext', 'uploader', 'playlist_index'];

const OutputTemplateSelector = ({
  outputTemplate,
  onOutputTemplateChange,
  onResetOutputTemplate,
  defaultOutputTemplate
}) => {
  const { t } = useLocale();
  const isPreset = PRESETS.some(p => p.value === outputTemplate);
  const [isCustomMode, setIsCustomMode] = useState(!isPreset);

  const handlePresetChange = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomMode(true);
      return;
    }
    setIsCustomMode(false);
    onOutputTemplateChange(val);
  };

  return (
    <div className="output-template-section">
      <div className="group-label">
        <Settings size={15} />
        <span>{t('outputTemplate.title')}</span>
      </div>

      <select
        className="select-control"
        value={isCustomMode ? 'custom' : outputTemplate}
        onChange={handlePresetChange}
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
        <option value="custom">{t('outputTemplate.custom')}</option>
      </select>

      <div className="template-input-wrapper">
        <input
          type="text"
          className="select-control template-input"
          value={outputTemplate}
          onChange={(e) => {
            const val = e.target.value;
            if (PRESETS.some(p => p.value === val)) {
              setIsCustomMode(false);
            } else {
              setIsCustomMode(true);
            }
            onOutputTemplateChange(val);
          }}
          placeholder={defaultOutputTemplate}
        />
        <button
          type="button"
          className="btn-reset-template"
          onClick={onResetOutputTemplate}
          title={t('outputTemplate.reset')}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {isCustomMode && (
        <div className="output-template-vars">
          <span className="t-xs c-dim">{t('outputTemplate.hint')}</span>
          <div className="vars-grid">
            {TEMPLATE_VARS.map((v) => (
              <span key={v} className="var-chip">%({v})s</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputTemplateSelector;
