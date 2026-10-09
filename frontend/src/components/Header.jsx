import { Download, ShieldCheck } from 'lucide-react';
import './Header.css';

const Header = ({ cookieInfo, setCookieStatusMsg, setShowCookieModal, networkInfo }) => (
  <header className="app-header">
    <div className="brand">
      <div className="brand-icon"><Download size={24} /></div>
      <div>
        <div className="brand-title">MediaDown</div>
        <div className="brand-subtitle">Pengunduh media sosial tingkat lanjut</div>
      </div>
    </div>
    <div className="header-actions">
      <button
        type="button"
        className="btn-secondary"
        style={{
          padding: '6px 14px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderColor: cookieInfo.exists ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)'
        }}
        onClick={() => {
          setCookieStatusMsg('');
          setShowCookieModal(true);
        }}
        title="Pengaturan Anti-Bot & Cookies YouTube"
      >
        <ShieldCheck size={14} style={{ color: cookieInfo.exists ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }} />
        <span>{cookieInfo.exists ? 'Cookies Aktif' : 'Bypass Bot / Cookies'}</span>
      </button>
      <div className="server-badge">
        <span className="server-dot"></span>
        <span>Server Siap</span>
        {networkInfo?.localIp && (
          <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
            ({networkInfo.localIp})
          </span>
        )}
      </div>
    </div>
  </header>
);

export default Header;
