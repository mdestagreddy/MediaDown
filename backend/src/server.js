const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { ZipArchive } = require('archiver');
const { PassThrough } = require('stream');

const { getMediaInfo, downloadMedia } = require('./services/ytDlpService');
const { getImageInfo, downloadPostMedia } = require('./services/galleryDlService');
const taskManager = require('./services/taskManager');
const { getLocalIp } = require('./utils/network');

const app = express();
const PORT = process.env.PORT || 5000;

const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT) || 4;
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: MAX_CONCURRENT >= 8 ? 180 : 90,
  message: { error: 'Terlalu banyak permintaan (rate limit). Coba lagi dalam 1 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl === '/api/health'
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'MediaDown Backend',
    timestamp: new Date().toISOString()
  });
});

// Cloudflare Turnstile verification
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

async function verifyTurnstile(token, ip = '') {
  if (!TURNSTILE_SECRET) {
    console.warn('[Turnstile] TURNSTILE_SECRET_KEY not set, skipping verification');
    return { success: true, skip: true };
  }
  if (!token) return { success: false, error: 'Captcha token missing.' };

  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const params = new URLSearchParams();
  params.append('secret', TURNSTILE_SECRET);
  params.append('response', token);
  if (ip) params.append('remoteip', ip);

  try {
    const resp = await fetch(url, { method: 'POST', body: params });
    const data = await resp.json();
    if (data.success) return { success: true, skip: false };
    const err = data['error-codes']?.[0] || 'Captcha verification failed.';
    return { success: false, error: err };
  } catch (e) {
    return { success: false, error: 'Captcha service unavailable.' };
  }
}


// Network information for cross-device access (Mobile, Laptop, Tablet on same Wi-Fi)
app.get('/api/network-info', (req, res) => {
  const localIp = getLocalIp();
  res.json({
    localIp,
    port: PORT,
    baseUrl: `http://${localIp}:${PORT}`
  });
});

// Extract media information (Video & Audio streams)
app.post('/api/info', async (req, res) => {
  const { url, includePlaylist = false, turnstileToken, cookies = null } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'URL media harus disertakan.' });
  }

  const turnstile = await verifyTurnstile(turnstileToken, req.ip);
  if (!turnstile.success) {
    return res.status(403).json({ error: turnstile.error });
  }

  try {
    const info = await getMediaInfo(url.trim(), { includePlaylist, cookies });
    res.json({ success: true, data: info });
  } catch (err) {
    // Check if yt-dlp indicates this is a playlist and retry with playlist mode
    if (!includePlaylist && (err.message.includes('playlist') || err.message.includes('is a private video'))) {
      try {
        const info = await getMediaInfo(url.trim(), { includePlaylist: true });
        res.json({ success: true, data: info });
      } catch (retryErr) {
        console.error('[Info Error]', retryErr.message);
        res.json({
          success: false,
          data: { isPlaylist: false, title: 'Media tidak dapat dianalisis oleh yt-dlp' },
          error: retryErr.message || 'Gagal mengekstrak informasi dari media ini.'
        });
      }
    } else {
      console.error('[Info Error]', err.message);
      res.json({
        success: false,
        data: { isPlaylist: false, title: 'Media tidak dapat dianalisis oleh yt-dlp' },
        error: err.message || 'Gagal mengekstrak informasi dari media ini.'
      });
    }
  }
});

// Get available media info for posts/stories (uses gallery-dl)
app.post('/api/posts-info', async (req, res) => {
  const { url, turnstileToken, cookies = null } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'URL media harus disertakan.' });
  }

  const turnstile = await verifyTurnstile(turnstileToken, req.ip);
  if (!turnstile.success) {
    return res.status(403).json({ error: turnstile.error });
  }

  try {
    const info = await getImageInfo(url.trim(), cookies);
    res.json({ success: true, data: info });
  } catch (err) {
    console.error('[Image Info Error]', err.message);
    res.json({
      success: false,
      data: { images: [], videos: [], mediaItems: [], qualities: [], count: 0 },
      error: err.message || 'Gagal mendapatkan informasi gambar.'
    });
  }
});

// Media proxy endpoint - streams media (videos) through backend to avoid CORS/403
const https = require('https');
const http = require('http');

function getFileExtension(contentType) {
  if (!contentType) return '.jpg';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('gif')) return '.gif';
  if (contentType.includes('mp4')) return '.mp4';
  if (contentType.includes('webm')) return '.webm';
  if (contentType.includes('quicktime') || contentType.includes('mov')) return '.mov';
  return '.bin';
}

function parseCookiesString(content, targetDomain) {
  if (!content || !content.trim()) return '';
  try {
    const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    const cookies = [];
    const relevantDomains = ['.twitter.com', '.x.com', '.twimg.com', 'twitter.com', 'x.com'];

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 7) {
        const domain = parts[0];
        const name = parts[5];
        let value = parts[6];
        value = value.replace(/[\r\n\t]/g, '');

        // Filter to relevant domains only
        const isRelevant = !targetDomain
          || relevantDomains.some(d => domain === d || domain.endsWith(d))
          || domain.includes(targetDomain);
        if (isRelevant && name && value) {
          cookies.push(`${name}=${value}`);
        }
      }
    }
    return cookies.join('; ');
  } catch {
    return '';
  }
}

function parseCookiesFile(filePath, targetDomain) {
  if (!fs.existsSync(filePath)) return '';
  const content = fs.readFileSync(filePath, 'utf8');
  return parseCookiesString(content, targetDomain);
}

app.get('/api/media-proxy', async (req, res) => {
  const { url: mediaUrl, filename, cookies: cookiesParam } = req.query;
  if (!mediaUrl || typeof mediaUrl !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required.' });
  }

  let currentUrl = mediaUrl;
  let attempts = 0;
  const maxRedirects = 5;

  const fetchWithRedirects = () => {
    if (attempts >= maxRedirects) {
      return res.status(502).json({ error: 'Too many redirects' });
    }
    attempts++;

    const urlObj = new URL(currentUrl);
    const cookieHeader = cookiesParam ? parseCookiesString(decodeURIComponent(cookiesParam), urlObj.hostname) : '';

    const client = urlObj.protocol === 'https:' ? https : http;
    const options = {
      method: 'GET',
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': urlObj.origin + '/',
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
      },
    };

    const proxyReq = client.request(options, (proxyRes) => {
      if (proxyRes.statusCode === 301 || proxyRes.statusCode === 302 || proxyRes.statusCode === 307 || proxyRes.statusCode === 308) {
        proxyRes.resume();
        const location = proxyRes.headers.location;
        if (!location) {
          return res.status(502).json({ error: 'Redirect without location' });
        }
        currentUrl = new URL(location, currentUrl).href;
        return fetchWithRedirects();
      }

      if (proxyRes.statusCode !== 200) {
        proxyRes.resume();
        return res.status(proxyRes.statusCode || 502).json({
          error: `Media proxy returned ${proxyRes.statusCode}`,
          status: proxyRes.statusCode
        });
      }

      const contentType = proxyRes.headers['content-type'] || 'application/octet-stream';

      // Generate filename from query param, URL path, or content type
      let downloadName = filename || '';
      if (!downloadName) {
        const urlPath = new URL(currentUrl).pathname;
        const baseName = path.basename(urlPath).split('?')[0];
        const ext = path.extname(baseName) || getFileExtension(contentType);
        downloadName = baseName.replace(/\.[^.]+$/, '') || 'media';
        downloadName = downloadName + ext;
      }

      // Sanitize filename for HTTP header (remove newlines, control chars, non-ASCII)
      downloadName = downloadName
        .replace(/[\r\n\t\x00-\x1f\x7f]/g, ' ')
        .replace(/[^\x20-\x7e]/g, '')
        .replace(/\s+/g, '_')
        .trim();

      // Ensure we have a valid extension
      const currentExt = path.extname(downloadName);
      if (!currentExt) {
        downloadName += getFileExtension(contentType);
      }

      if (!downloadName || downloadName === path.extname(downloadName)) {
        downloadName = 'media' + getFileExtension(contentType);
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', proxyRes.headers['content-length'] || '');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600');

      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      res.status(502).json({ error: `Media proxy error: ${err.message}` });
    });

    proxyReq.end();
  };

  fetchWithRedirects();
});

// Start media download & processing task
app.post('/api/download', async (req, res) => {
  const {
    url,
    mode = 'video', // 'video' | 'audio' | 'image' | 'playlist'
    videoFormatId,
    audioFormatId,
    videoContainer = 'mp4',
    videoQualityPreset,
    audioFormat = 'mp3',
     audioQuality = '320k',
     sampleRate = 'auto',
     bitDepth = 'auto',
     embedMetadata = false,
     outputTemplate,
     title = 'media',
    imageQuality = 'best',
    imageFormat = 'original',
     playlistItems = [],
     playlistMode = 'all',
     playlistDownloadMode = 'video',
     playlistQuality = 'best',
      mediaEngine = 'auto',
     imageSource = null,
      totalImages = 0,
      cookies = null,
     turnstileToken
  } = req.body;

  if (!url || !url.trim()) {
    return res.status(400).json({ error: 'URL tidak boleh kosong.' });
  }

  const turnstile = await verifyTurnstile(turnstileToken, req.ip);
  if (!turnstile.success) {
    return res.status(403).json({ error: turnstile.error });
  }

  const taskId = crypto.randomUUID();
  const task = taskManager.createTask(taskId, {
    url: url.trim(),
    mode,
     title,
      videoFormatId,
      audioFormatId,
      videoContainer,
      videoQualityPreset,
     audioFormat,
      audioQuality,
      sampleRate,
      bitDepth,
      embedMetadata,
      outputTemplate,
     imageQuality,
    imageFormat,
     playlistItems,
     playlistMode,
     playlistDownloadMode,
      playlistQuality,
      mediaEngine,
      imageSource
  });

  res.json({
    success: true,
    taskId,
    message: 'Tugas pengunduhan berhasil dibuat.',
    queuePosition: taskManager.activeCount >= taskManager.maxConcurrent ? taskManager.queue.length + 1 : null,
    maxConcurrent: taskManager.maxConcurrent
  });

   // Route to appropriate download service based on mode and mediaEngine
   // When imageSource is 'yt-dlp', use yt-dlp for image download (fallback when gallery-dl is unavailable)
   const useGalleryDl = mediaEngine === 'gallery' || (mediaEngine === 'auto' && mode === 'image' && imageSource !== 'yt-dlp');
   const engineName = useGalleryDl ? 'gallery-dl' : 'yt-dlp';
   taskManager.addLog(taskId, `Tugas dibuat - Mode: ${mode}, Engine: ${engineName}, Judul: ${title}`);
   const useYtDlp = mediaEngine === 'ytdl' || mediaEngine === 'auto' && mode !== 'image';

  const progressCallback = (prog) => {
    const queueLen = taskManager.queue.length;
    const msg = prog.message || (queueLen > 0 ? `Sedang mengunduh... ${queueLen} dalam antrean (${prog.percent.toFixed(1)}%)` : `Sedang mengunduh... (${prog.percent.toFixed(1)}%)`);

    taskManager.addLog(taskId, msg);

    taskManager.updateTask(taskId, {
      progress: prog.percent,
      speed: prog.speed,
      eta: prog.eta,
      status: prog.status,
      downloadedBytes: prog.downloadedBytes || 0,
      totalBytes: prog.totalBytes || 0,
      message: msg
    });
  };

  const downloadFn = () => {
      if (useGalleryDl) {
      return downloadPostMedia({
        url: url.trim(),
        outputDir: task.taskDir,
        imageFormat,
        totalImages,
        outputTemplate,
        cookies,
        onProgress: progressCallback,
        onLog: (msg) => {
          console.log(`[Task ${taskId}] ${msg}`);
          taskManager.addLog(taskId, msg);
        }
      });
    }
    return downloadMedia({
      url: url.trim(),
      outputDir: task.taskDir,
      mode,
    videoFormatId,
       audioFormatId,
       videoContainer,
       videoQualityPreset,
      audioFormat,
       audioQuality,
       sampleRate,
       bitDepth,
       embedMetadata,
       outputTemplate,
       imageQuality: typeof imageQuality === 'string' && !isNaN(imageQuality) ? parseInt(imageQuality) : imageQuality,
      imageFormat,
      playlistItems: playlistItems,
      playlistMode: playlistMode,
      cookies,
      onProgress: progressCallback,
      onLog: (msg) => {
        console.log(`[Task ${taskId}] ${msg}`);
        taskManager.addLog(taskId, msg);
      }
    });
  };

  // Enqueue the download - will start when a worker slot is available
  taskManager.enqueueTask(taskId, downloadFn);
});

// Task status endpoint (polling fallback)
app.get('/api/tasks/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = taskManager.getTask(taskId);
  if (!task) {
    return res.status(404).json({ error: 'Tugas tidak ditemukan atau telah kedaluwarsa.' });
  }
  res.json({ success: true, task: taskManager.serializeTask(task) });
});

// Server-Sent Events (SSE) for real-time progress updates
app.get('/api/tasks/:taskId/events', (req, res) => {
  const { taskId } = req.params;
  const task = taskManager.getTask(taskId);

  if (!task) {
    return res.status(404).json({ error: 'Tugas tidak ditemukan.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  taskManager.subscribe(taskId, res);
});

// Queue status endpoint
app.get('/api/queue', (req, res) => {
  res.json({
    success: true,
    ...taskManager.getQueueStatus()
  });
});

// Download endpoint for transferring file to client/another device
// Automatically deletes file from server once client finishes downloading!
app.get('/api/download/file/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = taskManager.getTask(taskId);

  if (!task) {
    return res.status(404).send('File tidak ditemukan atau telah kedaluwarsa.');
  }

  if (task.isCleaned || !task.filePath || !fs.existsSync(task.filePath)) {
    return res.status(410).send('File ini sudah selesai diunduh dan telah otomatis dibersihkan dari server sesuai kebijakan privasi.');
  }

  // Track that an active download transfer has started so the SSE
  // disconnect-cleanup does not race with this request.
  taskManager.startDownload(taskId);

  const fileName = task.fileName || 'download';

  // Set response headers
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', fs.statSync(task.filePath).size);

  const fileStream = fs.createReadStream(task.filePath);

  let cleanupStarted = false;
  let errored = false;

  const triggerCleanup = () => {
    if (cleanupStarted || errored) return;
    cleanupStarted = true;
    taskManager.endDownload(taskId);
    console.log(`[Transfer Complete] Klien selesai mengunduh task ${taskId}. Memulai penghapusan otomatis...`);
    taskManager.markDownloaded(taskId);
  };

  fileStream.on('error', (streamErr) => {
    errored = true;
    taskManager.endDownload(taskId);
    console.error('[Stream Error]', streamErr.message);
    if (!res.headersSent) {
      res.status(500).send('Terjadi kesalahan saat membaca file di server.');
    }
  });

  // When client successfully finishes downloading the entire file:
  res.on('finish', triggerCleanup);

  // When client disconnects before completing the transfer (refresh page,
  // close browser/tab, change URL) the 'close' event fires and we still
  // need to remove the file from the server.
  res.on('close', triggerCleanup);

  fileStream.pipe(res);
});

// Download specific file from a playlist task
app.get('/api/download/file/:taskId/:filename', (req, res) => {
  const { taskId, filename } = req.params;
  const task = taskManager.getTask(taskId);

  if (!task) {
    return res.status(404).send('File tidak ditemukan atau telah kedaluwarsa.');
  }

  if (task.isCleaned || !task.filePath) {
    return res.status(410).send('File ini sudah selesai diunduh dan telah otomatis dibersihkan dari server.');
  }

  // Find the specific file in playlist
  let filePath;
  if (task.mode === 'playlist' && task.playlistFiles) {
    const fileEntry = task.playlistFiles.find(f => f.name === decodeURIComponent(filename) || f.name === filename);
    if (!fileEntry) {
      return res.status(404).send('File tidak ditemukan dalam paket playlist.');
    }
    filePath = fileEntry.path;
  } else {
    // Single file mode
    filePath = task.filePath;
  }

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(410).send('File ini sudah selesai diunduh dan telah otomatis dibersihkan dari server.');
  }

  const fileName = path.basename(filePath);
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', fs.statSync(filePath).size);

  // Track active download transfer so SSE disconnect-cleanup does not race
  taskManager.startDownload(taskId);

  const fileStream = fs.createReadStream(filePath);

  let cleanupStarted = false;
  let errored = false;

  const triggerCleanup = () => {
    if (cleanupStarted || errored) return;
    cleanupStarted = true;
    taskManager.endDownload(taskId);
    console.log(`[Transfer Complete] Klien selesai mengunduh task ${taskId}. Memulai penghapusan otomatis...`);
    taskManager.markDownloaded(taskId);
  };

  fileStream.on('error', (streamErr) => {
    errored = true;
    taskManager.endDownload(taskId);
    console.error('[Stream Error]', streamErr.message);
    if (!res.headersSent) {
      res.status(500).send('Terjadi kesalahan saat membaca file di server.');
    }
  });

  // For playlist items, don't clean the whole task yet - only clean on the main file download.
  // For single-file mode, clean up on both successful completion and client disconnect.
  if (task.mode !== 'playlist') {
    // When client successfully finishes downloading the entire file:
    res.on('finish', triggerCleanup);

    // When client disconnects before completing the transfer (refresh page,
    // close browser/tab, change URL) the 'close' event fires and we still
    // need to remove the file from the server.
    res.on('close', triggerCleanup);
  } else {
    // Playlist item download — no cleanup on finish/close; just decrement
    // the active download counter once so SSE disconnect-cleanup can resume.
    const endTransfer = () => {
      if (cleanupStarted || errored) return;
      cleanupStarted = true;
      taskManager.endDownload(taskId);
    };
    res.on('finish', endTransfer);
    res.on('close', endTransfer);
  }

  fileStream.pipe(res);
});

// Download all playlist files as a ZIP archive
app.get('/api/download/playlist/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = taskManager.getTask(taskId);

  if (!task) {
    return res.status(404).json({ error: 'Tugas tidak ditemukan.' });
  }

  // For playlist mode, verify we have playlist files
  const playlistFiles = task.playlistFiles || [];
  if (playlistFiles.length === 0) {
    return res.status(404).json({ error: 'Tidak ada file playlist untuk diunduh.' });
  }

  // Verify files exist on disk
  const validFiles = playlistFiles.filter(f => f.path && fs.existsSync(f.path));
  if (validFiles.length === 0) {
    return res.status(404).json({ error: 'File playlist tidak ditemukan di server.' });
  }

  // Track active download transfer
  taskManager.startDownload(taskId);

  const archive = new ZipArchive({
    zlib: { level: 9 }
  });

  let errored = false;

  archive.on('error', (err) => {
    errored = true;
    taskManager.endDownload(taskId);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Gagal membuat arsip ZIP.' });
    }
  });

  // Use playlist title for ZIP filename, or fallback to "playlist"
  const safeTitle = (task.title || 'playlist')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .substring(0, 50);
  const zipName = `${safeTitle}.zip`;

  res.attachment(zipName);
  res.setHeader('Content-Type', 'application/zip');

  archive.pipe(res);

  // Add each file to the archive
  for (const file of validFiles) {
    archive.file(file.path, { name: file.name });
  }

  archive.finalize();

  // Cleanup after complete download or client disconnect
  const cleanupHandler = () => {
    if (errored) return;
    taskManager.endDownload(taskId);
    console.log(`[Playlist ZIP Complete] Task ${taskId} - ${validFiles.length} files zipped.`);
    taskManager.markDownloaded(taskId);
  };

  res.on('finish', cleanupHandler);
  res.on('close', cleanupHandler);
});

// Preview media file in-browser (inline) without triggering auto-cleanup
const mime = require('mime-types');

function servePreview(req, res, filename) {
  const { taskId } = req.params;
  const task = taskManager.getTask(taskId);

  if (!task) {
    return res.status(404).send('File tidak ditemukan atau telah kedaluwarsa.');
  }

  if (task.isCleaned || !task.filePath || !fs.existsSync(task.filePath)) {
    return res.status(410).send('File ini sudah selesai diunduh dan telah otomatis dibersihkan dari server.');
  }

  let filePath;
  if (task.mode === 'playlist' && task.playlistFiles && filename) {
    const fileEntry = task.playlistFiles.find(f => f.name === decodeURIComponent(filename) || f.name === filename);
    if (!fileEntry) {
      return res.status(404).send('File tidak ditemukan dalam paket playlist.');
    }
    filePath = fileEntry.path;
  } else {
    filePath = task.filePath;
  }

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(410).send('File ini sudah selesai diunduh dan telah otomatis dibersihkan dari server.');
  }

  const contentType = mime.lookup(path.extname(filePath)) || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', 'inline');

  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', (streamErr) => {
    console.error('[Preview Stream Error]', streamErr.message);
    if (!res.headersSent) {
      res.status(500).send('Terjadi kesalahan saat membaca file di server.');
    }
  });
  fileStream.pipe(res);
}

app.get('/api/preview/:taskId', (req, res) => servePreview(req, res, null));
app.get('/api/preview/:taskId/:filename', (req, res) => servePreview(req, res, req.params.filename));

// Generate QR Code for downloading from mobile device on the same local network
app.get('/api/qrcode/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const task = taskManager.getTask(taskId);

  if (!task) {
    return res.status(404).json({ error: 'Tugas tidak ditemukan.' });
  }

  const localIp = getLocalIp();
  const baseUrl = `http://${localIp}:${PORT}`;

  // For playlist tasks, generate QR code with a playlist info endpoint URL
  // so the device can list and download all files
  let directDownloadUrl;
  let isPlaylist = false;

  if (task.mode === 'playlist' && Array.isArray(task.playlistFiles) && task.playlistFiles.length > 1) {
    isPlaylist = true;
    directDownloadUrl = `${baseUrl}/api/playlist/${taskId}`;
  } else {
    directDownloadUrl = `${baseUrl}/api/download/file/${taskId}`;
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(directDownloadUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      qrDataUrl,
      downloadUrl: directDownloadUrl,
      isPlaylist,
      playlistFiles: task.playlistFiles || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat QR Code.' });
  }
});

// Manual cleanup / cancel task endpoint
app.delete('/api/tasks/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = taskManager.getTask(taskId);

  if (!task) {
    return res.status(404).json({ error: 'Tugas tidak ditemukan.' });
  }

  taskManager.cleanTaskFile(taskId);
  res.json({ success: true, message: 'File dan tugas berhasil dibersihkan dari server.' });
});

app.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`====================================================`);
  console.log(`🚀 MediaDown Backend Server berjalan pada:`);
  console.log(`👉 Local:   http://localhost:${PORT}`);
  console.log(`👉 Network: http://${localIp}:${PORT}`);
  console.log(`====================================================`);
});

// Graceful error handling - prevent crashes from API loops / async errors
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err.message, err.stack);
  process.exit(1);
});

process.on('SIGINT', () => process.exit(0));

