import MediaPreview from './MediaPreview';
import ModeTabs from './ModeTabs';
import VideoFormatSelector from './VideoFormatSelector';
import AudioFormatSelector from './AudioFormatSelector';
import DownloadActionCard from './DownloadActionCard';
import ImageQualitySelector from './ImageQualitySelector';
import PlaylistSelector from './PlaylistSelector';
import './MediaBox.css';

const MediaBox = ({
  mediaInfo,
  mode,
  onModeChange,
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
}) => (
  <div className="media-box">
    {/* Preview details */}
    <MediaPreview mediaInfo={mediaInfo} />

    {/* Mode Tabs */}
    <ModeTabs mode={mode} onChange={onModeChange} />

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
      <PlaylistSelector
        playlistItems={playlistItems || mediaInfo.playlistItems || []}
        selectedItems={selectedPlaylistItems}
        onSelectionChange={onPlaylistSelectionChange}
        onDownloadSelected={onDownloadPlaylistSelected}
        isDownloading={isStartingDownload}
        playlistTitle={mediaInfo.title}
      />
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

export default MediaBox;
