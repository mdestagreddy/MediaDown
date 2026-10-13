import { useState, useRef, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import PostsUrlInput from '../components/PostsUrlInput';
import PostsMediaBox from '../components/PostsMediaBox';
import HeroSection from '../components/HeroSection';
import ProgressCard from '../components/ProgressCard';
import ProcessingCard from '../components/ProcessingCard';
import ReadyBox from '../components/ReadyBox';
import CleanedBanner from '../components/CleanedBanner';
import FailedBanner from '../components/FailedBanner';
import { fetchJson } from '../utils/api';
import useLocale from '../hooks/useLocale';
import './PostsPage.css';

const CAPTCHA_ENABLED = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY) && import.meta.env.PROD;

const PostsPage = ({ openQrModal, onQrDataFetched, getCookieContent }) => {
  const { t } = useLocale();
  const [url, setUrl] = useState('');
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [mediaInfo, setMediaInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const sseRef = useRef(null);

  const handleTurnstileVerify = (token) => {
    setTurnstileToken(token || null);
  };

  const handleTurnstileError = (err) => {
    console.error('[Turnstile]', err);
    setErrorMessage(t('main.captchaVerifyError'));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch {
      // Fallback
    }
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    if (CAPTCHA_ENABLED && !turnstileToken) {
      setErrorMessage(t('main.captchaRequired'));
      return;
    }

    setIsLoadingInfo(true);
    setErrorMessage('');
    setMediaInfo(null);
    setActiveTask(null);

    try {
      const cookies = getCookieContent ? getCookieContent() : null;
      const postsJson = await fetchJson('/api/posts-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), turnstileToken, cookies })
      });

      if (postsJson.success && postsJson.data?.mediaItems?.length > 0) {
        const firstImage = postsJson.data.mediaItems.find(item => item?.type !== 'video');
        const allItems = postsJson.data.mediaItems;
        const postDetails = postsJson.data.postDetails || {};
        setMediaInfo({
          id: 'gallery',
          title: postDetails.content || t('main.galleryTitle'),
          thumbnail: firstImage?.url || allItems[0]?.url || '',
          extractor: 'gallery-dl',
          webpage_url: url.trim(),
          duration: 0,
          durationFormatted: '',
          uploader: postDetails.authorName || 'Unknown',
          uploaderUsername: postDetails.authorUsername || '',
          uploaderAvatar: postDetails.authorAvatar || '',
          view_count: postDetails.viewCount || null,
          postContent: postDetails.content || '',
          postHashtags: postDetails.hashtags || [],
          postMediaCount: postDetails.mediaCount || allItems.length,
          postDate: postDetails.date || '',
          imageQualities: postsJson.data.qualities,
          thumbnails: allItems,
          images: allItems,
          imageCount: postsJson.data.images?.length || 0,
          videoCount: postsJson.data.videos?.length || 0
        });
      } else if (postsJson.error) {
        throw new Error(postsJson.error);
      } else {
        const stderr = postsJson.data?.stderr;
        throw new Error(stderr || t('main.analyzeError'));
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const listenToTask = (taskId, attempt = 1) => {
    if (sseRef.current) {
      sseRef.current.close();
    }

    const sse = new EventSource(`/api/tasks/${taskId}/events`);
    sseRef.current = sse;

    let isSubscribed = true;

    sse.onopen = () => {
      // Reset reconnect attempts on (re)connect
    };

    sse.onmessage = (event) => {
      if (!isSubscribed) return;
      try {
        const taskData = JSON.parse(event.data);
        setActiveTask(taskData);

        if (taskData.status === 'ready') {
          loadQrCode(taskId);
        }
      } catch (err) {
        console.error('Error parsing SSE:', err);
      }
    };

    sse.onerror = () => {
      isSubscribed = false;
      if (attempt < 5) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 15000);
        setTimeout(() => listenToTask(taskId, attempt + 1), delay);
      }
    };
  };

  useEffect(() => {
    const tid = activeTask?.id;
    const st = activeTask?.status;
    if (!tid || st === 'cleaned' || st === 'failed' || st === undefined) return;

    const interval = setInterval(async () => {
      try {
        const json = await fetchJson(`/api/tasks/${tid}`);
        if (json?.success && json.task) {
          setActiveTask((prev) => ({
            ...prev,
            ...json.task,
            isCleaned: json.task.isCleaned,
            status: json.task.status
          }));
        }
      } catch (err) {
        console.warn('Task status poll gagal:', err.message);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [activeTask?.id, activeTask?.status]);

  const loadQrCode = async (taskId) => {
    try {
      const json = await fetchJson(`/api/qrcode/${taskId}`);
      if (json.success) {
        onQrDataFetched(json);
      }
    } catch (err) {
      console.error('Gagal mengambil QR Code:', err);
    }
  };

  const handleClientDownload = () => {
    if (!activeTask || !activeTask.id) return;

    const downloadUrl = `/api/download/file/${activeTask.id}`;

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.setAttribute('download', activeTask.fileName || 'media');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteFromServer = async () => {
    if (!activeTask || !activeTask.id) return;
    if (!confirm(t('readyBox.deleteConfirm'))) return;

    if (sseRef.current) sseRef.current.close();

    setActiveTask((prev) => ({
      ...prev,
      status: 'cleaned',
      isCleaned: true,
      filePath: null
    }));

    try {
      const json = await fetchJson(`/api/tasks/${activeTask.id}`, { method: 'DELETE' });
      if (!json.success) {
        console.error('Delete from server gagal:', json.error);
      }
    } catch (err) {
      console.error('Delete from server error:', err.message);
    }
  };

  return (
    <>
      <HeroSection
        titleKey="posts.heroTitle"
        titleSpanKey=""
        descKey="posts.heroDesc"
        platformsKey="posts.platformsList"
      />

      <PostsUrlInput
        url={url}
        setUrl={setUrl}
        onAnalyze={handleAnalyze}
        onPaste={handlePaste}
        isLoadingInfo={isLoadingInfo}
        errorMessage={errorMessage}
      />

      {CAPTCHA_ENABLED && (
        <div className="turnstile-card">
          <Turnstile
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
            options={{ theme: 'dark' }}
            onVerify={handleTurnstileVerify}
            onError={handleTurnstileError}
          />
        </div>
      )}

      {mediaInfo && (
        <PostsMediaBox
          mediaInfo={mediaInfo}
        />
      )}

      {activeTask && activeTask.status === 'downloading' && (
        <ProgressCard task={activeTask} />
      )}

      {activeTask && activeTask.status === 'processing' && (
        <ProcessingCard task={activeTask} />
      )}

      {activeTask && activeTask.status === 'ready' && (
        <ReadyBox
          task={activeTask}
          onClientDownload={handleClientDownload}
          onOpenQrModal={openQrModal}
          onDeleteFromServer={handleDeleteFromServer}
        />
      )}

      {activeTask && (activeTask.status === 'cleaned' || activeTask.isCleaned) && (
        <CleanedBanner task={activeTask} />
      )}

      {activeTask && activeTask.status === 'failed' && (
        <FailedBanner task={activeTask} />
      )}
    </>
  );
};

export default PostsPage;
