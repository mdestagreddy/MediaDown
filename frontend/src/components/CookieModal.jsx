import { ShieldCheck, Trash2, FileText, X } from 'lucide-react';
import './shared.css';
import useLocale from '../hooks/useLocale';

const CookieModal = ({
  cookieInfo,
  cookieText,
  setCookieText,
  isSavingCookies,
  cookieStatusMsg,
  onSave,
  onDelete,
  onFileUpload,
  onClose,
  visible
}) => {
  const { t } = useLocale();

  return (
    <div className={`modal-overlay ${visible ? 'modal-visible' : ''}`} onClick={onClose}>
      <div className="cookie-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fl-between w-parent">
          <div className="fl-row gap-8 fw-700 t-xl c-main mr-auto">
            <ShieldCheck size={20} className="c-emerald" />
            <span>{t('cookieModal.title')}</span>
          </div>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Status Info Box */}
        <div className="cookie-status-box w-parent">
          <div className="fl-between">
            <div className="t-base">
              <span className={cookieInfo.exists ? 'c-emerald fw-700' : 'c-dim fw-700'}>
                {cookieInfo.exists ? t('cookieModal.cookiesInstalled') + ':' : '○ '}
              </span>{' '}
              <span className="c-main">
                {cookieInfo.exists ? `${cookieInfo.size} ${t('cookieModal.bytes')}` : t('cookieModal.noCookies')}
              </span>
            </div>
            {cookieInfo.exists && (
              <button
                type="button"
                className="btn-secondary btn-sm c-rose border-error"
                onClick={onDelete}
              >
                <Trash2 size={12} className="mr-4" />
                {t('cookieModal.deleteBtn')}
              </button>
            )}
          </div>
        </div>

        {/* Cookie input area */}
        <div className="fl-col gap-8">
          <div className="fl-between">
            <label className="t-base fw-600 c-main">
              {t('cookieModal.sectionLabel')}
            </label>
            <label className="btn-secondary btn-sm">
              <FileText size={12} className="mr-4" />
              {t('cookieModal.chooseFile')}
              <input type="file" accept=".txt" onChange={onFileUpload} className="input-file-hidden" />
            </label>
          </div>

          <textarea
            rows={5}
            className="select-control t-mono t-xs resize-y"
            placeholder={t('cookieModal.placeholder')}
            value={cookieText}
            onChange={(e) => setCookieText(e.target.value)}
          />

          <div className="fl-between mt-4">
            <span className="t-xs c-dim">
              {t('cookieModal.tip')} <em>{t('cookieModal.extensionName')}</em>
            </span>
            <button
              type="button"
              className="btn-primary btn-md"
              onClick={onSave}
              disabled={isSavingCookies || !cookieText.trim()}
            >
              {isSavingCookies ? t('cookieModal.saving') : t('cookieModal.saveBtn')}
            </button>
          </div>
        </div>

        {cookieStatusMsg && (
          <div className="cookie-status-msg">
            {cookieStatusMsg}
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieModal;
