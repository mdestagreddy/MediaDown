import { Smartphone, RefreshCw, ShieldCheck, X } from 'lucide-react';
import './shared.css';
import useLocale from '../hooks/useLocale';

const QrModal = ({ qrData, networkInfo, onClose, visible }) => {
  const { t } = useLocale();

  return (
    <div className={`modal-overlay ${visible ? 'modal-visible' : ''}`} onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fl-between w-100" onClick={(e) => e.stopPropagation()}>
          <div className="fl-row gap-8 fw-700 c-main">
            <Smartphone size={18} className="c-cyan" />
            <span>{t('qrModal.downloadToDevice')}</span>
          </div>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <p className="t-base c-muted">
          {t('qrModal.wifiPrompt')} (<strong>{networkInfo?.localIp}</strong>), {t('qrModal.scanQr')}
        </p>

        <div className="qr-image-wrap">
          {qrData?.qrDataUrl ? (
            <img src={qrData.qrDataUrl} alt="Scan to Download" className="qr-image" />
          ) : (
            <div className="qr-placeholder">
              <RefreshCw size={24} className="spin-fast" />
            </div>
          )}
        </div>

        {qrData?.downloadUrl && (
          <div className="w-100">
            <div className="t-xs c-dim mb-4">
              {t('qrModal.directLink')}
            </div>
            <div className="qr-link-box">
              {qrData.downloadUrl}
            </div>
          </div>
        )}

        <div className="auto-clean-notice t-xs w-100">
          <ShieldCheck size={16} />
          <span>{t('qrModal.autoDelete')}</span>
        </div>
      </div>
    </div>
  );
};

export default QrModal;
