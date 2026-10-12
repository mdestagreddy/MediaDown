import { useState, useRef, useCallback, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import '../components/shared.css';

import HeroSection from '../components/HeroSection';
import UrlInputCard from '../components/UrlInputCard';
import MediaBox from '../components/MediaBox';
import ProgressCard from '../components/ProgressCard';
import ProcessingCard from '../components/ProcessingCard';
import ReadyBox from '../components/ReadyBox';
import CleanedBanner from '../components/CleanedBanner';
import FailedBanner from '../components/FailedBanner';
import { fetchJson } from '../utils/api';
import useLocale from '../hooks/useLocale';
import './MainPage.css';

const CAPTCHA_ENABLED = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY) && import.meta.env.PROD;

const MainPage = ({ openQrModal, onQrDataFetched, onOpenCookieModal }) => {
  const { t } = useLocale();
  const [url, setUrl] = useState('');
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [mediaInfo, setMediaInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [mode, setMode] = useState('video');
  const [mediaEngine, setMediaEngine] = useState('auto');
  const [turnstileToken, setTurnstileToken] = useState(null);

  const [videoSettings, setVideoSettings] = useState({
    selectedVideoFormat: '',
    selectedAudioFormat: 'best',
    videoContainer: 'mp4',
    videoQualityPreset: 'standard'
  });

  const [audioSettings, setAudioSettings] = useState({
    audioTargetFormat: 'mp3',
    audioBitrate: 'original',
    sampleRate: 'auto',
    bitDepth: 'auto',
    playlistDownloadMode: 'video',
    playlistQuality: 'best'
  });

  const [imageSettings, setImageSettings] = useState({
    imageQuality: 'best',
    imageFormat: 'original'
  });

  const [playlistItems, setPlaylistItems] = useState([]);
  const [selectedPlaylistItems, setSelectedPlaylistItems] = useState([]);

  // Track if media is audio-only (no video streams available)
  const [isAudioOnly, setIsAudioOnly] = useState(false);

  const [activeTask, setActiveTask] = useState(null);
  const [isStartingDownload, setIsStartingDownload] = useState(false);
  const sseRef = useRef(null);
  const downloadGuardRef = useRef(false);

  const updateVideoSetting = (key, value) =>
    setVideoSettings((prev) => ({ ...prev, [key]: value }));

  const updateAudioSetting = (key, value) =>
    setAudioSettings((prev) => ({ ...prev, [key]: value }));

  const updateImageSetting = (key, value) =>
    setImageSettings((prev) => ({ ...prev, [key]: value }));

  const handleTurnstileVerify = useCallback((token) => {
    setTurnstileToken(token || null);
  }, []);

  const handleTurnstileError = useCallback((err) => {
    console.error('[Turnstile]', err);
    setErrorMessage(t('main.captchaVerifyError'));
  }, [t]);
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch {
      // Fallback
    }
  };

  // Inspect / Extract Media Info
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
    setPlaylistItems([]);
    setSelectedPlaylistItems([]);

    try {
      const forceYtDlp = mediaEngine === 'ytdl';
      const forceGallery = mediaEngine === 'gallery';

      const shouldTryGallery = (mode === 'image' || forceGallery) && !forceYtDlp;
      const shouldTryYtDlp = !forceGallery && (mediaEngine === 'auto' || mode !== 'image');

      let imageInfoResult = null;

      if (shouldTryGallery) {
        try {
          const imageJson = await fetchJson('/api/image-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url.trim(), turnstileToken })
          });

          if (imageJson.success && imageJson.data?.images?.length > 0) {
            imageInfoResult = imageJson.data;
          }
        } catch (imageErr) {
          console.error('gallery-dl image-info failed:', imageErr);
        }

        if (imageInfoResult) {
          setMediaInfo({
            id: 'gallery',
            title: t('main.galleryTitle'),
            thumbnail: imageInfoResult.images?.[0]?.url || '',
            extractor: 'gallery-dl',
            webpage_url: url.trim(),
            duration: 0,
            durationFormatted: '00:00',
            uploader: 'Unknown',
            view_count: null,
            imageQualities: imageInfoResult.qualities,
            thumbnails: imageInfoResult.thumbnails,
            images: imageInfoResult.images
          });
          setErrorMessage('');
          setPlaylistItems([]);
          setSelectedPlaylistItems([]);
        } else if (!shouldTryYtDlp) {
          throw new Error(t('main.galleryError'));
        }
      }

      if (shouldTryYtDlp) {
        let infoResult = null;
        try {
          const infoJson = await fetchJson('/api/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url.trim(), includePlaylist: true, turnstileToken })
          });

          if (infoJson.success) {
            infoResult = infoJson.data;
          } else if (infoJson.error && infoJson.error.includes('No video formats')) {
            if (!shouldTryGallery) {
              try {
                const imageJson = await fetchJson('/api/image-info', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: url.trim(), turnstileToken })
                });
                if (imageJson.success && imageJson.data?.images?.length > 0) {
                  setMediaInfo({
                    id: 'gallery',
                    title: t('main.galleryTitle'),
                    thumbnail: imageJson.data.images?.[0]?.url || '',
                    extractor: 'gallery-dl',
                    webpage_url: url.trim(),
                    duration: 0,
                    durationFormatted: '00:00',
                    uploader: 'Unknown',
                    view_count: null,
                    imageQualities: imageJson.data.qualities,
                    thumbnails: imageJson.data.thumbnails,
                    images: imageJson.data.images
                  });
                  setPlaylistItems([]);
                  setSelectedPlaylistItems([]);
                  setErrorMessage('');
                  return;
                }
              } catch (fallbackErr) {
                console.error('gallery-dl fallback failed:', fallbackErr);
              }
            }
          }
        } catch (infoErr) {
          console.error('yt-dlp info failed:', infoErr);
        }

        if (infoResult) {
          if (infoResult.isPlaylist) {
            setMediaInfo(infoResult);
            setPlaylistItems(infoResult.playlistItems || []);
            setSelectedPlaylistItems([]);
            setMode('playlist');
          } else {
            setMediaInfo(infoResult);
            setPlaylistItems([]);
            setSelectedPlaylistItems([]);

            const audioOnly = !infoResult.videoFormats || infoResult.videoFormats.length === 0;
            setIsAudioOnly(audioOnly);

            if (audioOnly) {
              // Auto-switch to Audio tab for audio-only content
              setMode('audio');
            } else {
              if (infoResult.videoFormats && infoResult.videoFormats.length > 0) {
                updateVideoSetting('selectedVideoFormat', infoResult.videoFormats[0].format_id);
              } else {
                updateVideoSetting('selectedVideoFormat', 'bestvideo');
              }
              updateVideoSetting('selectedAudioFormat', 'best');
            }
          }
        } else if (!imageInfoResult) {
          throw new Error(t('main.analyzeError'));
        }
      }

      if (mode === 'video' && mediaInfo?.videoFormats && mediaInfo.videoFormats.length > 0) {
        updateVideoSetting('selectedVideoFormat', mediaInfo.videoFormats[0].format_id);
        updateVideoSetting('selectedAudioFormat', 'best');
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleStartDownload = async () => {
    if (downloadGuardRef.current) return;
    downloadGuardRef.current = true;

    if (!url.trim() || !mediaInfo) {
      downloadGuardRef.current = false;
      return;
    }

    if (CAPTCHA_ENABLED && !turnstileToken) {
      setErrorMessage(t('main.captchaIncomplete'));
      downloadGuardRef.current = false;
      return;
    }

    setIsStartingDownload(true);
    setErrorMessage('');

    try {
      const payload = {
        url: url.trim(),
        mode,
        title: mediaInfo.title,
        videoFormatId: videoSettings.selectedVideoFormat,
        audioFormatId: videoSettings.selectedAudioFormat,
        videoContainer: videoSettings.videoContainer,
        videoQualityPreset: videoSettings.videoQualityPreset,
        audioFormat: audioSettings.audioTargetFormat,
        audioQuality: audioSettings.audioBitrate,
        sampleRate: audioSettings.sampleRate,
        bitDepth: audioSettings.bitDepth,
        imageQuality: imageSettings.imageQuality,
        imageFormat: imageSettings.imageFormat,
        mediaEngine,
        totalImages: mode === 'image' ? (mediaInfo.images?.length || 0) : 0,
        turnstileToken
      };

      const json = await fetchJson('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (CAPTCHA_ENABLED) {
        setTurnstileToken(null);
        if (window.turnstile) window.turnstile.reset();
      }

      if (!json.success) {
        throw new Error(json.error || t('main.downloadStartFailed'));
      }

      listenToTask(json.taskId);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsStartingDownload(false);
      downloadGuardRef.current = false;
    }
  };

  const handleDownloadPlaylistSelected = async () => {
    if (downloadGuardRef.current) return;
    downloadGuardRef.current = true;

    if (!url.trim() || !mediaInfo) {
      downloadGuardRef.current = false;
      return;
    }

    if (mode === 'playlist' && selectedPlaylistItems.length === 0) {
      setErrorMessage(t('main.playlistEmpty'));
      downloadGuardRef.current = false;
      return;
    }

    if (CAPTCHA_ENABLED && !turnstileToken) {
      setErrorMessage(t('main.captchaIncomplete'));
      downloadGuardRef.current = false;
      return;
    }

    setIsStartingDownload(true);
    setErrorMessage('');

    try {
      const payload = {
        url: url.trim(),
        mode: 'playlist',
        title: mediaInfo.title,
         videoFormatId: videoSettings.selectedVideoFormat,
        audioFormatId: videoSettings.selectedAudioFormat,
        videoContainer: videoSettings.videoContainer,
        videoQualityPreset: videoSettings.videoQualityPreset,
        audioFormat: audioSettings.audioTargetFormat,
        audioQuality: audioSettings.audioBitrate,
        sampleRate: audioSettings.sampleRate,
        bitDepth: audioSettings.bitDepth,
        imageQuality: imageSettings.imageQuality,
        imageFormat: imageSettings.imageFormat,
        playlistItems: selectedPlaylistItems,
        playlistMode: selectedPlaylistItems.length > 0 ? 'selected' : 'all',
        playlistDownloadMode: audioSettings.playlistDownloadMode || 'video',
        playlistQuality: audioSettings.playlistQuality || 'best',
        mediaEngine,
        turnstileToken
      };

      const json = await fetchJson('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (CAPTCHA_ENABLED) {
        setTurnstileToken(null);
        if (window.turnstile) window.turnstile.reset();
      }

      if (!json.success) {
        throw new Error(json.error || t('main.downloadStartFailed'));
      }

      listenToTask(json.taskId);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsStartingDownload(false);
      downloadGuardRef.current = false;
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
      // Auto-reconnect with backoff to recover from transient drops (e.g. tab hidden/backgrounded).
      if (attempt < 5) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 15000);
        setTimeout(() => listenToTask(taskId, attempt + 1), delay);
      }
    };
  };

  // Polling fallback: keep task status in sync when SSE drops, so the UI does
  // not keep showing "will be auto-deleted" while the server file is already gone.
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
        console.warn('Task status pool gagal:', err.message);
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

    const isPlaylist = activeTask.mode === 'playlist' && activeTask.playlistFiles?.length > 0;

    if (isPlaylist) {
      // Download all playlist files as a single ZIP archive
      const downloadUrl = `/api/download/playlist/${activeTask.id}`;
      const zipName = `${activeTask.fileName || 'playlist'}.zip`;

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.setAttribute('download', zipName);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const downloadUrl = `/api/download/file/${activeTask.id}`;

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.setAttribute('download', activeTask.fileName || 'media');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDeleteFromServer = async () => {
    if (!activeTask || !activeTask.id) return;
    if (!confirm(t('readyBox.deleteConfirm'))) return;

    if (sseRef.current) sseRef.current.close();

    // Optimistic: immediately transition to cleaned state so ReadyBox disappears
    // even if the subsequent API request / SSE broadcast lags or never arrives.
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
      {/* Hero Section */}
      <HeroSection />

      {/* URL Input Bar */}
      <UrlInputCard
        url={url}
        setUrl={setUrl}
        onAnalyze={handleAnalyze}
        onPaste={handlePaste}
        isLoadingInfo={isLoadingInfo}
        errorMessage={errorMessage}
        onOpenCookieModal={onOpenCookieModal}
        mediaEngine={mediaEngine}
        onMediaEngineChange={setMediaEngine}
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

      {/* Media Inspection & Customizer Card */}
      {mediaInfo && (
        <MediaBox
          mediaInfo={mediaInfo}
          mode={mode}
          onModeChange={setMode}
          isAudioOnly={isAudioOnly}
          onStartDownload={handleStartDownload}
          isStartingDownload={isStartingDownload}
          videoSettings={videoSettings}
          onVideoSettingChange={updateVideoSetting}
          audioSettings={audioSettings}
          onAudioSettingChange={updateAudioSetting}
          imageSettings={imageSettings}
          onImageSettingChange={updateImageSetting}
          playlistItems={playlistItems}
          selectedPlaylistItems={selectedPlaylistItems}
          onPlaylistSelectionChange={setSelectedPlaylistItems}
          onDownloadPlaylistSelected={handleDownloadPlaylistSelected}
        />
      )}

      {/* Progress Card */}
      {activeTask && activeTask.status === 'downloading' && (
        <ProgressCard task={activeTask} />
      )}

      {/* Processing Card (FFmpeg remux/merge) */}
      {activeTask && activeTask.status === 'processing' && (
        <ProcessingCard task={activeTask} />
      )}

      {/* Ready / Transfer Box */}
      {activeTask && activeTask.status === 'ready' && (
        <ReadyBox
          task={activeTask}
          onClientDownload={handleClientDownload}
          onOpenQrModal={openQrModal}
          onDeleteFromServer={handleDeleteFromServer}
        />
      )}

      {/* Cleaned Banner */}
      {activeTask && (activeTask.status === 'cleaned' || activeTask.isCleaned) && (
        <CleanedBanner task={activeTask} />
      )}

      {/* Failed Banner */}
      {activeTask && activeTask.status === 'failed' && (
        <FailedBanner task={activeTask} />
      )}
    </>
  );
};

export default MainPage;
