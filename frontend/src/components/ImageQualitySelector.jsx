import { Image, Info } from 'lucide-react';
import './ImageQualitySelector.css';

const ImageQualitySelector = ({
  imageQualities,
  images,
  selectedImageQuality,
  onSelectImageQuality,
  selectedImageFormat,
  onSelectImageFormat
}) => {
  const qualityOptions = imageQualities || [
    { value: 'best', label: 'Kualitas Tertinggi (Asli)', format: 'original', quality: null },
    { value: 'high', label: 'Tinggi (85%)', format: 'webp', quality: 85 },
    { value: 'medium', label: 'Sedang (75%)', format: 'webp', quality: 75 },
    { value: 'low', label: 'Hemat (60%)', format: 'webp', quality: 60 },
    { value: 'png', label: 'PNG (Lossless)', format: 'png', quality: null },
    { value: 'jpg', label: 'JPG (90%)', format: 'jpg', quality: 90 }
  ];

  const formatOptions = ['original', 'webp', 'jpg', 'png'];

  return (
    <div className="image-quality-selector">
      <div className="selector-group">
        <div className="group-label">
          <Image size={15} />
          <span>Unduh Gambar dengan Kualitas Pilihan</span>
        </div>

        {images && images.length > 0 && (
          <div className="image-quality-info">
            <Info size={13} style={{ color: 'var(--text-dim)' }} />
            <span>{images.length} gambar tersedia untuk diunduh</span>
          </div>
        )}

        <div className="selector-group">
          <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Kualitas/Kompresi</label>
          <select
            className="select-control"
            value={selectedImageQuality}
            onChange={(e) => onSelectImageQuality(e.target.value)}
          >
            {qualityOptions.map((q) => (
              <option key={q.value} value={q.value}>
                {q.label}
              </option>
            ))}
          </select>
        </div>

        <div className="selector-group">
          <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Format Output</label>
          <select
            className="select-control"
            value={selectedImageFormat}
            onChange={(e) => onSelectImageFormat(e.target.value)}
          >
            {formatOptions.map((fmt) => (
              <option key={fmt} value={fmt}>
                {fmt === 'original' ? 'Original (Asli)' : fmt.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ImageQualitySelector;
