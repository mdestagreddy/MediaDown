import { Download, RefreshCw } from 'lucide-react';
import './DownloadActionCard.css';
import useLocale from '../hooks/useLocale';

const AUDIO_FORMAT_DISPLAY = {
  mp3: 'MP3',
  m4a: 'M4A',
  vorbis: 'OGG',
  opus: 'OPUS',
  original: 'ORIGINAL',
  wav: 'WAV',
  flac: 'FLAC',
};

const DownloadActionCard = ({
  mode,
  videoContainer,
  audioTargetFormat,
  isStartingDownload,
  onStartDownload
}) => {
  const { t } = useLocale();

  const modeLabel = () => {
    if (mode === 'video') return t('downloadAction.video', { container: videoContainer.toUpperCase() });
    if (mode === 'audio') {
      const fmt = AUDIO_FORMAT_DISPLAY[audioTargetFormat] || audioTargetFormat.toUpperCase();
      return t('downloadAction.audio', { format: fmt });
    }
    if (mode === 'image') return t('downloadAction.image');
    return '';
  };

  const modeSub = () => {
    if (mode === 'image') return t('downloadAction.imageSub');
    return t('downloadAction.videoSub');
  };

  return (
    <div className="action-card">
      <div className="action-info">
        <span className="action-info-title">
          {modeLabel()}
        </span>
        <span className="action-info-sub">
          {modeSub()}
        </span>
      </div>

      <button
        type="button"
        className="btn-download-large"
        onClick={onStartDownload}
        disabled={isStartingDownload}
      >
        {isStartingDownload ? (
          <>
            <RefreshCw size={20} className="spin-fast" />
            <span>{t('downloadAction.preparing')}</span>
          </>
        ) : (
          <>
            <Download size={20} />
            <span>{t('downloadAction.downloadNow')}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default DownloadActionCard;
