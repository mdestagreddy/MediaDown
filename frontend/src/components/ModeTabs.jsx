import { Film, Music, Image, ListVideo } from 'lucide-react';
import './ModeTabs.css';

const ModeTabs = ({ mode, onChange }) => (
  <div className="tabs-nav">
    <button
      type="button"
      className={`tab-btn ${mode === 'video' ? 'active' : ''}`}
      onClick={() => onChange('video')}
    >
      <Film size={18} />
      <span>Video + Audio</span>
    </button>
    <button
      type="button"
      className={`tab-btn ${mode === 'audio' ? 'active' : ''}`}
      onClick={() => onChange('audio')}
    >
      <Music size={18} />
      <span>Audio Saja</span>
    </button>
    <button
      type="button"
      className={`tab-btn ${mode === 'image' ? 'active' : ''}`}
      onClick={() => onChange('image')}
    >
      <Image size={18} />
      <span>Gambar/Thumbnail</span>
    </button>
    <button
      type="button"
      className={`tab-btn ${mode === 'playlist' ? 'active' : ''}`}
      onClick={() => onChange('playlist')}
    >
      <ListVideo size={18} />
      <span>Playlist</span>
    </button>
  </div>
);

export default ModeTabs;
