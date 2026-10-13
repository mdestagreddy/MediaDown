import MediaPreview from './MediaPreview';
import './PostsMediaBox.css';

const PostsMediaBox = ({ mediaInfo, openQrModal, onQrDataFetched }) => {
  return (
    <div className="media-box posts-media-box">
      <MediaPreview
        mediaInfo={mediaInfo}
        showThumbnails={true}
        openQrModal={openQrModal}
        onQrDataFetched={onQrDataFetched}
      />
    </div>
  );
};

export default PostsMediaBox;
