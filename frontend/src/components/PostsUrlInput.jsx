import {
  Clipboard,
  RefreshCw,
  Sliders,
  AlertCircle,
  X,
  Image
} from 'lucide-react';
import './PostsUrlInput.css';
import useLocale from '../hooks/useLocale';

const PostsUrlInput = ({
  url,
  setUrl,
  onAnalyze,
  onPaste,
  isLoadingInfo,
  errorMessage
}) => {
  const { t } = useLocale();

  return (
    <div className="input-card">
      <form onSubmit={onAnalyze} className="input-wrapper">
        <div className="input-icon">
          <Image size={20} />
        </div>
        <input
          type="url"
          className="url-input"
          placeholder={t('posts.urlPlaceholder')}
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
              disabled={isLoadingInfo}
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={onPaste}
            title={t('main.pasteTooltip')}
            disabled={isLoadingInfo}
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
                <span>{t('posts.analyzeBtn')}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {errorMessage && (
        <div className="error-banner fl-between gap-12 flex-wrap">
          <div className="fl-row gap-10">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostsUrlInput;
