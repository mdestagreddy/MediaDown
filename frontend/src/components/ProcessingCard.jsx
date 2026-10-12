import { Sliders } from 'lucide-react';
import { useEffect, useRef } from 'react';
import './ProgressCard.css';
import useLocale from '../hooks/useLocale';

const ProcessingCard = ({ task }) => {
  const { t } = useLocale();
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task?.logs]);

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

      {task.logs && task.logs.length > 0 && (
        <div className="progress-terminal">
          <div className="terminal-header">
            <Sliders size={14} />
            <span>{t('progressCard.logTitle')}</span>
          </div>
          <div className="terminal-body">
            {task.logs.map((log, i) => (
              <div key={i} className="terminal-line">
                {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingCard;
