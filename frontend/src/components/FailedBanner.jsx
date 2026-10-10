import { AlertCircle } from 'lucide-react';
import './shared.css';
import useLocale from '../hooks/useLocale';

const FailedBanner = ({ task }) => {
  const { t } = useLocale();

  return (
    <div className="error-banner">
      <AlertCircle size={24} />
      <div>
        <strong>{t('failedBanner.title')}</strong>
        <div className="t-base mt-4">{task.error || task.message || t('failedBanner.body')}</div>
      </div>
    </div>
  );
};

export default FailedBanner;
