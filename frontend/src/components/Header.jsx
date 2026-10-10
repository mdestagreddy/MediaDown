import { useLocation } from 'react-router-dom';
import { Download, ShieldCheck, Sun, Moon, Monitor } from 'lucide-react';
import './Header.css';
import useLocale from '../hooks/useLocale';

const Header = ({ cookieInfo, onOpenCookieModal, networkInfo, theme, resolvedTheme, onToggleTheme }) => {
  const location = useLocation();
  const showCookieBtn = location.pathname === '/';
  const { t } = useLocale();

  const themeIcon = theme === 'auto'
    ? <Monitor size={16} />
    : resolvedTheme === 'light'
      ? <Sun size={16} />
      : <Moon size={16} />;

  return (
  <header className="app-header">
    <div className="brand">
      <div className="brand-icon"><Download size={24} /></div>
      <div>
        <div className="brand-title">{t('app.title')}</div>
        <div className="brand-subtitle">{t('app.subtitle')}</div>
      </div>
    </div>
    <div className="header-actions">
      <button
        type="button"
        className="btn-secondary theme-toggle"
        onClick={onToggleTheme}
        title={t('theme.toggleTitle')}
        aria-label={t('header.toggleThemeAria')}
      >
        {themeIcon} <span>{theme === 'auto' ? t('theme.auto') : theme === 'light' ? t('theme.light') : t('theme.dark')}</span>
      </button>
          {showCookieBtn && (
            <button
              type="button"
              className={`btn-secondary btn-xs fl-row gap-6 ${cookieInfo.exists ? 'border-emerald' : ''}`}
              onClick={onOpenCookieModal}
              title={t('header.cookieTitle')}
            >
              <ShieldCheck size={14} className={cookieInfo.exists ? 'c-emerald' : 'c-cyan'} />
              <span>{cookieInfo.exists ? t('header.cookieActive') : t('header.cookieBypass')}</span>
            </button>
          )}
        <div className="server-badge">
          <span className="server-dot"></span>
          <span>{t('header.serverReady')}</span>
          {networkInfo?.localIp && (
            <span className="t-sm c-dim">
              ({networkInfo.localIp})
            </span>
          )}
        </div>
    </div>
  </header>
  );
}

export default Header;
