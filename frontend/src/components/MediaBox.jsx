import MediaPreview from './MediaPreview';
import ModeTabs from './ModeTabs';
import VideoFormatSelector from './VideoFormatSelector';
import AudioFormatSelector from './AudioFormatSelector';
import DownloadActionCard from './DownloadActionCard';
import ImageQualitySelector from './ImageQualitySelector';
import PlaylistSelector from './PlaylistSelector';
import { Sliders, CheckCircle2, Info } from 'lucide-react';
import useLocale from '../hooks/useLocale';
import './MediaBox.css';

const MediaBox = ({
  mediaInfo,
  mode,
  onModeChange,
  isAudioOnly,
  onStartDownload,
  isStartingDownload,
  videoSettings,
  onVideoSettingChange,
  audioSettings,
  onAudioSettingChange,
  imageSettings,
  onImageSettingChange,
  playlistItems,
  selectedPlaylistItems,
  onPlaylistSelectionChange,
  onDownloadPlaylistSelected
}) => {
  const { t } = useLocale();

  return (
    <div className="media-box">
      {/* Preview details */}
      <MediaPreview mediaInfo={mediaInfo} />

      {/* Mode Tabs - hide Video tab when content is audio-only */}
      <ModeTabs mode={mode} onChange={onModeChange} hideVideoTab={isAudioOnly} hideTabsExceptPlaylist={mediaInfo?.isPlaylist} />

      {/* Video Mode Content */}
      {mode === 'video' && (
        <VideoFormatSelector
          mediaInfo={mediaInfo}
          selectedVideoFormat={videoSettings.selectedVideoFormat}
          onSelectVideoFormat={(value) => onVideoSettingChange('selectedVideoFormat', value)}
          selectedAudioFormat={videoSettings.selectedAudioFormat}
          onSelectAudioFormat={(value) => onVideoSettingChange('selectedAudioFormat', value)}
          videoContainer={videoSettings.videoContainer}
          onSelectVideoContainer={(value) => onVideoSettingChange('videoContainer', value)}
          videoQualityPreset={videoSettings.videoQualityPreset}
          onVideoQualityPresetChange={(value) => onVideoSettingChange('videoQualityPreset', value)}
        />
      )}

      {/* Audio Only Mode Content */}
      {mode === 'audio' && (
        <AudioFormatSelector
          audioTargetFormat={audioSettings.audioTargetFormat}
          onAudioTargetFormat={(value) => onAudioSettingChange('audioTargetFormat', value)}
          audioBitrate={audioSettings.audioBitrate}
          onAudioBitrate={(value) => onAudioSettingChange('audioBitrate', value)}
          sampleRate={audioSettings.sampleRate}
          onSampleRate={(value) => onAudioSettingChange('sampleRate', value)}
          bitDepth={audioSettings.bitDepth}
          onBitDepth={(value) => onAudioSettingChange('bitDepth', value)}
          embedMetadata={audioSettings.embedMetadata}
          onEmbedMetadata={(value) => onAudioSettingChange('embedMetadata', value)}
        />
      )}

      {/* Image/Thumbnail Mode Content */}
      {mode === 'image' && (
        <ImageQualitySelector
          imageQualities={mediaInfo?.imageQualities}
          images={mediaInfo?.images || mediaInfo?.thumbnails}
          selectedImageQuality={imageSettings?.imageQuality || 'best'}
          onSelectImageQuality={(value) => onImageSettingChange('imageQuality', value)}
          selectedImageFormat={imageSettings?.imageFormat || 'original'}
          onSelectImageFormat={(value) => onImageSettingChange('imageFormat', value)}
        />
      )}

      {/* Playlist Mode Content */}
      {mode === 'playlist' && mediaInfo?.isPlaylist && (
        <>
          <div className="playlist-quality-section">
            <div className="quality-label">
              <Sliders size={15} />
              <span>{t('playlist.qualitySettings')}</span>
            </div>
            <div className="playlist-quality-row">
              <div className="selector-group">
                <select
                  className="select-control"
                  value={audioSettings.playlistDownloadMode}
                  onChange={(e) => onAudioSettingChange('playlistDownloadMode', e.target.value)}
                >
                  <option value="video">{t('playlist.modeVideoAudio')}</option>
                  <option value="audio">{t('playlist.modeAudioOnly')}</option>
                </select>
              </div>
              <div className="selector-group">
                <select
                  className="select-control"
                  value={audioSettings.playlistQuality}
                  onChange={(e) => onAudioSettingChange('playlistQuality', e.target.value)}
                >
                  <option value="best">{t('playlist.qualityBest')}</option>
                  <option value="high">{t('playlist.qualityHigh')}</option>
                  <option value="medium">{t('playlist.qualityMedium')}</option>
                  <option value="low">{t('playlist.qualityLow')}</option>
                </select>
              </div>
            </div>
          </div>

          {audioSettings.playlistDownloadMode === 'audio' &&
            ['mp3', 'm4a', 'flac'].includes(audioSettings.audioTargetFormat) && (
              <div className="metadata-toggle-row">
                <label className="metadata-toggle-label">
                  <span className="group-label">
                    <CheckCircle2 size={15} />
                    <span>{t('audioFormat.metadataLabel')}</span>
                  </span>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={audioSettings.embedMetadata}
                      onChange={(e) => onAudioSettingChange('embedMetadata', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </div>
                </label>
                <div className="metadata-info">
                  <Info size={13} className="c-dim" />
                  <span className="t-xs c-dim">
                    {t('audioFormat.metadataDesc')}
                  </span>
                </div>
              </div>
            )}

          <PlaylistSelector
            playlistItems={playlistItems || mediaInfo.playlistItems || []}
            selectedItems={selectedPlaylistItems}
            onSelectionChange={onPlaylistSelectionChange}
            onDownloadSelected={onDownloadPlaylistSelected}
            isDownloading={isStartingDownload}
            playlistTitle={mediaInfo.title}
          />
        </>
      )}

      {/* Start Download Button */}
      {mode !== 'playlist' && (
        <DownloadActionCard
          mode={mode}
          videoContainer={videoSettings.videoContainer}
          audioTargetFormat={audioSettings.audioTargetFormat}
          isStartingDownload={isStartingDownload}
          onStartDownload={onStartDownload}
        />
      )}
    </div>
  );
};

export default MediaBox;
