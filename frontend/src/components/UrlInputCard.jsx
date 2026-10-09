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
}) => (
  <div className="input-card">
    <form onSubmit={onAnalyze} className="input-wrapper">
      <div className="input-icon">
        <Radio size={20} />
      </div>
      <input
        type="url"
        className="url-input"
        placeholder="Tempel tautan gambar/video/audio (misal: YouTube, TikTok, IG, Twitter, dll)..."
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
              title="Hapus"
            >
            <X size={16} />
          </button>
        )}
        <button
          type="button"
          className="btn-secondary"
          onClick={onPaste}
          title="Tempel dari Clipboard"
        >
          <Clipboard size={16} />
          <span>Tempel</span>
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoadingInfo || !url.trim()}
        >
          {isLoadingInfo ? (
            <>
              <RefreshCw size={16} className="spin-fast" />
              <span>Memeriksa...</span>
            </>
          ) : (
            <>
              <Sliders size={16} />
              <span>Analisis Media</span>
            </>
          )}
        </button>
      </div>
    </form>

    {/* Engine Toggle */}
    <div className="engine-toggle-wrapper">
      <span className="engine-toggle-label">
        <Cpu size={12} />
        <span>Engine:</span>
      </span>
      <div className="engine-toggle">
        <button
          type="button"
          className={`engine-btn ${mediaEngine === 'auto' ? 'active' : ''}`}
          onClick={() => onMediaEngineChange('auto')}
          title="Deteksi otomatis (yt-dlp + gallery-dl)"
          disabled={isLoadingInfo}
        >
          <Cpu size={14} />
          <span>Auto</span>
        </button>
        <button
          type="button"
          className={`engine-btn ${mediaEngine === 'ytdl' ? 'active' : ''}`}
          onClick={() => onMediaEngineChange('ytdl')}
          title="Paksa gunakan yt-dlp (video/audio)"
          disabled={isLoadingInfo}
        >
          <Video size={14} />
          <span>yt-dlp</span>
        </button>
        <button
          type="button"
          className={`engine-btn ${mediaEngine === 'gallery' ? 'active' : ''}`}
          onClick={() => onMediaEngineChange('gallery')}
          title="Paksa gunakan gallery-dl (gambar)"
          disabled={isLoadingInfo}
        >
          <Image size={14} />
          <span>gallery-dl</span>
        </button>
      </div>
    </div>

    {errorMessage && (
      <div className="error-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
        {(errorMessage.toLowerCase().includes('bot') || errorMessage.toLowerCase().includes('sign in') || errorMessage.toLowerCase().includes('429')) && (
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12px', background: 'rgba(255, 255, 255, 0.15)', color: '#fff' }}
            onClick={onOpenCookieModal}
          >
            <Key size={13} style={{ marginRight: '6px' }} />
            <span>Atur Cookies Anti-Bot</span>
          </button>
        )}
      </div>
    )}
  </div>
);

export default UrlInputCard;
