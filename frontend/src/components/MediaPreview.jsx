import { Film, ExternalLink } from 'lucide-react';
import './MediaPreview.css';

const MediaPreview = ({ mediaInfo }) => (
  <div className="media-preview-header">
    <div className="thumbnail-wrap">
      {mediaInfo.thumbnail ? (
        <img src={mediaInfo.thumbnail} alt={mediaInfo.title} className="thumbnail-img" />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
          <Film size={36} />
        </div>
      )}
      {mediaInfo.durationFormatted && (
        <div className="duration-tag">{mediaInfo.durationFormatted}</div>
      )}
      <div className="platform-badge">{mediaInfo.extractor}</div>
    </div>

    <div className="media-details">
      <h2 className="media-title">{mediaInfo.title}</h2>
      <div className="media-meta-row">
        <span className="media-meta-item">
          <strong>Kreator:</strong> {mediaInfo.uploader}
        </span>
        {mediaInfo.webpage_url && (
          <a
            href={mediaInfo.webpage_url}
            target="_blank"
            rel="noreferrer"
            className="media-meta-item"
            style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}
          >
            <span>Buka Sumber</span>
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </div>
  </div>
);

export default MediaPreview;
