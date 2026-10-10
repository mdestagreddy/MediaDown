import { FileCheck, Laptop, Smartphone, ShieldCheck, Download } from 'lucide-react';
import './ReadyBox.css';
import useLocale from '../hooks/useLocale';

const ReadyBox = ({ task, onClientDownload, onOpenQrModal }) => {
  const { t } = useLocale();
  const isPlaylist = task?.mode === 'playlist' && task.playlistFiles?.length > 0;

  const handleIndividualDownload = (fileName) => {
    const encodedName = encodeURIComponent(fileName);
    const downloadUrl = `/api/download/file/${task.id}/${encodedName}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
