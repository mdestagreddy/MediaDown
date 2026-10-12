import { Film, Volume2, Sliders, Info } from 'lucide-react';
import './VideoFormatSelector.css';
import useLocale from '../hooks/useLocale';

const VideoFormatSelector = ({
  mediaInfo,
  selectedVideoFormat,
  onSelectVideoFormat,
  selectedAudioFormat,
  onSelectAudioFormat,
  videoContainer,
  onSelectVideoContainer,
  videoQualityPreset,
  onVideoQualityPresetChange
}) => {
  const { t } = useLocale();

  const qualityPresets = [
    { value: 'low', label: t('videoFormat.presetLow'), res: '360p-480p / SD', desc: t('videoFormat.presetLowDesc') },
    { value: 'standard', label: t('videoFormat.presetStandard'), res: '720p / HD', desc: t('videoFormat.presetStandardDesc') },
    { value: 'high', label: t('videoFormat.presetHigh'), res: '1080p / Full HD', desc: t('videoFormat.presetHighDesc') },
    { value: 'ultra', label: t('videoFormat.presetUltra'), res: '4K / UHD', desc: t('videoFormat.presetUltraDesc') }
  ];

  const isCustom = videoQualityPreset === 'custom';

  return (
    <div className="fl-col gap-20">
      {/* Quality Preset Selector */}
      <div className="fl-col gap-12">
        <div className="group-label">
          <Sliders size={15} />
          <span>{t('videoFormat.labelPreset')}</span>
        </div>

        <div className="preset-grid">
          {qualityPresets.map((preset) => (
            <div
              key={preset.value}
              className={`preset-card ${videoQualityPreset === preset.value ? 'selected' : ''}`}
              onClick={() => onVideoQualityPresetChange(preset.value)}
            >
              <div className="preset-card-top">
                <span className="preset-badge">{preset.res}</span>
              </div>
              <div className="preset-card-bottom">
                <span className="preset-title">{preset.label}</span>
              </div>
            </div>
          ))}
          <div
            className={`preset-card ${isCustom ? 'selected' : ''}`}
            onClick={() => onVideoQualityPresetChange('custom')}
          >
            <div className="preset-card-top">
              <span className="preset-badge">{t('videoFormat.custom')}</span>
            </div>
            <div className="preset-card-bottom">
              <span className="preset-title">{t('videoFormat.labelCustom')}</span>
            </div>
          </div>
        </div>

        {!isCustom && (
          <div className="preset-description">
            <Info size={13} className="c-dim" />
            <span className="t-xs c-dim">
              {qualityPresets.find(p => p.value === videoQualityPreset)?.desc}
            </span>
          </div>
        )}
      </div>

      {/* Video Stream Selector (only in Custom mode) */}
      {!isCustom && (
        <div className="fl-col gap-12">
          <div className="group-label">
            <Film size={15} />
            <span>{t('videoFormat.label1')}</span>
          </div>
          <div className="preset-video-info">
            <Info size={13} className="c-dim" />
            <span className="t-xs c-dim">
              {t('videoFormat.mp4Fixed')}
            </span>
          </div>
        </div>
      )}

      {isCustom && (
        <div className="selector-group">
          <div className="group-label">
            <Film size={15} />
            <span>{t('videoFormat.label1')}</span>
          </div>

          <div className="options-grid">
            {/* Default Best Video */}
            <div
              className={`option-card ${selectedVideoFormat === 'bestvideo' ? 'selected' : ''}`}
              onClick={() => onSelectVideoFormat('bestvideo')}
            >
              <div className="card-top">
                <span className="quality-badge">{t('videoFormat.bestQuality')}</span>
                <span className="format-ext">AUTO</span>
              </div>
              <div className="card-bottom">
                <span>{t('videoFormat.maxQuality')}</span>
                <span>{t('videoFormat.auto')}</span>
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
                  <span>{vf.fps ? `${vf.fps} FPS` : t('videoFormat.standard')} • {vf.vcodec ? vf.vcodec.split('.')[0] : 'Video'}</span>
                  <span>{vf.formattedSize || t('videoFormat.dynamic')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Stream Selector & Output Container */}
      <div className="audio-selector-row">
        {/* Audio Choice */}
        <div className="selector-group">
          <div className="group-label">
            <Volume2 size={15} />
            <span>{t('videoFormat.label2')}</span>
          </div>
          <select
            className="select-control"
            value={selectedAudioFormat}
            onChange={(e) => onSelectAudioFormat(e.target.value)}
          >
            <option value="best">{t('videoFormat.audioBest')}</option>
            <option value="none">{t('videoFormat.audioNone')}</option>
            {mediaInfo.audioFormats?.map((af) => (
              <option key={af.format_id} value={af.format_id}>
                {af.label}
              </option>
            ))}
          </select>
        </div>

        {/* Video Format Container (only in Custom mode) */}
        {isCustom && (
          <div className="selector-group">
            <div className="group-label">
              <Sliders size={15} />
              <span>{t('videoFormat.label3')}</span>
            </div>
            <select
              className="select-control"
              value={videoContainer}
              onChange={(e) => onSelectVideoContainer(e.target.value)}
            >
              <option value="mp4">{t('videoFormat.mp4Desc')}</option>
              <option value="webm">{t('videoFormat.webmDesc')}</option>
              <option value="mkv">{t('videoFormat.mkvDesc')}</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoFormatSelector;
