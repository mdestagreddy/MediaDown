import { Sliders } from 'lucide-react';
import './ProgressCard.css';
import useLocale from '../hooks/useLocale';

const ProcessingCard = ({ task }) => {
  const { t } = useLocale();

  return (
    <div className="progress-card">
      <div className="progress-header">
        <div className="progress-status-title">
          <Sliders size={20} className="spin-slow c-indigo" />
          <span>{task.message || t('processingCard.processing')}</span>
        </div>
        <div className="progress-pct">98%</div>
      </div>
      <div className="progress-bar-bg">
        <div className="progress-bar-fill pw-98"></div>
      </div>
      <p className="t-base c-muted">
        {t('processingCard.processing')}
      </p>
    </div>
  );
};

export default ProcessingCard;
