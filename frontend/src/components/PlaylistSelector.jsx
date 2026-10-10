import { ListVideo, PlaySquare, CheckSquare, Square } from 'lucide-react';
import './PlaylistSelector.css';
import useLocale from '../hooks/useLocale';

const PlaylistSelector = ({
  playlistItems = [],
  selectedItems = [],
  onSelectionChange,
  onDownloadSelected,
  _onDownloadAll,
  isDownloading,
  playlistTitle
}) => {
  const { t } = useLocale();

  const handleToggle = (index) => {
    const newSelected = selectedItems.includes(index)
      ? selectedItems.filter(i => i !== index)
      : [...selectedItems, index];
    onSelectionChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.length === playlistItems.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(playlistItems.map((_, i) => i));
    }
  };

  const totalSelected = selectedItems.length;
  const totalItems = playlistItems.length;
  const allSelected = totalSelected === totalItems && totalItems > 0;

  return (
    <div className="playlist-selector">
      <div className="playlist-header">
        <div className="playlist-title">
          <ListVideo size={20} className="c-cyan" />
          <span>{playlistTitle || t('playlist.title')}</span>
          <span className="playlist-count">{totalItems} {totalItems !== 1 ? t('playlist.itemPlural') : t('playlist.itemSingular')}</span>
        </div>

        <div className="playlist-actions">
          <button
            type="button"
            className="btn-secondary btn-13 fl-row gap-6"
            onClick={handleSelectAll}
            title={allSelected ? t('playlist.unselectAllTooltip') : t('playlist.selectAllTooltip')}
          >
            {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
            <span>{allSelected ? t('playlist.unselectAll') : t('playlist.selectAll')}</span>
          </button>

          <button
            type="button"
            className="btn-primary btn-14 fl-row gap-6"
            onClick={() => onDownloadSelected(selectedItems)}
            disabled={isDownloading || totalSelected === 0}
          >
            <PlaySquare size={14} />
            <span>{t('playlist.downloadSelected', { count: totalSelected })}</span>
          </button>
        </div>
      </div>

      <div className="playlist-items">
        {playlistItems.map((item, index) => {
          const isSelected = selectedItems.includes(index);
          return (
            <div
              key={`${item.id}-${index}`}
              className={`playlist-item ${isSelected ? 'selected' : ''}`}
              onClick={() => handleToggle(index)}
            >
              <div className="playlist-item-checkbox">
                {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              </div>

              {(item.thumbnail || item.url) && (
                <div className="playlist-item-thumb">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} loading="lazy" />
                  ) : (
                    <PlaySquare size={16} className="c-dim" />
                  )}
                </div>
              )}

              <div className="playlist-item-details">
                <div className="playlist-item-title">{item.title}</div>
                {item.uploader && (
                  <div className="playlist-item-uploader">{item.uploader}</div>
                )}
                {item.durationFormatted && (
                  <div className="playlist-item-duration">{item.durationFormatted}</div>
                )}
              </div>

              <div className="playlist-item-index">#{index + 1}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlaylistSelector;
