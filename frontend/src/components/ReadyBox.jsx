import { FileCheck, Laptop, Smartphone, ShieldCheck, Download } from 'lucide-react';
import './ReadyBox.css';

const ReadyBox = ({ task, onClientDownload, onOpenQrModal }) => {
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
            {isPlaylist ? 'Playlist Selesai Diproses di Server!' : 'File Selesai Diproses di Server!'}
          </div>
          <div className="ready-file-info">
            {isPlaylist
              ? `${task.itemCount || task.playlistFiles.length} file siap diunduh (${task.formattedSize})`
              : `${task.fileName} ${task.formattedSize && `(${task.formattedSize})`}`
            }
          </div>
        </div>
      </div>

      <div className="ready-buttons-row">
        {/* Download to this machine */}
        <button
          type="button"
          className="btn-client-download"
          onClick={onClientDownload}
        >
          <Laptop size={20} />
          <span>{isPlaylist ? 'Unduh Semua ke Perangkat Ini' : 'Unduh ke Perangkat Ini'}</span>
        </button>

        {/* Send to mobile / another device */}
        <button
          type="button"
          className="btn-qr-download"
          onClick={onOpenQrModal}
        >
          <Smartphone size={20} />
          <span>Kirim / Unduh ke HP / Perangkat Lain (QR)</span>
        </button>
      </div>

      {/* Playlist individual file download links */}
      {isPlaylist && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Unduh file individu:
          </div>
          {task.playlistFiles.slice(0, 5).map((file) => (
            <button
              key={file.name}
              type="button"
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                justifyContent: 'flex-start',
                gap: '8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              onClick={() => handleIndividualDownload(file.name)}
              title={file.name}
            >
              <Download size={14} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
            </button>
          ))}
          {task.playlistFiles.length > 5 && (
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', paddingLeft: '4px' }}>
              +{task.playlistFiles.length - 5} file lainnya tersedia
            </div>
          )}
        </div>
      )}

      {/* Privacy & Auto-Clean Notice */}
      <div className="auto-clean-notice">
        <ShieldCheck size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
        <span>
          <strong>Perlindungan Privasi & Storage:</strong> {isPlaylist
            ? 'File-file ini akan otomatis dihapus dari server segera setelah berhasil diunduh ke perangkat Anda.'
            : 'File ini akan otomatis dihapus dari server segera setelah berhasil diunduh ke perangkat Anda.'}
        </span>
      </div>
    </div>
  );
};

export default ReadyBox;
