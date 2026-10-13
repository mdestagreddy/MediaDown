import MediaPreview from './MediaPreview';
import './PostsMediaBox.css';

const PostsMediaBox = ({ mediaInfo }) => {
  return (
    <div className="media-box posts-media-box">
      <MediaPreview mediaInfo={mediaInfo} showThumbnails={true} />
    </div>
  );
};

export default PostsMediaBox;
