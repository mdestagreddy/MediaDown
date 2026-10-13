import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { Film, Download } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import useCookies from '../hooks/useCookies';
import './MediaCarousel.css';

const MediaCarousel = ({ mediaItems, platform, postId }) => {
  const { getCookieContent } = useCookies();
  const [proxyCookies, setProxyCookies] = useState(null);

  useEffect(() => {
    getCookieContent().then(c => setProxyCookies(c));
  }, [getCookieContent]);

  if (!mediaItems || mediaItems.length === 0) return null;

  const maxCookieUrlLen = 6000;
  const buildProxyUrl = (itemUrl) => {
    let base = `/api/media-proxy?url=${encodeURIComponent(itemUrl)}`;
    if (proxyCookies && proxyCookies.length < maxCookieUrlLen) {
      base += `&cookies=${encodeURIComponent(proxyCookies)}`;
    }
    return base;
  };

  const generateFilename = (item, index) => {
    const ext = item.ext || 'jpg';
    const title = String(item.title || 'media')
      .replace(/[\r\n\t]/g, ' ')
      .replace(/[^\x20-\x7e]/g, '')
      .replace(/\s+/g, '_')
      .trim()
      .substring(0, 40);
    const platformSuffix = (platform || item.platform || 'media').substring(0, 20);
    const idSuffix = (postId || item.postId || (index + 1)).toString().substring(0, 20);
    return `${title} [${platformSuffix}, ${idSuffix}].${ext}`;
  };

  const displayItems = mediaItems;

  return (
    <div className="media-carousel-container">
      <Swiper
        modules={[Navigation, Pagination]}
        navigation={mediaItems.length > 1}
        pagination={mediaItems.length > 1 ? { clickable: true } : false}
        spaceBetween={16}
        slidesPerView={1}
        className="media-carousel"
      >
        {displayItems.map((item, i) => (
          <SwiperSlide key={item.id || i}>
            <div className="carousel-slide">
              <div className="carousel-media-wrap">
                {item.type === 'video' ? (
                  <video
                    src={buildProxyUrl(item.url)}
                    alt={`Video ${i + 1}`}
                    className="carousel-media-img"
                    controls
                    muted
                    preload="metadata"
                    poster={item.thumbnail}
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.title || `Media ${i + 1}`}
                    className="carousel-media-img"
                    loading="lazy"
                  />
                )}
                {item.type === 'video' && (
                  <div className="carousel-video-badge">
                    <Film size={16} />
                  </div>
                )}
                {item.type === 'gif' && (
                  <div className="carousel-gif-badge">GIF</div>
                )}
                {item.ext && item.type !== 'video' && (
                  <div className="carousel-ext-badge">{item.ext.toUpperCase()}</div>
                )}
                <a
                  href={buildProxyUrl(item.url) + `&filename=${encodeURIComponent(generateFilename(item, i))}`}
                  download
                  className="carousel-download-btn"
                  title="Download"
                >
                  <Download size={16} />
                </a>
              </div>
              <div className="carousel-caption">
                <span className="carousel-media-index">
                  {i + 1} / {mediaItems.length}
                </span>
                {item.title && <span className="carousel-media-title">{item.title}</span>}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default MediaCarousel;
