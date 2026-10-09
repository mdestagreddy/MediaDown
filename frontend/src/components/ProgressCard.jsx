import { RefreshCw } from 'lucide-react';
import './ProgressCard.css';

const ProgressCard = ({ task }) => (
  <div className="progress-card">
    <div className="progress-header">
      <div className="progress-status-title">
        <RefreshCw size={18} className="spin-fast" style={{ color: 'var(--accent-cyan)' }} />
        <span>{task.message || 'Mengunduh stream ke server...'}</span>
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
        <span>Kecepatan:</span>
        <strong style={{ color: '#fff' }}>{task.speed || 'Stabil'}</strong>
      </div>
      <div className="progress-metric">
        <span>Estimasi Sisa Waktu:</span>
        <strong style={{ color: '#fff' }}>{task.eta || '--'}</strong>
      </div>
    </div>
  </div>
);

export default ProgressCard;
