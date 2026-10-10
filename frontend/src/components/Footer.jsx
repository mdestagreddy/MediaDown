import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, ExternalLink } from 'lucide-react';
import './shared.css';
import useLocale from '../hooks/useLocale';

const GITHUB_URL = 'https://github.com/mdestagreddy/MediaDown';

const Footer = () => {
  const location = useLocation();
  const [currentYear] = useState(() => new Date().getFullYear());
  const { locale, setLocale, t } = useLocale();

  const toggleLocale = () => {
    const newLocale = locale === 'id' ? 'en' : 'id';
    setLocale(newLocale);
  };

  const localeLabel = locale === 'id'
    ? t('footer.indonesian')
    : t('footer.english');

  return (
    <footer className="app-footer">
      {/* Top row: Copyright (left) | Links (right) */}
      <div className="footer-top fl-between w-100">
        <span className="footer-copyright">
          © {currentYear} MediaDown · {t('footer.disclaimer')}
        </span>
        <div className="footer-nav fl-row gap-8 align-center flex-wrap">
          {location.pathname === '/terms'
            ? <Link to="/" className="footer-link">{t('footer.home')}</Link>
            : <Link to="/terms" className="footer-link">{t('terms.pageTitle')}</Link>
          }
          <span className="footer-divider c-dim">·</span>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link fl-row gap-6"
            title={t('footer.sourceCode')}
          >
            <ExternalLink size={14} />
            <span>{t('footer.sourceCode')}</span>
          </a>
        </div>
      </div>

      {/* Bottom row: Powered by (left) | Language toggle (right) */}
      <div className="footer-bottom fl-between w-100">
        <span className="c-dim footer-powered">
          {t('footer.poweredBy')} yt-dlp · gallery-dl · FFmpeg
        </span>
        <button
          type="button"
          className="btn-secondary btn-xs fl-row gap-6"
          onClick={toggleLocale}
          title={`${t('footer.language')}: ${localeLabel}`}
          aria-label={t('footer.language')}
        >
          <Globe size={12} />
          <span>{localeLabel}</span>
        </button>
      </div>
    </footer>
  );
};

export default Footer;
