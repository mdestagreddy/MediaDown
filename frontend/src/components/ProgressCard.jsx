import { RefreshCw } from 'lucide-react';
import './ProgressCard.css';
import useLocale from '../hooks/useLocale';

const ProgressCard = ({ task }) => {
  const { t } = useLocale();

  return (
    <div className="progress-card">
      <div className="progress-header">
        <div className="progress-status-title">
          <RefreshCw size={18} className="spin-fast c-cyan" />
          <span>{task.message || t('progressCard.downloading')}</span>
        </div>
        <div className="progress-pct">{task.progress?.toFixed(1) || 0}%</div>
      </div>

      <div className="progress-bar-bg">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.max(task.progress || 0, 4)}%` }}
        ></div>
      </div>

      <div className="progress-meta-row">
        <div className="progress-metric">
          <span>{t('progressCard.speedLabel')}</span>
          <strong>{task.speed || t('progressCard.speedChecking')}</strong>
        </div>
        <div className="progress-metric">
          <span>{t('progressCard.etaLabel')}</span>
          <strong>
            {task.eta
              ? `${task.eta.hours || 0}:${String(task.eta.minutes || 0).padStart(2, '0')}:${String(task.eta.seconds || 0).padStart(2, '0')}`
              : '--:--'}
          </strong>
        </div>
      </div>
    </div>
  );
};

export default ProgressCard;
