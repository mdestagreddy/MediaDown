import { ShieldCheck, Trash2, FileText, X } from 'lucide-react';
import './shared.css';

const CookieModal = ({
  cookieInfo,
  cookieText,
  setCookieText,
  isSavingCookies,
  cookieStatusMsg,
  onSave,
  onDelete,
  onFileUpload,
  onClose
}) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="qr-modal" style={{ maxWidth: '540px', textAlign: 'left', alignItems: 'stretch' }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#fff', fontSize: '16px' }}>
          <ShieldCheck size={20} style={{ color: 'var(--accent-emerald)' }} />
          <span>Bypass Anti-Bot & Cookies</span>
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

      {/* Status Info Box */}
      <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '14px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '13px' }}>
            <span style={{ color: cookieInfo.exists ? 'var(--accent-emerald)' : 'var(--text-dim)', fontWeight: 700 }}>
              {cookieInfo.exists ? '● Cookies Terpasang:' : '○ '}
            </span>{' '}
            <span style={{ color: '#fff' }}>
              {cookieInfo.exists ? `${cookieInfo.size} bytes` : 'Belum ada file cookies.txt'}
            </span>
          </div>
          {cookieInfo.exists && (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              onClick={onDelete}
            >
              <Trash2 size={12} style={{ marginRight: '4px' }} />
              Hapus
            </button>
          )}
        </div>
      </div>

      {/* Cookie input area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
            Pasang Cookies Akun (Netscape Format):
          </label>
          <label className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}>
            <FileText size={12} style={{ marginRight: '4px' }} />
            Pilih File cookies.txt
            <input type="file" accept=".txt" onChange={onFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        <textarea
          rows={5}
          className="select-control"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', resize: 'vertical' }}
          placeholder="# Netscape HTTP Cookie File&#10;.youtube.com&#9;TRUE&#9;/&#9;TRUE&#9;...&#10;Tempel isi file cookies.txt di sini..."
          value={cookieText}
          onChange={(e) => setCookieText(e.target.value)}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Tip: Ekspor cookies menggunakan ekstensi browser gratis <em>Get cookies.txt LOCALLY</em>.
          </span>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: '13px' }}
            onClick={onSave}
            disabled={isSavingCookies || !cookieText.trim()}
          >
            {isSavingCookies ? 'Menyimpan...' : 'Simpan Cookies'}
          </button>
        </div>
      </div>

      {cookieStatusMsg && (
        <div style={{ fontSize: '13px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)' }}>
          {cookieStatusMsg}
        </div>
      )}
    </div>
  </div>
);

export default CookieModal;
