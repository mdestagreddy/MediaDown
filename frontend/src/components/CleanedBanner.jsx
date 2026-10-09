import { ShieldCheck } from 'lucide-react';
import './ReadyBox.css';

const CleanedBanner = () => (
  <div className="ready-box" style={{ borderColor: 'rgba(99, 102, 241, 0.4)', background: 'rgba(15, 23, 42, 0.9)' }}>
    <div className="ready-header">
      <div className="ready-icon" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-indigo)', borderColor: 'var(--accent-indigo)' }}>
        <ShieldCheck size={28} />
      </div>
      <div className="ready-text-wrap">
        <div className="ready-title" style={{ color: '#fff' }}>Pengunduhan Sukses & File Server Dihapus!</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          File telah berhasil ditransfer ke perangkat Anda dan otomatis dibersihkan dari server untuk menjaga privasi dan mengosongkan penyimpanan.
        </div>
      </div>
    </div>
  </div>
);

export default CleanedBanner;
