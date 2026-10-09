import { useState, useEffect, useRef, useCallback } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import './components/shared.css';

import Header from './components/Header';
import HeroSection from './components/HeroSection';
import UrlInputCard from './components/UrlInputCard';
import MediaBox from './components/MediaBox';
import ProgressCard from './components/ProgressCard';
import ProcessingCard from './components/ProcessingCard';
import ReadyBox from './components/ReadyBox';
import CleanedBanner from './components/CleanedBanner';
import FailedBanner from './components/FailedBanner';
import QrModal from './components/QrModal';
import CookieModal from './components/CookieModal';
import { fetchJson } from './utils/api';
import './App.css';

// Only enforce Turnstile in production when a real site key is configured.
// Dev / local build skips captcha (backend also skips verification without TURNSTILE_SECRET_KEY)
const CAPTCHA_ENABLED = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY) && import.meta.env.PROD;

function App() {
  const [url, setUrl] = useState('');
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [mediaInfo, setMediaInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

   // Selection mode: 'video' | 'audio' | 'image' | 'playlist'
  const [mode, setMode] = useState('video');

  // Media engine: 'auto' | 'ytdl' | 'gallery'
  const [mediaEngine, setMediaEngine] = useState('auto');
  const [turnstileToken, setTurnstileToken] = useState(null);

  // Video Mode Settings
  const [videoSettings, setVideoSettings] = useState({
    selectedVideoFormat: '',
    selectedAudioFormat: 'best',
    videoContainer: 'mp4'
  });

  // Audio Mode Settings
  const [audioSettings, setAudioSettings] = useState({
    audioTargetFormat: 'mp3',
    audioBitrate: '320k',
    sampleRate: 'auto',
    bitDepth: 'auto'
  });

  // Image Mode Settings
  const [imageSettings, setImageSettings] = useState({
    imageQuality: 'best',
    imageFormat: 'original'
  });

  // Playlist Mode Settings
  const [playlistItems, setPlaylistItems] = useState([]);
  const [selectedPlaylistItems, setSelectedPlaylistItems] = useState([]);

  // Active Task & Progress
  const [activeTask, setActiveTask] = useState(null);
  const [isStartingDownload, setIsStartingDownload] = useState(false);
  const sseRef = useRef(null);

  // Cross-device QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState(null);

  // Network Info (LAN IP for cross device)
  const [networkInfo, setNetworkInfo] = useState(null);

  // Cookies / Anti-Bot status
  const [cookieInfo, setCookieInfo] = useState({ exists: false, size: 0 });
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [cookieText, setCookieText] = useState('');
  const [isSavingCookies, setIsSavingCookies] = useState(false);
  const [cookieStatusMsg, setCookieStatusMsg] = useState('');

  const updateVideoSetting = (key, value) =>
    setVideoSettings((prev) => ({ ...prev, [key]: value }));

  const updateAudioSetting = (key, value) =>
    setAudioSettings((prev) => ({ ...prev, [key]: value }));

  const updateImageSetting = (key, value) =>
    setImageSettings((prev) => ({ ...prev, [key]: value }));

  const openCookieModal = () => {
    setCookieStatusMsg('');
    setShowCookieModal(true);
  };

  const handleTurnstileVerify = useCallback((token) => {
    setTurnstileToken(token || null);
  }, []);

  const handleTurnstileError = useCallback((err) => {
    console.error('[Turnstile]', err);
    setErrorMessage('Gagal memverifikasi captcha. Coba muat ulang halaman.');
  }, []);

  const fetchCookieStatus = () => {
    fetchJson('/api/cookies')
      .then(data => setCookieInfo(data))
      .catch(err => console.error('Gagal mengambil status cookies:', err));
  };

  const handleSaveCookies = async () => {
    if (!cookieText.trim()) return;
    setIsSavingCookies(true);
    setCookieStatusMsg('');
    try {
      const json = await fetchJson('/api/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: cookieText.trim() })
      });
      if (json.success) {
        setCookieStatusMsg('✅ Cookies berhasil disimpan di server!');
        setCookieText('');
        fetchCookieStatus();
      } else {
        setCookieStatusMsg('❌ Gagal: ' + json.error);
      }
    } catch (err) {
      setCookieStatusMsg('❌ Gagal menyimpan cookies: ' + err.message);
    } finally {
      setIsSavingCookies(false);
    }
  };

  const handleDeleteCookies = async () => {
    try {
      const json = await fetchJson('/api/cookies', { method: 'DELETE' });
      if (json.success) {
        setCookieStatusMsg('🗑️ Cookies berhasil dihapus.');
        fetchCookieStatus();
      }
    } catch (err) {
      setCookieStatusMsg('❌ Gagal menghapus cookies: ' + err.message);
    }
  };

  const handleCookieFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCookieText(event.target.result);
    };
    reader.readAsText(file);
  };

  // Fetch local network info and cookies on mount
  useEffect(() => {
    fetchJson('/api/network-info')
      .then(data => setNetworkInfo(data))
      .catch(err => console.error('Gagal mengambil info jaringan:', err));

    fetchCookieStatus();

    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  // Handle URL paste from clipboard
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
      setErrorMessage('Silakan selesaikan verifikasi captcha terlebih dahulu.');
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

      // Determine which service(s) to try based on engine mode and media mode
      const shouldTryGallery = (mode === 'image' || forceGallery) && !forceYtDlp;
      const shouldTryYtDlp = !forceGallery && (mediaEngine === 'auto' || mode !== 'image');

      // For image mode, try gallery-dl first, then fallback to yt-dlp for playlist detection
      if (shouldTryGallery) {
        let imageInfoResult = null;
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
            title: 'Gambar dari Media Gallery',
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
          throw new Error('Gagal mengekstrak gambar. Pastikan link dapat diakses publik.');
        }
      }

      // Try yt-dlp for playlist detection or video/audio info
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
            // This is likely an image-only link, try gallery-dl if we haven't already
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
                    title: 'Gambar dari Media Gallery',
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
                  return; // Early return, we have image info
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

            if (infoResult.videoFormats && infoResult.videoFormats.length > 0) {
              updateVideoSetting('selectedVideoFormat', infoResult.videoFormats[0].format_id);
            } else {
              updateVideoSetting('selectedVideoFormat', 'bestvideo');
            }
            updateVideoSetting('selectedAudioFormat', 'best');
          }
        } else if (!imageInfoResult) {
          throw new Error('Gagal menganalisis media. Pastikan link dapat diakses publik.');
        }
      }

      // Set sensible defaults for video mode if not already set
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

  // Start download on server
  const handleStartDownload = async () => {
    if (!url.trim() || !mediaInfo) return;

    if (CAPTCHA_ENABLED && !turnstileToken) {
      setErrorMessage('Captcha belum diverifikasi. Lengkapi captcha lalu coba lagi.');
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
        audioFormat: audioSettings.audioTargetFormat,
        audioQuality: audioSettings.audioBitrate,
        sampleRate: audioSettings.sampleRate,
        bitDepth: audioSettings.bitDepth,
        imageQuality: imageSettings.imageQuality,
        imageFormat: imageSettings.imageFormat,
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
        throw new Error(json.error || 'Gagal memulai unduhan.');
      }

      // Track task via Server-Sent Events
      listenToTask(json.taskId);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsStartingDownload(false);
    }
  };

  // Handle playlist download
  const handleDownloadPlaylistSelected = async () => {
    if (!url.trim() || !mediaInfo) return;

    if (mode === 'playlist' && selectedPlaylistItems.length === 0) {
      setErrorMessage('Pilih setidaknya satu item dari playlist.');
      return;
    }

    if (CAPTCHA_ENABLED && !turnstileToken) {
      setErrorMessage('Captcha belum diverifikasi. Lengkapi captcha lalu coba lagi.');
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
        audioFormat: audioSettings.audioTargetFormat,
        audioQuality: audioSettings.audioBitrate,
        sampleRate: audioSettings.sampleRate,
        bitDepth: audioSettings.bitDepth,
        imageQuality: imageSettings.imageQuality,
        imageFormat: imageSettings.imageFormat,
        playlistItems: selectedPlaylistItems,
        playlistMode: selectedPlaylistItems.length > 0 ? 'selected' : 'all',
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
        throw new Error(json.error || 'Gagal memulai unduhan.');
      }

      listenToTask(json.taskId);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsStartingDownload(false);
    }
  };

  // Connect to SSE for real-time progress
  const listenToTask = (taskId) => {
    if (sseRef.current) {
      sseRef.current.close();
    }

    const sse = new EventSource(`/api/tasks/${taskId}/events`);
    sseRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const taskData = JSON.parse(event.data);
        setActiveTask(taskData);

        if (taskData.status === 'ready') {
          // Pre-fetch QR code for cross-device download
          loadQrCode(taskId);
        }
      } catch (err) {
        console.error('Error parsing SSE:', err);
      }
    };

    sse.onerror = () => {
      // Auto fallback / close on terminate
    };
  };

  // Load QR code for cross device transfer
  const loadQrCode = async (taskId) => {
    try {
      const json = await fetchJson(`/api/qrcode/${taskId}`);
      if (json.success) {
        setQrData(json);
      }
    } catch (err) {
      console.error('Gagal mengambil QR Code:', err);
    }
  };

  // Trigger client browser download
  const handleClientDownload = () => {
    if (!activeTask || !activeTask.id) return;
    const downloadUrl = `/api/download/file/${activeTask.id}`;

    // Create an invisible anchor tag to trigger download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.setAttribute('download', activeTask.fileName || 'media');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="app-container">
      <Header
        cookieInfo={cookieInfo}
        setCookieStatusMsg={setCookieStatusMsg}
        setShowCookieModal={setShowCookieModal}
        networkInfo={networkInfo}
      />

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
        onOpenCookieModal={openCookieModal}
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
          onOpenQrModal={() => setShowQrModal(true)}
        />
      )}

      {/* Cleaned Banner */}
      {activeTask && (activeTask.status === 'cleaned' || activeTask.isCleaned) && (
        <CleanedBanner />
      )}

      {/* Failed Banner */}
      {activeTask && activeTask.status === 'failed' && (
        <FailedBanner task={activeTask} />
      )}

      {/* Cross-Device QR Code Modal */}
      {showQrModal && (
        <QrModal
          qrData={qrData}
          networkInfo={networkInfo}
          onClose={() => setShowQrModal(false)}
        />
      )}

      {/* Anti-Bot & Cookies Settings Modal */}
      {showCookieModal && (
        <CookieModal
          cookieInfo={cookieInfo}
          cookieText={cookieText}
          setCookieText={setCookieText}
          isSavingCookies={isSavingCookies}
          cookieStatusMsg={cookieStatusMsg}
          onSave={handleSaveCookies}
          onDelete={handleDeleteCookies}
          onFileUpload={handleCookieFileUpload}
          onClose={() => setShowCookieModal(false)}
        />
      )}
    </div>
  );
}

export default App;
