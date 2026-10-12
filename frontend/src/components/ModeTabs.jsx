import { Film, Music, Image, ListVideo } from 'lucide-react';
import './ModeTabs.css';
import useLocale from '../hooks/useLocale';

const ModeTabs = ({ mode, onChange, hideVideoTab }) => {
  const { t } = useLocale();

  return (
  <div className="tabs-nav">
    {!hideVideoTab && (
      <button
        type="button"
        className={`tab-btn ${mode === 'video' ? 'active' : ''}`}
        onClick={() => onChange('video')}
      >
        <Film size={18} />
        <span>{t('modeTabs.video')}</span>
      </button>
    )}
    <button
      type="button"
      className={`tab-btn ${mode === 'audio' ? 'active' : ''}`}
      onClick={() => onChange('audio')}
    >
      <Music size={18} />
      <span>{t('modeTabs.audio')}</span>
    </button>
    <button
      type="button"
      className={`tab-btn ${mode === 'image' ? 'active' : ''}`}
      onClick={() => onChange('image')}
    >
      <Image size={18} />
      <span>{t('modeTabs.image')}</span>
    </button>
    <button
      type="button"
      className={`tab-btn ${mode === 'playlist' ? 'active' : ''}`}
      onClick={() => onChange('playlist')}
    >
      <ListVideo size={18} />
      <span>{t('modeTabs.playlist')}</span>
    </button>
  </div>
  );
};

export default ModeTabs;
