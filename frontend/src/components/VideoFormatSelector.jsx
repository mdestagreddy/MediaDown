import { Film, Volume2, Sliders } from 'lucide-react';
import './VideoFormatSelector.css';

const VideoFormatSelector = ({
  mediaInfo,
  selectedVideoFormat,
  onSelectVideoFormat,
  selectedAudioFormat,
  onSelectAudioFormat,
  videoContainer,
  onSelectVideoContainer
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    {/* Video Stream Selector */}
    <div className="selector-group">
      <div className="group-label">
        <Film size={15} />
        <span>1. Pilih Kualitas Resolusi Video (Tersedia dari 4K/1080p hingga 144p)</span>
      </div>

      <div className="options-grid">
        {/* Default Best Video */}
        <div
          className={`option-card ${selectedVideoFormat === 'bestvideo' ? 'selected' : ''}`}
          onClick={() => onSelectVideoFormat('bestvideo')}
        >
          <div className="card-top">
            <span className="quality-badge">Resolusi Tertinggi</span>
            <span className="format-ext">AUTO</span>
          </div>
          <div className="card-bottom">
            <span>Kualitas Maksimum Terbaik</span>
            <span>Otomatis</span>
          </div>
        </div>

        {/* Video formats list (all codecs/formats) */}
        {mediaInfo.allVideoFormats?.map((vf) => (
          <div
            key={vf.format_id}
            className={`option-card ${selectedVideoFormat === vf.format_id ? 'selected' : ''}`}
            onClick={() => onSelectVideoFormat(vf.format_id)}
          >
            <div className="card-top">
              <span className="quality-badge">{vf.friendlyName || vf.resolution}</span>
              <span className="format-ext">{vf.ext ? vf.ext.toUpperCase() : 'MP4'}</span>
            </div>
            <div className="card-bottom">
              <span>{vf.fps ? `${vf.fps} FPS` : 'Standard'} • {vf.vcodec ? vf.vcodec.split('.')[0] : 'Video'}</span>
              <span>{vf.formattedSize || 'Dinamis'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Audio Stream Selector & Output Container */}
    <div className="audio-selector-row">
      {/* Audio Choice */}
      <div className="selector-group">
        <div className="group-label">
          <Volume2 size={15} />
          <span>2. Pasangan Kualitas Audio (Bebas Pilih)</span>
        </div>
        <select
          className="select-control"
          value={selectedAudioFormat}
          onChange={(e) => onSelectAudioFormat(e.target.value)}
        >
          <option value="best">🎵 Kualitas Audio Terbaik (Disarankan)</option>
          <option value="none">🔇 Tanpa Suara (Video Mute / Hening)</option>
          {mediaInfo.audioFormats?.map((af) => (
            <option key={af.format_id} value={af.format_id}>
              {af.label}
            </option>
          ))}
        </select>
      </div>

      {/* Video Format Container */}
      <div className="selector-group">
        <div className="group-label">
          <Sliders size={15} />
          <span>3. Format Kontainer Output Video</span>
        </div>
        <select
          className="select-control"
          value={videoContainer}
          onChange={(e) => onSelectVideoContainer(e.target.value)}
        >
          <option value="mp4">MP4 (Paling Populer & Kompatibel Semua Perangkat)</option>
          <option value="webm">WebM (Ukuran Efisien & Kualitas Tinggi)</option>
          <option value="mkv">MKV (Mendukung Multi-Audio & Subtitle)</option>
        </select>
      </div>
    </div>
  </div>
);

export default VideoFormatSelector;
