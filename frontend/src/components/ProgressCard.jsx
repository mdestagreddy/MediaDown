import { RefreshCw, Terminal } from 'lucide-react';
import { useEffect, useRef } from 'react';
import './ProgressCard.css';
import useLocale from '../hooks/useLocale';

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes) || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatEta(eta) {
  if (!eta) return '--:--';
  if (typeof eta === 'string') return eta;
  if (typeof eta === 'object') {
    return `${eta.hours || 0}:${String(eta.minutes || 0).padStart(2, '0')}:${String(eta.seconds || 0).padStart(2, '0')}`;
  }
  return '--:--';
}

const ProgressCard = ({ task }) => {
  const { t } = useLocale();
  const logEndRef = useRef(null);
  const showBytes = task.totalBytes > 0;

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task.logs]);

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

      {showBytes && (
        <div className="progress-bytes-row">
          <span className="t-sm c-muted">
            {formatBytes(task.downloadedBytes || 0)} / {formatBytes(task.totalBytes || 0)}
          </span>
        </div>
      )}

      <div className="progress-meta-row">
        <div className="progress-metric">
          <span>{t('progressCard.speedLabel')}</span>
          <strong>{task.speed || t('progressCard.speedChecking')}</strong>
        </div>
        <div className="progress-metric">
          <span>{t('progressCard.etaLabel')}</span>
          <strong>{formatEta(task.eta)}</strong>
        </div>
      </div>

      {task.logs && task.logs.length > 0 && (
        <div className="progress-terminal">
          <div className="terminal-header">
            <Terminal size={14} />
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

export default ProgressCard;
