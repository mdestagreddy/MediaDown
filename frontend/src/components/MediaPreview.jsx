import { Film, ExternalLink, Eye } from 'lucide-react';
import MediaCarousel from './MediaCarousel';
import './MediaPreview.css';
import useLocale from '../hooks/useLocale';

const formatViewCount = (count) => {
  if (!count || count < 0) return null;
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toLocaleString();
};

const MediaPreview = ({ mediaInfo, showThumbnails = false, openQrModal, onQrDataFetched }) => {
  const { t } = useLocale();
  const views = formatViewCount(mediaInfo?.view_count);
  const allThumbs = mediaInfo?.thumbnails || [];
  const carouselItems = showThumbnails && allThumbs.length > 0 ? allThumbs : null;

  return (
    <div className={`media-preview-header${showThumbnails ? ' posts-layout' : ''}`}>
      {!showThumbnails && (
        <div className="thumbnail-wrap">
          {mediaInfo.thumbnail ? (
            <img src={mediaInfo.thumbnail} alt={mediaInfo.title} className="thumbnail-img" />
          ) : (
            <div className="thumb-placeholder">
              <Film size={36} />
            </div>
          )}
          {mediaInfo.durationFormatted && (
            <div className="duration-tag">{mediaInfo.durationFormatted}</div>
          )}
          <div className="platform-badge">{mediaInfo.extractor}</div>
        </div>
      )}

      {showThumbnails && !carouselItems && mediaInfo.thumbnail && (
        <div className="thumbnail-wrap">
          {mediaInfo.thumbnail ? (
            <img src={mediaInfo.thumbnail} alt={mediaInfo.title} className="thumbnail-img" />
          ) : (
            <div className="thumb-placeholder">
              <Film size={36} />
            </div>
          )}
          {mediaInfo.durationFormatted && (
            <div className="duration-tag">{mediaInfo.durationFormatted}</div>
          )}
          <div className="platform-badge">{mediaInfo.extractor}</div>
        </div>
      )}

      {carouselItems && (
        <MediaCarousel
          mediaItems={carouselItems}
          platform={mediaInfo.extractor}
          postId={mediaInfo.id}
          openQrModal={openQrModal}
          onQrDataFetched={onQrDataFetched}
        />
      )}

      <div className="media-details">
        {showThumbnails && (mediaInfo.uploaderAvatar || mediaInfo.uploader || mediaInfo.uploaderUsername) && (
          <div className="post-author-header">
            {mediaInfo.uploaderAvatar && (
              <img src={mediaInfo.uploaderAvatar} alt={mediaInfo.uploader} className="post-author-avatar" />
            )}
            <div className="post-author-info">
              <span className="post-author-name">{mediaInfo.uploader}</span>
              {mediaInfo.uploaderUsername && (
                <span className="post-author-username">@{mediaInfo.uploaderUsername}</span>
              )}
            </div>
          </div>
        )}
        <h2 className="media-title">{mediaInfo.title}</h2>
        {showThumbnails && mediaInfo.postHashtags && mediaInfo.postHashtags.length > 0 && (
          <div className="post-hashtags">
            {mediaInfo.postHashtags.map((tag, i) => (
              <span key={i} className="post-hashtag">#{tag}</span>
            ))}
          </div>
        )}
        <div className="media-meta-row">
          <span className="media-meta-item">
            <strong>{t('mediaPreview.kreator')}:</strong> {mediaInfo.uploader}
          </span>
          {views && (
            <span className="media-meta-item">
              <Eye size={13} /> {views}
            </span>
          )}
          {mediaInfo.webpage_url && (
            <a
              href={mediaInfo.webpage_url}
              target="_blank"
              rel="noreferrer"
              className="media-meta-item link-cyan"
            >
              <span>{t('mediaPreview.source')}</span>
              <ExternalLink size={13} />
            </a>
          )}
          {showThumbnails && allThumbs.length > 0 && (
            <span className="media-meta-item">
              <Eye size={13} /> {allThumbs.length} {t('mediaPreview.mediaCount', { count: allThumbs.length })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPreview;
