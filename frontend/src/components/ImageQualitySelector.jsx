import { Image, Info } from 'lucide-react';
import './ImageQualitySelector.css';
import useLocale from '../hooks/useLocale';

const ImageQualitySelector = ({
  imageQualities,
  images,
  selectedImageQuality,
  onSelectImageQuality,
  selectedImageFormat,
  onSelectImageFormat
}) => {
  const { t } = useLocale();

  const qualityOptions = imageQualities || [
    { value: 'best', label: t('imageQuality.qualityBest'), format: 'original', quality: null },
    { value: 'high', label: t('imageQuality.qualityHigh'), format: 'webp', quality: 85 },
    { value: 'medium', label: t('imageQuality.qualityMedium'), format: 'webp', quality: 75 },
    { value: 'low', label: t('imageQuality.qualityLow'), format: 'webp', quality: 60 },
    { value: 'png', label: t('imageQuality.qualityPng'), format: 'png', quality: null },
    { value: 'jpg', label: t('imageQuality.qualityJpg'), format: 'jpg', quality: 90 }
  ];

  const formatOptions = ['original', 'webp', 'jpg', 'png'];

  return (
    <div className="image-quality-selector">
      <div className="selector-group">
        <div className="group-label">
          <Image size={15} />
          <span>{t('imageQuality.label')}</span>
        </div>

        {images && images.length > 0 && (
          <div className="image-quality-info">
            <Info size={13} className="c-dim" />
            <span>{t('imageQuality.imageCount', { count: images.length })}</span>
          </div>
        )}

        <div className="selector-group">
          <label className="t-sm c-dim">{t('imageQuality.qualityLabel')}</label>
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
          <label className="t-sm c-dim">{t('imageQuality.formatLabel')}</label>
          <select
            className="select-control"
            value={selectedImageFormat}
            onChange={(e) => onSelectImageFormat(e.target.value)}
          >
            {formatOptions.map((fmt) => (
              <option key={fmt} value={fmt}>
                {fmt === 'original' ? t('imageQuality.formatOriginal') : fmt.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ImageQualitySelector;
