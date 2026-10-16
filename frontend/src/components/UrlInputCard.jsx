import {
  Radio,
  Clipboard,
  RefreshCw,
  Sliders,
  AlertCircle,
  Key,
  X,
  Globe
} from 'lucide-react';
import './UrlInputCard.css';
import './shared.css';
import useLocale from '../hooks/useLocale';

const UrlInputCard = ({
  url,
  setUrl,
  onAnalyze,
  onPaste,
  isLoadingInfo,
  errorMessage,
  onOpenCookieModal,
  useProxy = false,
  onUseProxyChange,
  proxyStatus = null
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

      {/* Proxy Toggle */}
      <div className="proxy-toggle-section">
        <div className="proxy-toggle-row">
          <label className="proxy-toggle-label" htmlFor="proxy-toggle-checkbox">
              <span className="proxy-toggle-text">
              <Globe size={16} style={{ color: 'var(--accent-cyan)' }} />
              <span className="fw-600">{t('proxy.title')}</span>
            </span>
            <div className="toggle-switch">
              <input
                id="proxy-toggle-checkbox"
                type="checkbox"
                checked={useProxy}
                onChange={(e) => onUseProxyChange && onUseProxyChange(e.target.checked)}
                disabled={isLoadingInfo}
              />
              <span className="toggle-slider" />
            </div>
          </label>
        </div>
        {useProxy && proxyStatus && (
          <div className="proxy-status-row">
            <span className="proxy-status-dot" />
            <span className="t-xs c-dim">
              {proxyStatus.availableProxies > 0
                ? t('proxy.statusActive', { count: proxyStatus.availableProxies })
                : t('proxy.statusFetching')}
            </span>
          </div>
        )}
        <div className="t-xs c-dim proxy-desc">
          {t('proxy.desc')}
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
