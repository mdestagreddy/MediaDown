import { FileCheck, Laptop, Smartphone, ShieldCheck, Download, PlayCircle, FileText, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import './ReadyBox.css';
import useLocale from '../hooks/useLocale';
import { fetchJson } from '../utils/api';

const getPreviewType = (fileName, mode) => {
  if (mode === 'audio') return 'audio';
  if (mode === 'image') return 'image';
  if (mode === 'video') return 'video';

  if (!fileName) return 'video';
  const ext = fileName.split('.').pop().toLowerCase();
  if (['mp4', 'webm', 'mkv', 'mov', 'avi', 'm4v', 'mpg', 'mpeg'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'opus', 'wma'].includes(ext)) return 'audio';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) return 'image';
  return 'video';
};

const ReadyBox = ({ task, onClientDownload, onOpenQrModal, onDeleteFromServer }) => {
  const { t } = useLocale();
  const isPlaylist = task?.mode === 'playlist' && task.playlistFiles?.length > 0;

  const previewFile = useMemo(() => {
    if (isPlaylist && task.playlistFiles[0]) return task.playlistFiles[0];
    return { name: task.fileName, size: task.fileSize };
  }, [task, isPlaylist]);

  const previewType = useMemo(
    () => getPreviewType(previewFile?.name || task.fileName, task?.mode),
    [previewFile, task.fileName, task.mode]
  );

  const previewUrl = useMemo(() => {
    if (isPlaylist && task.playlistFiles[0]?.name) {
      return `/api/preview/${task.id}/${encodeURIComponent(task.playlistFiles[0].name)}`;
    }
    return `/api/preview/${task.id}`;
  }, [task, isPlaylist]);

  const handleIndividualDownload = async (fileName) => {
    const encodedName = encodeURIComponent(fileName);
    const tokenJson = await fetchJson(`/api/token/${task.id}`);
    const downloadUrl = tokenJson.success ? `/api/download/file/${task.id}/${encodedName}?token=${tokenJson.token}` : `/api/download/file/${task.id}/${encodedName}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderPreview = () => {
    switch (previewType) {
      case 'video':
        return (
          <div className="preview-wrapper">
            <video
              key={previewUrl}
              src={previewUrl}
              controls
              controlsList="nodownload"
              preload="metadata"
              className="preview-media"
              poster={task.thumbnail}
            >
              {t('readyBox.noVideoPreview')}
            </video>
            <div className="preview-badge fl-row gap-4 align-center">
              <PlayCircle size={14} />
              <span>{t('readyBox.videoPreview')}</span>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="preview-wrapper">
            <audio
              key={previewUrl}
              src={previewUrl}
              controls
              controlsList="nodownload"
              preload="metadata"
              className="preview-media"
            >
              {t('readyBox.noAudioPreview')}
            </audio>
            <div className="preview-badge fl-row gap-4 align-center">
              <FileText size={14} />
              <span>{t('readyBox.audioPreview')}</span>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="preview-wrapper">
            <img
              key={previewUrl}
              src={previewUrl}
              alt={previewFile?.name || task.fileName}
              className="preview-media"
              loading="lazy"
            />
            <div className="preview-badge fl-row gap-4 align-center">
              <FileText size={14} />
              <span>{t('readyBox.imagePreview')}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="ready-box">
      <div className="ready-header">
        <div className="ready-icon">
          <FileCheck size={28} />
        </div>
        <div className="ready-text-wrap">
          <div className="ready-title">
            {isPlaylist ? t('readyBox.playlistComplete') : t('readyBox.singleComplete')}
          </div>
          <div className="ready-file-info">
            {isPlaylist
              ? `${task.itemCount || task.playlistFiles.length} ${t('readyBox.files')} (${task.formattedSize})`
              : `${task.fileName} ${task.formattedSize && `(${task.formattedSize})`}`
            }
          </div>
        </div>
      </div>

      {/* Media Preview Section - only for single file downloads */}
      {!isPlaylist && renderPreview()}

      <div className="ready-buttons-row">
        <button
          type="button"
          className="btn-client-download"
          onClick={onClientDownload}
        >
          <Laptop size={20} />
          <span>{isPlaylist ? t('readyBox.downloadAllThisDevice') : t('readyBox.downloadThisDevice')}</span>
        </button>

        <button
          type="button"
          className="btn-qr-download"
          onClick={onOpenQrModal}
        >
          <Smartphone size={20} />
          <span>{t('readyBox.sendToDevice')}</span>
        </button>
      </div>

      {/* Manual Delete from Server */}
      <div className="ready-delete-row">
        <button
          type="button"
          className="btn-delete-server"
          onClick={onDeleteFromServer}
          title={t('readyBox.deleteFromServer')}
        >
          <Trash2 size={16} />
          <span>{t('readyBox.deleteFromServer')}</span>
        </button>
      </div>

      {isPlaylist && (
        <div className="fl-col gap-6 mt-8">
          <div className="t-sm c-muted fw-600">
            {t('readyBox.individualFiles')}
          </div>
          {task.playlistFiles.slice(0, 5).map((file) => (
            <button
              key={file.name}
              type="button"
              className="ready-file-btn"
              onClick={() => handleIndividualDownload(file.name)}
              title={file.name}
            >
              <Download size={14} />
              <span className="text-ellipsis">{file.name}</span>
            </button>
          ))}
          {task.playlistFiles.length > 5 && (
            <div className="t-xs c-dim pl-4">
              {t('readyBox.moreFiles', { count: task.playlistFiles.length - 5 })}
            </div>
          )}
        </div>
      )}

      <div className="auto-clean-notice">
        <ShieldCheck size={18} className="c-amber" />
        <span>
          <strong>{t('readyBox.privacyNotice')}</strong> {isPlaylist
             ? t('readyBox.autoCleanPlaylist')
             : t('readyBox.autoCleanSingle')}
        </span>
      </div>
    </div>
  );
};

export default ReadyBox;
