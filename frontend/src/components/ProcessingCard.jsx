import { Sliders } from 'lucide-react';
import './ProgressCard.css';

const ProcessingCard = ({ task }) => (
  <div className="progress-card">
    <div className="progress-header">
      <div className="progress-status-title">
        <Sliders size={20} className="spin-slow" style={{ color: 'var(--accent-indigo)' }} />
        <span>{task.message || 'Menggabungkan stream video & audio dengan FFmpeg...'}</span>
      </div>
      <div className="progress-pct">98%</div>
    </div>
    <div className="progress-bar-bg">
      <div className="progress-bar-fill" style={{ width: '98%' }}></div>
    </div>
    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
      Sedang melakukan muxing dan encode audio/video dengan akselerasi FFmpeg...
    </p>
  </div>
);

export default ProcessingCard;
