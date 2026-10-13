import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { Film, Download, Laptop, Smartphone, X } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import useCookies from '../hooks/useCookies';
import { fetchJson } from '../utils/api';
import './MediaCarousel.css';

const MediaCarousel = ({ mediaItems, platform, postId, openQrModal, onQrDataFetched }) => {
  const { getCookieContent } = useCookies();
  const proxyCookies = getCookieContent();

  const [dialogItem, setDialogItem] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);

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
      .replace(/[<>:"/\\|?*]/g, '_')
      .trim()
      .substring(0, 40);
    const platformSuffix = (platform || item.platform || 'media').substring(0, 20);
    const idSuffix = (postId || item.postId || (index + 1)).toString().substring(0, 20);
     return `${title} [${platformSuffix}, ${idSuffix}].${ext}`;
  };

  const openDialog = (item, i) => {
    setDialogItem({ ...item, index: i });
  };

  const closeDialog = () => {
    setDialogItem(null);
  };

  const handleDirectDownload = (item, i) => {
    const downloadUrl = buildProxyUrl(item.url) + `&filename=${encodeURIComponent(generateFilename(item, i))}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.setAttribute('download', generateFilename(item, i));
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    closeDialog();
  };

  const handleQrCode = async (item, i) => {
    setLoadingQr(true);
    const generatedFileName = generateFilename(item, i);
    const targetUrl = buildProxyUrl(item.url) + `&filename=${encodeURIComponent(generatedFileName)}`;
    try {
      const json = await fetchJson(`/api/qrcode/url?${new URLSearchParams({ url: targetUrl })}`);
      if (json.success) {
        if (openQrModal && onQrDataFetched) {
          onQrDataFetched({
            qrDataUrl: json.qrDataUrl,
            downloadUrl: json.downloadUrl,
            isPlaylist: false,
            fileName: generatedFileName
          });
          openQrModal();
          closeDialog();
        }
      }
    } catch (err) {
      console.error('Gagal membuat QR code:', err.message);
    } finally {
      setLoadingQr(false);
    }
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
          <SwiperSlide key={`${item.id || item.url || i}_${i}`}>
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
                <button
                  type="button"
                  className="carousel-download-btn"
                  title="Download"
                  onClick={() => openDialog(item, i)}
                >
                  <Download size={16} />
                </button>
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

      {dialogItem && (
        <div className="carousel-download-dialog-overlay" onClick={closeDialog}>
          <div className="carousel-download-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="carousel-dialog-header">
              <span className="carousel-dialog-title">Download</span>
              <button type="button" className="carousel-dialog-close" onClick={closeDialog}>
                <X size={16} />
              </button>
            </div>
            <div className="carousel-dialog-options">
              <button
                type="button"
                className="carousel-dialog-option"
                onClick={() => handleDirectDownload(dialogItem, dialogItem.index)}
              >
                <Laptop size={18} />
                <span>Download ke perangkat ini</span>
              </button>
              <button
                type="button"
                className="carousel-dialog-option"
                onClick={() => handleQrCode(dialogItem, dialogItem.index)}
                disabled={loadingQr}
              >
                <Smartphone size={18} />
                <span>{loadingQr ? 'Menyiapkan...' : 'Via QR Code'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaCarousel;
