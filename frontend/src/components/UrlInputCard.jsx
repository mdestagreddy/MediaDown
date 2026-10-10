import {
  Radio,
  Clipboard,
  RefreshCw,
  Sliders,
  AlertCircle,
  Key,
  X,
  Cpu,
  Video,
  Image
} from 'lucide-react';
import './UrlInputCard.css';
import useLocale from '../hooks/useLocale';

const UrlInputCard = ({
  url,
  setUrl,
  onAnalyze,
  onPaste,
  isLoadingInfo,
  errorMessage,
  onOpenCookieModal,
  mediaEngine,
  onMediaEngineChange
}) => {
  const { t } = useLocale();

  return (
  <div className="input-card">
    <form onSubmit={onAnalyze} className="input-wrapper">
      <div className="input-icon">
        <Radio size={20} />
      </div>
      <input
        type="url"
        className="url-input"
        placeholder={t('main.urlPlaceholder')}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={isLoadingInfo}
      />
      <div className="input-actions">
        {url && (
            <button
              type="button"
              className="btn-secondary btn-clear"
              onClick={() => setUrl('')}
              title={t('main.clearTooltip')}
            >
            <X size={16} />
          </button>
        )}
        <button
          type="button"
          className="btn-secondary"
          onClick={onPaste}
          title={t('main.pasteTooltip')}
        >
          <Clipboard size={16} />
          <span>{t('main.pasteBtn')}</span>
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoadingInfo || !url.trim()}
        >
          {isLoadingInfo ? (
            <>
              <RefreshCw size={16} className="spin-fast" />
              <span>{t('main.analyzingBtn')}</span>
            </>
          ) : (
            <>
              <Sliders size={16} />
              <span>{t('main.analyzeBtn')}</span>
            </>
          )}
        </button>
      </div>
    </form>

    {/* Engine Toggle */}
    <div className="engine-toggle-wrapper">
      <span className="engine-toggle-label">
        <Cpu size={12} />
        <span>{t('main.engineLabel')}</span>
      </span>
      <div className="engine-toggle">
        <button
          type="button"
          className={`engine-btn ${mediaEngine === 'auto' ? 'active' : ''}`}
          onClick={() => onMediaEngineChange('auto')}
          title={t('main.engineAutoTooltip')}
          disabled={isLoadingInfo}
        >
          <Cpu size={14} />
          <span>{t('main.engineAuto')}</span>
        </button>
        <button
          type="button"
          className={`engine-btn ${mediaEngine === 'ytdl' ? 'active' : ''}`}
          onClick={() => onMediaEngineChange('ytdl')}
          title={t('main.engineYtdlTooltip')}
          disabled={isLoadingInfo}
        >
          <Video size={14} />
          <span>{t('main.engineYtdl')}</span>
        </button>
        <button
          type="button"
          className={`engine-btn ${mediaEngine === 'gallery' ? 'active' : ''}`}
          onClick={() => onMediaEngineChange('gallery')}
          title={t('main.engineGalleryTooltip')}
          disabled={isLoadingInfo}
        >
          <Image size={14} />
          <span>{t('main.engineGallery')}</span>
        </button>
      </div>
    </div>

    {errorMessage && (
      <div className="error-banner fl-between gap-12 flex-wrap">
        <div className="fl-row gap-10">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
        {(errorMessage.toLowerCase().includes('bot') || errorMessage.toLowerCase().includes('sign in') || errorMessage.toLowerCase().includes('429')) && (
          <button
            type="button"
            className="btn-secondary error-btn"
            onClick={onOpenCookieModal}
          >
            <Key size={13} className="mr-6" />
            <span>{t('main.setCookiesBtn')}</span>
          </button>
        )}
      </div>
    )}
  </div>
  );
};

export default UrlInputCard;
