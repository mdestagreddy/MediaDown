import { AlertCircle } from 'lucide-react';
import './shared.css';

const FailedBanner = ({ task }) => (
  <div className="error-banner" style={{ padding: '18px' }}>
    <AlertCircle size={24} />
    <div>
      <strong>Gagal Memproses Media:</strong>
      <div style={{ fontSize: '13px', marginTop: '4px' }}>{task.error || task.message}</div>
    </div>
  </div>
);

export default FailedBanner;
