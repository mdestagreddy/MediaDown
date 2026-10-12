import { ShieldCheck } from 'lucide-react';
import './ReadyBox.css';
import useLocale from '../hooks/useLocale';

const CleanedBanner = ({ task }) => {
  const { t } = useLocale();
  const isManualDelete = !task?.downloadedCount || task?.downloadedCount === 0;

  return (
    <div className="ready-box cleaned-box">
      <div className="ready-header">
        <div className="ready-icon cleaned-icon">
          <ShieldCheck size={28} />
        </div>
        <div className="ready-text-wrap">
          <div className="ready-title">
            {isManualDelete ? t('cleanedBanner.manualTitle') : t('cleanedBanner.title')}
          </div>
          <div className="t-base c-muted mt-4">
            {isManualDelete ? t('cleanedBanner.manualBody') : t('cleanedBanner.body')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanedBanner;
