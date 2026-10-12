const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const cookiesPath = path.resolve(__dirname, '../../cookies.txt');

function getAntiBotArgs() {
  const args = [
    '--retries',
    '5',
    '--fragment-retries',
    '5'
  ];

  if (fs.existsSync(cookiesPath)) {
    args.push('--cookies', cookiesPath);
  }

  return args;
}

/**
 * Extract comprehensive metadata and streams from URL using yt-dlp
 */
async function getMediaInfo(url, options = {}) {
  return new Promise((resolve, reject) => {
    const { includePlaylist = false } = options;

    const args = [
      '--dump-single-json',
      '--no-warnings',
      '--ignore-errors',
      ...getAntiBotArgs(),
      url
    ];

    // For playlist, don't use --no-playlist; use --flat-playlist for metadata listing
    if (includePlaylist) {
      args.push('--flat-playlist');
    } else {
      args.push('--no-playlist');
    }

    const child = spawn('yt-dlp', args);
    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0 || !stdoutData.trim()) {
        const errorMsg = stderrData.trim() || 'Gagal mengekstrak informasi media dari URL yang diberikan.';
        return reject(new Error(errorMsg));
      }

      try {
        const info = JSON.parse(stdoutData);
        const processed = processRawInfo(info);
        resolve(processed);
      } catch (err) {
        reject(new Error(`Gagal memparsing data dari server: ${err.message}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`yt-dlp tidak dapat dijalankan: ${err.message}`));
    });
  });
}

/**
 * List available images for a URL using gallery-dl
 */

/**
 * Filter, group, and format media information for the client
 */
function processRawInfo(info) {
  // Playlist detection
  if (Array.isArray(info.entries)) {
    return processPlaylistInfo(info);
  }

  const formats = Array.isArray(info.formats) ? info.formats : [];

  // Video streams
  const videoFormats = [];
  // Audio streams
  const audioFormats = [];

  const seenVideoRes = new Set();
  const seenAudioBitrate = new Set();

  formats.forEach((f) => {
    const hasVideo = f.vcodec && f.vcodec !== 'none';
    const hasAudio = f.acodec && f.acodec !== 'none';

    const size = f.filesize || f.filesize_approx || null;
    const formattedSize = size ? formatBytes(size) : null;

    if (hasVideo) {
      const height = f.height || 0;
      const width = f.width || 0;
      const resLabel = f.resolution || (height ? `${height}p` : 'Video');
      const fps = f.fps ? `${f.fps}fps` : '';
      const vcodec = f.vcodec || '';

      const key = `${height}_${f.ext}_${f.fps || ''}`;
      // Collect video format
      videoFormats.push({
        format_id: f.format_id,
        format_note: f.format_note || '',
        resolution: resLabel,
        height,
        width,
        fps: f.fps || null,
        ext: f.ext,
        vcodec,
        hasAudio,
        tbr: f.tbr ? Math.round(f.tbr) : null,
        vbr: f.vbr ? Math.round(f.vbr) : null,
        filesize: size,
        formattedSize,
        label: `${resLabel} ${fps} (${f.ext}) ${formattedSize ? `[${formattedSize}]` : ''}`.trim()
      });
    }

    if (hasAudio) {
      const abr = f.abr ? Math.round(f.abr) : (f.tbr ? Math.round(f.tbr) : null);
      const isAudioOnly = !hasVideo;
      
      audioFormats.push({
        format_id: f.format_id,
        format_note: f.format_note || '',
        ext: f.ext,
        acodec: f.acodec || '',
        abr: abr,
        asr: f.asr || null,
        isAudioOnly,
        filesize: size,
        formattedSize,
        label: `${abr ? `${abr} kbps` : 'Audio'} (${f.ext} - ${f.acodec || 'audio'}) ${formattedSize ? `[${formattedSize}]` : ''}`.trim()
      });
    }
  });

  // Sort video formats from highest quality to lowest
  videoFormats.sort((a, b) => {
    if (b.height !== a.height) return b.height - a.height;
    if ((b.fps || 0) !== (a.fps || 0)) return (b.fps || 0) - (a.fps || 0);
    return (b.tbr || 0) - (a.tbr || 0);
  });

  // Group by distinct resolution height so all resolutions (2160p, 1080p, 720p, 480p, 360p, 240p, 144p) are clearly visible
  const heightMap = new Map();
  for (const vf of videoFormats) {
    if (vf.height <= 0) continue;
    if (!heightMap.has(vf.height)) {
      heightMap.set(vf.height, vf);
    } else {
      const current = heightMap.get(vf.height);
      // Prefer mp4 container or higher bitrate
      if ((vf.ext === 'mp4' && current.ext !== 'mp4') || ((vf.filesize || 0) > (current.filesize || 0))) {
        heightMap.set(vf.height, vf);
      }
    }
  }

  // Format nice display names
  function getFriendlyResolutionName(height) {
    if (height >= 4320) return `8K Ultra HD (${height}p)`;
    if (height >= 2160) return `4K Ultra HD (${height}p)`;
    if (height >= 1440) return `2K Quad HD (${height}p)`;
    if (height >= 1080) return `Full HD (${height}p)`;
    if (height >= 720) return `HD (${height}p)`;
    if (height >= 480) return `SD (${height}p)`;
    if (height >= 360) return `Standar (${height}p)`;
    if (height >= 240) return `Hemat Kuota (${height}p)`;
    return `Minimal (${height}p)`;
  }

  const distinctVideoFormats = Array.from(heightMap.values())
    .sort((a, b) => b.height - a.height)
    .map(vf => ({
      ...vf,
      friendlyName: getFriendlyResolutionName(vf.height)
    }));

  // Sort audio formats from highest bitrate to lowest
  audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0));

  // Determine thumbnail
  let thumbnail = info.thumbnail;
  if (!thumbnail && Array.isArray(info.thumbnails) && info.thumbnails.length > 0) {
    thumbnail = info.thumbnails[info.thumbnails.length - 1].url;
  }

  return {
    id: info.id || '',
    title: info.title || 'Untitled Media',
    description: info.description || '',
    duration: info.duration || 0,
    durationFormatted: formatDuration(info.duration),
    uploader: info.uploader || info.channel || info.creator || 'Unknown',
    uploader_url: info.uploader_url || info.channel_url || '',
    thumbnail: thumbnail || '',
    webpage_url: info.webpage_url || info.original_url || '',
    extractor: info.extractor_key || info.extractor || 'Web',
    view_count: info.view_count || null,
    videoFormats: distinctVideoFormats,
    allVideoFormats: videoFormats,
    audioFormats
  };
}

/**
 * Process playlist metadata (flat entries listing)
 */
function processPlaylistInfo(info) {
  const entries = Array.isArray(info.entries) ? info.entries : [];

  const playlistItems = entries.map((entry, index) => {
    const isProcessed = entry && typeof entry === 'object' && entry.formats;
    const title = entry?.title || `Item ${index + 1}`;
    const id = entry?.id || entry?.url || '';

    let thumbnail = entry?.thumbnail || '';
    if (!thumbnail && Array.isArray(entry?.thumbnails) && entry.thumbnails.length > 0) {
      thumbnail = entry.thumbnails[entry.thumbnails.length - 1].url;
    }

    return {
      index,
      id,
      title,
      url: entry?.webpage_url || entry?.url || '',
      thumbnail: thumbnail,
      duration: entry?.duration || 0,
      durationFormatted: formatDuration(entry?.duration || 0),
      uploader: entry?.uploader || entry?.channel || 'Unknown',
      isProcessed: !!isProcessed
    };
  });

  // Get a representative thumbnail from the first entry
  let playlistThumbnail = info.thumbnail || '';
  if (!playlistThumbnail && Array.isArray(info.thumbnails) && info.thumbnails.length > 0) {
    playlistThumbnail = info.thumbnails[info.thumbnails.length - 1].url;
  }

  return {
    id: info.id || '',
    title: info.title || info.name || 'Untitled Playlist',
    description: info.description || '',
    isPlaylist: true,
    extractor: info.extractor_key || info.extractor || 'Web',
    view_count: info.view_count || null,
    playlistCount: info.playlist_count || playlistItems.length || 0,
    playlistIndex: info.playlist_index || 0,
    thumbnail: playlistThumbnail,
    webpage_url: info.webpage_url || info.original_url || '',
    uploader: info.uploader || info.channel || info.creator || 'Unknown',
    playlistItems: playlistItems,
    hasNext: Array.isArray(info.entries) && info.entries.length >= 100 ? !!info.entries.find(e => e && typeof e === 'object' && e._type === 'url') : false
  };
}

/**
 * Execute yt-dlp download process with real-time progress callbacks
 */
function downloadMedia({
  url,
  outputDir,
  mode = 'video', // 'video' | 'audio' | 'image' | 'playlist'
  videoFormatId,
  audioFormatId,
  videoContainer = 'mp4',
  audioFormat = 'mp3',
  audioQuality = '320k',
  sampleRate = 'auto',
  bitDepth = 'auto',
  imageQuality = 'best',
  imageFormat = 'original',
  playlistItems: selectedItems = [],
  playlistMode = 'all', // 'all' | 'selected'
  onProgress,
  onLog
}) {
  return new Promise((resolve, reject) => {
    const outputTemplate = path.join(outputDir, '%(title).120s [%(id)s].%(ext)s');

    // Output template
    const args = [
      '--windows-filenames',
      '--newline',
      '--progress-template',
      '%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.status)s',
      ...getAntiBotArgs(),
    ];

    // Playlist mode: don't use --no-playlist if downloading playlist
    if (mode === 'playlist') {
      args.push('--yes-playlist');

      // Playlist download options
      if (playlistMode === 'selected' && selectedItems.length > 0) {
        // Convert indices (1-based) to yt-dlp playlist-items format
        const itemStr = selectedItems.map(i => i + 1).join(',');
        args.push('--playlist-items', itemStr);
      }
    } else {
      args.push('--no-playlist');
    }

     args.push('-o', outputTemplate);

    if (mode === 'image') {
      // Image/Thumbnail Download Mode
      args.push('--write-thumbnail');

      // Convert to desired format and quality
      if (imageFormat && imageFormat !== 'original') {
        args.push('--convert-thumbnails', imageFormat);
      }

      if (imageQuality && imageQuality !== 'best' && typeof imageQuality === 'number') {
        // Pass quality as postprocessor arg for webp/jpg
        if (imageFormat === 'webp') {
          args.push('--postprocessor-args', `ConvertThumbnails:-q:v ${imageQuality}`);
        } else if (imageFormat === 'jpg') {
          args.push('--postprocessor-args', `ConvertThumbnails:-q:v ${100 - imageQuality}`);
        }
      }
     } else if (mode === 'audio') {
      // Audio Extraction Mode
      const formatSelector = audioFormatId && audioFormatId !== 'best' ? audioFormatId : 'bestaudio/best';
      args.push('-f', formatSelector);
      args.push('-x');
      // Map frontend format values to yt-dlp accepted codecs
      const YTDLP_FORMAT_MAP = { ogg: 'vorbis' };
      const ytDlpFormat = YTDLP_FORMAT_MAP[audioFormat] || audioFormat;
      args.push('--audio-format', ytDlpFormat);

      const isLossless = audioFormat === 'wav' || audioFormat === 'flac';

      if (isLossless) {
        // Lossless: sample rate and bit depth postprocessor arguments for FFmpeg
        const postArgs = [];
        if (sampleRate && sampleRate !== 'auto') {
          postArgs.push(`-ar ${sampleRate}`);
        }

        if (audioFormat === 'wav') {
          if (bitDepth === '24') {
            postArgs.push('-c:a pcm_s24le');
          } else if (bitDepth === '32') {
            postArgs.push('-c:a pcm_s32le');
          } else if (bitDepth === '16') {
            postArgs.push('-c:a pcm_s16le');
          }
        } else if (audioFormat === 'flac') {
          if (bitDepth === '24' || bitDepth === '32') {
            postArgs.push('-sample_fmt s32');
          } else if (bitDepth === '16') {
            postArgs.push('-sample_fmt s16');
          }
        }

        if (postArgs.length > 0) {
          args.push('--postprocessor-args', `ExtractAudio:${postArgs.join(' ')}`);
        }
      } else {
        // Lossy (mp3, m4a, vorbis, opus): bitrate/quality
        if (audioQuality && audioQuality !== 'best') {
          // Vorbis & Opus use VBR quality levels (0-10), not bitrate strings
          if (ytDlpFormat === 'vorbis' || ytDlpFormat === 'opus') {
            const vbrQuality = bitrateToVbrQuality(audioQuality);
            if (vbrQuality) {
              args.push('--audio-quality', vbrQuality);
            }
          } else {
            args.push('--audio-quality', audioQuality);
          }
        }
      }
    } else {
      // Video Mode
      const vFormat = videoFormatId && videoFormatId !== 'best' ? videoFormatId : 'bestvideo';
      
      if (audioFormatId === 'none') {
        // Video without audio (muted)
        args.push('-f', vFormat);
        args.push('--remux-video', videoContainer);
      } else {
        const aFormat = audioFormatId && audioFormatId !== 'best' ? audioFormatId : 'bestaudio';
        args.push('-f', `${vFormat}+${aFormat}/best`);
        args.push('--merge-output-format', videoContainer);
      }
    }

    // Pass target URL
    args.push(url);

    if (onLog) {
      onLog(`Starting yt-dlp with arguments: ${args.join(' ')}`);
    }

    const child = spawn('yt-dlp', args);
    let stderrData = '';

    child.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split(/[\r\n]+/);
      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.includes('|')) {
          // Parsed progress template: percent|speed|eta|downloaded_bytes|total_bytes|status
          const parts = line.split('|');
          if (parts.length >= 3) {
            const rawPct = parts[0].replace('%', '').trim();
            const pct = parseFloat(rawPct) || 0;
            const speed = parts[1].trim();
            const eta = parts[2].trim();
            const downloadedBytes = parseInt(parts[3], 10) || 0;
            const totalBytes = parseInt(parts[4], 10) || 0;
            const status = parts[5] ? parts[5].trim() : 'downloading';

            if (onProgress) {
              onProgress({
                percent: Math.min(pct, 99),
                speed: speed && speed !== 'NA' ? speed : '',
                eta: parseEtaStr(eta),
                downloadedBytes,
                totalBytes,
                status: 'downloading'
              });
            }
          }
        } else {
          if (onLog) onLog(line);
          // Detect ffmpeg merging / converting status from stdout
          if (line.includes('[Merger]') || line.includes('[ExtractAudio]') || line.includes('[Fixup')) {
            if (onProgress) {
              onProgress({
                percent: 98,
                speed: '',
                eta: '',
                status: 'processing',
                downloadedBytes: 0,
                totalBytes: 0,
                message: 'Menggabungkan dan mengonversi format dengan FFmpeg...'
              });
            }
          }
        }
      }
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderrData += text;
      if (onLog) onLog(`[stderr] ${text.trim()}`);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderrData.trim() || `Proses yt-dlp keluar dengan kode ${code}`));
      }

      // Find the generated file(s) in outputDir
      try {
        const allFiles = fs.readdirSync(outputDir).filter(f => !f.endsWith('.part') && !f.endsWith('.ytdl'));
        if (allFiles.length === 0) {
          return reject(new Error('File hasil unduhan tidak ditemukan di server.'));
        }

        if (mode === 'image') {
          // For image mode, find the thumbnail file (may have been converted)
          const imageExtensions = ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg'];
          const imageFiles = allFiles.filter(f => imageExtensions.some(ext => f.endsWith(ext)));

          const targetImage = imageFiles.length > 0
            ? imageFiles.reduce((largest, file) => {
                const stats = fs.statSync(path.join(outputDir, file));
                const largestStats = fs.statSync(path.join(outputDir, largest));
                return stats.size > largestStats.size ? file : largest;
              })
            : allFiles[0];

          const imagePath = path.join(outputDir, targetImage);
          const imageStats = fs.statSync(imagePath);

          resolve({
            fileName: targetImage,
            filePath: imagePath,
            fileSize: imageStats.size,
            formattedSize: formatBytes(imageStats.size),
            mode: 'image'
          });
          return;
        }

        if (mode === 'playlist') {
          // For playlist, collect all downloaded files
          const downloadedFiles = allFiles
            .filter(f => !f.endsWith('.json') && !f.endsWith('.info.json'))
            .map(f => {
              const stats = fs.statSync(path.join(outputDir, f));
              return { name: f, path: path.join(outputDir, f), size: stats.size };
            });

          // Calculate total size
          const totalSize = downloadedFiles.reduce((sum, f) => sum + f.size, 0);

          resolve({
            fileName: downloadedFiles[0]?.name || null,
            filePath: downloadedFiles[0]?.path || null,
            fileSize: totalSize,
            formattedSize: formatBytes(totalSize) || '0 B',
            mode: 'playlist',
            playlistFiles: downloadedFiles,
            itemCount: downloadedFiles.length
          });
          return;
        }

        // Default: single video/audio - pick the largest file
        let targetFile = allFiles[0];
        let maxStats = fs.statSync(path.join(outputDir, targetFile));

        for (let i = 1; i < allFiles.length; i++) {
          const stats = fs.statSync(path.join(outputDir, allFiles[i]));
          if (stats.size > maxStats.size) {
            targetFile = allFiles[i];
            maxStats = stats;
          }
        }

        const filePath = path.join(outputDir, targetFile);
        resolve({
          fileName: targetFile,
          filePath,
          fileSize: maxStats.size,
          formattedSize: formatBytes(maxStats.size)
        });
      } catch (err) {
        reject(new Error(`Gagal membaca file hasil: ${err.message}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Gagal mengeksekusi yt-dlp: ${err.message}`));
    });
  });
}

// Helpers
function parseEtaStr(etaStr) {
  if (!etaStr || etaStr === 'NA' || etaStr === '') return '';
  const parts = etaStr.split(':').map(Number);
  if (parts.length === 3) {
    return { hours: parts[0], minutes: parts[1], seconds: parts[2] };
  } else if (parts.length === 2) {
    return { hours: 0, minutes: parts[0], seconds: parts[1] };
  }
  return '';
}

/**
 * Map bitrate strings (e.g. "320k") to VBR quality levels for
 * Vorbis (−1..10) / Opus (−1..10) since yt-dlp's --audio-quality
 * expects quality not bitrate for these codecs.
 */
function bitrateToVbrQuality(bitrate) {
  if (!bitrate || bitrate === 'best' || bitrate === 'auto') return null;
  const kbps = parseInt(bitrate, 10);
  if (isNaN(kbps)) return null;
  if (kbps >= 320) return '10';
  if (kbps >= 256) return '8';
  if (kbps >= 192) return '6';
  if (kbps >= 128) return '5';
  if (kbps >= 96) return '3';
  if (kbps >= 64) return '1';
  return '5';
}

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return null;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const sec = Math.floor(seconds % 60);
  const min = Math.floor((seconds / 60) % 60);
  const hrs = Math.floor(seconds / 3600);

  const pad = (n) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(min)}:${pad(sec)}`;
  }
  return `${pad(min)}:${pad(sec)}`;
}

module.exports = {
  getMediaInfo,
  downloadMedia,
  formatBytes,
  formatDuration
};

