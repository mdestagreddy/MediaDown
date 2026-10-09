import { Download, RefreshCw } from 'lucide-react';
import './DownloadActionCard.css';

const DownloadActionCard = ({
  mode,
  videoContainer,
  audioTargetFormat,
  isStartingDownload,
  onStartDownload
}) => (
  <div className="action-card">
    <div className="action-info">
      <span className="action-info-title">
        {mode === 'video' ? `Unduh Video (${videoContainer.toUpperCase()})` : ''}
        {mode === 'audio' ? `Unduh Audio (${audioTargetFormat.toUpperCase()})` : ''}
        {mode === 'image' ? 'Unduh Gambar/Thumbnail' : ''}
      </span>
      <span className="action-info-sub">
        {mode === 'image' ? 'Mengunduh gambar/thumbnail dari server dengan kualitas yang dipilih.' : 'Server akan mengunduh stream terpisah & menggabungkannya via FFmpeg secara instan.'}
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
          <span>Mempersiapkan...</span>
        </>
      ) : (
        <>
          <Download size={20} />
          <span>Unduh Sekarang</span>
        </>
      )}
    </button>
  </div>
);

export default DownloadActionCard;
