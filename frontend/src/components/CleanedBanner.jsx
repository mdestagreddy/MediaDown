import { ShieldCheck } from 'lucide-react';
import './ReadyBox.css';
import useLocale from '../hooks/useLocale';

const CleanedBanner = () => {
  const { t } = useLocale();

  return (
    <div className="ready-box cleaned-box">
      <div className="ready-header">
        <div className="ready-icon cleaned-icon">
          <ShieldCheck size={28} />
        </div>
        <div className="ready-text-wrap">
          <div className="ready-title">{t('cleanedBanner.title')}</div>
          <div className="t-base c-muted mt-4">
            {t('cleanedBanner.body')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanedBanner;
