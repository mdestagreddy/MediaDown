import { Music, Sliders, CheckCircle2 } from 'lucide-react';
import './AudioFormatSelector.css';
import useLocale from '../hooks/useLocale';

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
  const { t } = useLocale();
  const isLossless = audioTargetFormat === 'wav' || audioTargetFormat === 'flac';
  const isOriginal = audioTargetFormat === 'original';

  return (
    <div className="fl-col gap-20">
      <div className="audio-selector-row">
        {/* Target Format */}
        <div className="selector-group">
          <div className="group-label">
            <Music size={15} />
            <span>{t('audioFormat.label1')}</span>
          </div>
          <select
            className="select-control"
            value={audioTargetFormat}
            onChange={(e) => onAudioTargetFormat(e.target.value)}
          >
            <option value="original">{t('audioFormat.originalDesc')}</option>
            <optgroup label={t('audioFormat.lossyGroup')}>
              <option value="mp3">{t('audioFormat.mp3Desc')}</option>
              <option value="m4a">{t('audioFormat.m4aDesc')}</option>
              <option value="vorbis">{t('audioFormat.oggDesc')}</option>
              <option value="opus">{t('audioFormat.opusDesc')}</option>
            </optgroup>
            <optgroup label={t('audioFormat.losslessGroup')}>
              <option value="wav">{t('audioFormat.wavDesc')}</option>
              <option value="flac">{t('audioFormat.flacDesc')}</option>
            </optgroup>
          </select>
        </div>

        {/* If Lossy: Bitrate Selector, If Lossless: Sample Rate */}
        {isOriginal ? (
          <div className="selector-group">
            <div className="group-label">
              <Sliders size={15} />
              <span>{t('audioFormat.label2Original')}</span>
            </div>
            <select
              className="select-control"
              value={audioBitrate}
              onChange={(e) => onAudioBitrate(e.target.value)}
            >
              <option value="original">{t('audioFormat.bitrateOriginalSource')}</option>
              <option value="550k">{t('audioFormat.opusBitrate550')}</option>
              <option value="320k">{t('audioFormat.bitrate320')}</option>
              <option value="256k">{t('audioFormat.bitrate256')}</option>
              <option value="192k">{t('audioFormat.bitrate192')}</option>
              <option value="128k">{t('audioFormat.bitrate128')}</option>
              <option value="96k">{t('audioFormat.bitrate96')}</option>
              <option value="64k">{t('audioFormat.bitrate64')}</option>
            </select>
          </div>
        ) : !isLossless ? (
          <div className="selector-group">
            <div className="group-label">
              <Sliders size={15} />
              <span>{t('audioFormat.label2Lossy')}</span>
            </div>
            <select
              className="select-control"
              value={audioBitrate}
              onChange={(e) => onAudioBitrate(e.target.value)}
            >
              {audioTargetFormat === 'opus' ? (
                <>
                  <option value="original">{t('audioFormat.bitrateOriginalSource')}</option>
                  <option value="550k">{t('audioFormat.opusBitrate550')}</option>
                  <option value="320k">{t('audioFormat.opusBitrate320')}</option>
                  <option value="256k">{t('audioFormat.opusBitrate256')}</option>
                  <option value="192k">{t('audioFormat.opusBitrate192')}</option>
                  <option value="128k">{t('audioFormat.opusBitrate128')}</option>
                  <option value="96k">{t('audioFormat.opusBitrate96')}</option>
                  <option value="64k">{t('audioFormat.opusBitrate64')}</option>
                  <option value="48k">{t('audioFormat.opusBitrate48')}</option>
                  <option value="32k">{t('audioFormat.opusBitrate32')}</option>
                  <option value="24k">{t('audioFormat.opusBitrate24')}</option>
                </>
              ) : (
                <>
                  <option value="original">{t('audioFormat.bitrateOriginalSource')}</option>
                  <option value="320k">{t('audioFormat.bitrate320')}</option>
                  <option value="256k">{t('audioFormat.bitrate256')}</option>
                  <option value="192k">{t('audioFormat.bitrate192')}</option>
                  <option value="128k">{t('audioFormat.bitrate128')}</option>
                  <option value="96k">{t('audioFormat.bitrate96')}</option>
                  <option value="64k">{t('audioFormat.bitrate64')}</option>
                </>
              )}
            </select>
          </div>
        ) : (
          <div className="selector-group">
            <div className="group-label">
              <Sliders size={15} />
              <span>{t('audioFormat.label2Lossless', { format: audioTargetFormat.toUpperCase() })}</span>
            </div>
            <select
              className="select-control"
              value={sampleRate}
              onChange={(e) => onSampleRate(e.target.value)}
            >
              <option value="auto">{t('audioFormat.sampleRateAuto')}</option>
              <option value="44100">{t('audioFormat.sampleRate44')}</option>
              <option value="48000">{t('audioFormat.sampleRate48')}</option>
              <option value="88200">88.2 kHz (High-Resolution 2x CD)</option>
              <option value="96000">{t('audioFormat.sampleRate96')}</option>
              <option value="192000">{t('audioFormat.sampleRate192')}</option>
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
              <span>{t('audioFormat.label3', { format: audioTargetFormat.toUpperCase() })}</span>
            </div>
            <select
              className="select-control"
              value={bitDepth}
              onChange={(e) => onBitDepth(e.target.value)}
            >
              <option value="auto">{t('audioFormat.bitDepthAuto')}</option>
              <option value="16">{t('audioFormat.bitDepth16')}</option>
              <option value="24">{t('audioFormat.bitDepth24')}</option>
              <option value="32">32-bit Float (Pro DAW Studio / Full Resolution)</option>
            </select>
          </div>

          <div className="fl-row">
            <div className="auto-clean-notice auto-clean-cyan w-100">
              <CheckCircle2 size={18} className="c-cyan" />
              <span>
                Format <strong>{audioTargetFormat.toUpperCase()}</strong> adalah format <em>Lossless</em> tanpa kompresi bitrate. Kualitas diatur sepenuhnya oleh <strong>Sample Rate ({sampleRate === 'auto' ? t('audioFormat.rateAuto') : `${parseInt(sampleRate) / 1000} kHz`})</strong> dan <strong>Bit Depth ({bitDepth === 'auto' ? t('audioFormat.depthAuto') : `${bitDepth}-bit`})</strong>.
              </span>
            </div>
          </div>
        </div>
      )}

      {!isLossless && !isOriginal && (
        <div className="auto-clean-notice auto-clean-indigo">
          <Sliders size={18} className="c-indigo" />
          <span>
            Format <strong>{audioTargetFormat.toUpperCase()}</strong> adalah format <em>Lossy</em>. Kualitas audio diatur berdasarkan <strong>Bitrate ({audioBitrate === 'original' ? t('audioFormat.rateAuto') : audioBitrate})</strong>.
          </span>
        </div>
      )}

      {isOriginal && (
        <div className="auto-clean-notice auto-clean-indigo">
          <Sliders size={18} className="c-indigo" />
          <span>
            Format <strong>{t('audioFormat.originalDesc')}</strong> akan mempertahankan kodek audio sumber asli. Jika bitrate "Original", file akan di-stream-copy tanpa encoding ulang.
          </span>
        </div>
      )}
    </div>
  );
};

export default AudioFormatSelector;
