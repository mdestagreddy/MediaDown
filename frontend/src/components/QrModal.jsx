import { Smartphone, RefreshCw, ShieldCheck, X } from 'lucide-react';
import './shared.css';

const QrModal = ({ qrData, networkInfo, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#fff' }}>
          <Smartphone size={18} style={{ color: 'var(--accent-cyan)' }} />
          <span>Unduh ke Ponsel / Perangkat Lain</span>
        </div>
        <button
          type="button"
          className="btn-secondary"
          style={{ padding: '4px 8px' }}
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        Pastikan ponsel atau perangkat Anda terhubung ke jaringan Wi-Fi yang sama (<strong>{networkInfo?.localIp}</strong>), lalu scan QR Code berikut:
      </p>

      <div className="qr-image-wrap">
        {qrData?.qrDataUrl ? (
          <img src={qrData.qrDataUrl} alt="Scan to Download" className="qr-image" />
        ) : (
          <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={24} className="spin-fast" />
          </div>
        )}
      </div>

      {qrData?.downloadUrl && (
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px', textAlign: 'left' }}>
            Tautan Unduh Langsung:
          </div>
          <div className="qr-link-box">
            {qrData.downloadUrl}
          </div>
        </div>
      )}

      <div className="auto-clean-notice" style={{ fontSize: '11px', width: '100%' }}>
        <ShieldCheck size={16} />
        <span>Saat ponsel Anda selesai mengunduh, file di server akan otomatis langsung terhapus.</span>
      </div>
    </div>
  </div>
);

export default QrModal;
