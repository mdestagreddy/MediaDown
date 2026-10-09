import { Music, Sliders, CheckCircle2 } from 'lucide-react';
import './AudioFormatSelector.css';

const AudioFormatSelector = ({
  audioTargetFormat,
  onAudioTargetFormat,
  audioBitrate,
  onAudioBitrate,
  sampleRate,
  onSampleRate,
  bitDepth,
  onBitDepth
}) => {
  const isLossless = audioTargetFormat === 'wav' || audioTargetFormat === 'flac';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="audio-selector-row">
        {/* Target Format */}
        <div className="selector-group">
          <div className="group-label">
            <Music size={15} />
            <span>1. Format File Audio Output</span>
          </div>
          <select
            className="select-control"
            value={audioTargetFormat}
            onChange={(e) => onAudioTargetFormat(e.target.value)}
          >
            <optgroup label="Lossy (Kompresi Berbasis Bitrate)">
              <option value="mp3">MP3 (Universal & Kompatibel Semua Media Player)</option>
              <option value="m4a">M4A / AAC (Kualitas Tinggi Format Apple)</option>
              <option value="ogg">OGG (Opus / Vorbis Open Source)</option>
            </optgroup>
            <optgroup label="Lossless (Sample Rate & Bit Depth)">
              <option value="wav">WAV (Audio Lossless Tanpa Kompresi PCM)</option>
              <option value="flac">FLAC (Lossless Berkualitas Tinggi Studio)</option>
            </optgroup>
          </select>
        </div>

        {/* If Lossy: Bitrate Selector, If Lossless: Sample Rate */}
        {!isLossless ? (
          <div className="selector-group">
            <div className="group-label">
              <Sliders size={15} />
              <span>2. Kualitas Bitrate Audio (MP3 / M4A / OGG)</span>
            </div>
            <select
              className="select-control"
              value={audioBitrate}
              onChange={(e) => onAudioBitrate(e.target.value)}
            >
              <option value="320k">320 kbps (Kualitas Tertinggi / Hi-Fi)</option>
              <option value="256k">256 kbps (Kualitas Sangat Tinggi)</option>
              <option value="192k">192 kbps (Kualitas Menengah Bagus)</option>
              <option value="128k">128 kbps (Standar Kompresi Hemat Ukuran)</option>
              <option value="96k">96 kbps (Ukuran Ringan)</option>
              <option value="64k">64 kbps (Sangat Ringan / Voice & Podcast)</option>
              <option value="best">Kualitas Asli Sumber (Bitrate Asli)</option>
            </select>
          </div>
        ) : (
          <div className="selector-group">
            <div className="group-label">
              <Sliders size={15} />
              <span>2. Sample Rate (Frekuensi Sampel {audioTargetFormat.toUpperCase()})</span>
            </div>
            <select
              className="select-control"
              value={sampleRate}
              onChange={(e) => onSampleRate(e.target.value)}
            >
              <option value="auto">Sample Rate Asli Sumber (Disarankan)</option>
              <option value="44100">44.1 kHz (Standar CD Audio)</option>
              <option value="48000">48.0 kHz (Standar Studio & Video)</option>
              <option value="88200">88.2 kHz (High-Resolution 2x CD)</option>
              <option value="96000">96.0 kHz (Hi-Res Audio Studio Master)</option>
              <option value="192000">192.0 kHz (Ultra Hi-Res Audiophile)</option>
            </select>
          </div>
        )}
      </div>

      {/* Additional row for Bit Depth when Lossless (WAV / FLAC) */}
      {isLossless && (
        <div className="audio-selector-row">
          <div className="selector-group">
            <div className="group-label">
              <Sliders size={15} />
              <span>3. Bit Depth (Kedalaman Bit {audioTargetFormat.toUpperCase()})</span>
            </div>
            <select
              className="select-control"
              value={bitDepth}
              onChange={(e) => onBitDepth(e.target.value)}
            >
              <option value="auto">Bit Depth Asli Sumber</option>
              <option value="16">16-bit (Standar Red Book Audio CD)</option>
              <option value="24">24-bit (Studio Master Hi-Res Dynamic Range)</option>
              <option value="32">32-bit Float (Pro DAW Studio / Resolusi Penuh)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="auto-clean-notice" style={{ background: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.3)', color: '#a5f3fc', width: '100%' }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0, color: 'var(--accent-cyan)' }} />
              <span>
                Format <strong>{audioTargetFormat.toUpperCase()}</strong> adalah format <em>Lossless</em> tanpa kompresi bitrate. Kualitas diatur sepenuhnya oleh <strong>Sample Rate ({sampleRate === 'auto' ? 'Asli' : `${parseInt(sampleRate) / 1000} kHz`})</strong> dan <strong>Bit Depth ({bitDepth === 'auto' ? 'Asli' : `${bitDepth}-bit`})</strong>.
              </span>
            </div>
          </div>
        </div>
      )}

      {!isLossless && (
        <div className="auto-clean-notice" style={{ background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)', color: '#c7d2fe' }}>
          <Sliders size={18} style={{ flexShrink: 0, color: 'var(--accent-indigo)' }} />
          <span>
            Format <strong>{audioTargetFormat.toUpperCase()}</strong> adalah format <em>Lossy</em>. Kualitas audio diatur berdasarkan <strong>Bitrate ({audioBitrate === 'best' ? 'Asli' : audioBitrate})</strong>.
          </span>
        </div>
      )}
    </div>
  );
};

export default AudioFormatSelector;
