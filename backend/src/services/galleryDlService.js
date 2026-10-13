const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

function writeTempCookies(cookies, taskDir) {
  if (!cookies || !cookies.trim()) return null;
  const dir = taskDir || os.tmpdir();
  const tmpFile = path.join(dir, 'cookies.txt');
  fs.writeFileSync(tmpFile, cookies.trim(), 'utf8');
  return tmpFile;
}

function cleanupTempCookies(filePath) {
  if (!filePath) return;
  try { fs.unlinkSync(filePath); } catch {}
}

function getAntiBotArgs(cookies, taskDir) {
  const args = [];
  let tempCookiesPath = null;

  if (cookies && typeof cookies === 'string' && cookies.trim()) {
    tempCookiesPath = writeTempCookies(cookies, taskDir);
    if (tempCookiesPath) {
      args.push('--cookies', tempCookiesPath);
    }
  }

  return { args, tempCookiesPath };
}

/**
 * Parse gallery-dl JSON output
 * Each line is a JSON object with media info (image or video)
 */
function parseMediaJson(output) {
  const images = [];
  const videos = [];
  const mediaItems = [];
  let postMetadata = null;

  // Gallery-dl can output in two formats:
  // 1. Single-line JSON per line (NDJSON/JSONL)
  // 2. Pretty-printed multi-line JSON array: [ [type, url, metadata], ... ]
  let parsedEntries = [];

  // Try parsing the entire output as a single JSON array first
  try {
    const allData = JSON.parse(output.trim());
    if (Array.isArray(allData)) {
      parsedEntries = allData;
    }
  } catch {
    // Fall back to line-by-line parsing (NDJSON format)
    const lines = output.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        parsedEntries.push(JSON.parse(trimmed));
      } catch {
        // Skip non-JSON lines
      }
    }
  }

  for (const parsed of parsedEntries) {
    // Gallery-dl outputs arrays: [type, url, metadata]
    // type: 1=directory, 2=metadata, 3=file
    // The URL is at index [1] and metadata at index [2] for file entries
    let entry;
    let mediaUrl;
    if (Array.isArray(parsed)) {
      if (parsed[0] === 1) {
        // Metadata entry: [1, metadata]
        postMetadata = parsed[1] || {};
      } else if (parsed[0] === 3 && typeof parsed[1] === 'string') {
        // File entry: [3, url, metadata]
        mediaUrl = parsed[1];
        entry = parsed[2] || {};
        // Use metadata from the post-level entry if available
        if (!postMetadata) postMetadata = entry;
      }
    } else {
      // Standard object format
      entry = parsed;
      mediaUrl = entry.url || entry.image_url || entry.video_url || '';
    }

    if (mediaUrl) {
      let extMatch = mediaUrl.match(/\.(jpg|jpeg|png|webp|gif|svg|bmp|tiff?)/i);
      let mediaType = 'image';

      if (!extMatch) {
        const videoMatch = mediaUrl.match(/\.(mp4|webm|mov|mkv|avi|flv|wmv|m4p|m4v|mpg|mpeg|ts|ogv|3gp)/i);
        if (videoMatch) {
          extMatch = videoMatch;
          mediaType = 'video';
        }
      }

      // Detect GIF (image format that behaves like video)
      const isGif = extMatch && extMatch[1].toLowerCase() === 'gif';

      const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      const id = entry.id || entry._id || entry.tweet_id || `media_${mediaItems.length + 1}`;
      const label = isGif
        ? `${id} (GIF ${extMatch[1].toUpperCase()})`
        : extMatch
          ? `${id} (${mediaType === 'video' ? 'VIDEO ' : ''}${extMatch[1].toUpperCase()})`
          : `${id} (Image)`;

      mediaItems.push({
        id,
        url: mediaUrl,
        ext: ext,
        type: isGif ? 'gif' : mediaType,
        isGif: isGif,
        label,
        title: postMetadata?.content || entry.title || id,
        thumbnail: entry.thumbnail || entry.thumbnail_url || postMetadata?.thumbnail || '',
        platform: postMetadata?.category || '',
        postId: postMetadata?.tweet_id || postMetadata?.id || ''
      });

      if (mediaType === 'video' && !isGif) videos.push({
        id,
        url: mediaUrl,
        ext: ext,
        label: `${id} (VIDEO ${ext.toUpperCase()})`,
        title: postMetadata?.content || entry.title || id
      });
      else images.push({
        id,
        url: mediaUrl,
        ext: ext,
        label,
        title: postMetadata?.content || entry.title || id
      });
    }
  }

  // Extract post details from metadata
  if (postMetadata) {
    const author = postMetadata.author || postMetadata.user || {};
    const mediaItem = mediaItems[0];

    return {
      images,
      videos,
      mediaItems,
      postDetails: {
        authorName: author.name || author.username || postMetadata.uploader || '',
        authorUsername: author.username || author.nick || postMetadata.uploader || '',
        authorAvatar: author.profile_image || author.avatar_url || '',
        content: postMetadata.content || mediaItem?.title || '',
        hashtags: Array.isArray(postMetadata.hashtags) ? postMetadata.hashtags : [],
        viewCount: typeof postMetadata.view_count === 'number' ? postMetadata.view_count : (typeof mediaItem?.view_count === 'number' ? mediaItem.view_count : null),
        date: postMetadata.date || '',
        tweetId: postMetadata.tweet_id || postMetadata.id || '',
        mediaCount: postMetadata.count || mediaItems.length,
        category: postMetadata.category || '',
        subcategory: postMetadata.subcategory || ''
      }
    };
  }

  return { images, videos, mediaItems };
}

/**
 * Get media info for posts/stories via gallery-dl
 */
async function getImageInfo(url, cookies, taskDir) {
  return new Promise((resolve, reject) => {
    const { args: antiBotArgs, tempCookiesPath } = getAntiBotArgs(cookies, taskDir);
    const args = [
      '-q',
      '-j',
      ...antiBotArgs,
      url
    ];

    const child = spawn('gallery-dl', args);
    let stdoutBuffer = Buffer.alloc(0);
    let stderrData = '';

    child.stdout.on('data', (data) => {
      stdoutBuffer = Buffer.concat([stdoutBuffer, data]);
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    child.on('close', (code) => {
      cleanupTempCookies(tempCookiesPath);

      // Detect and handle different encodings (UTF-16 LE BOM, UTF-8 BOM)
      let stdoutData = stdoutBuffer.toString();
      if (stdoutBuffer.length >= 2) {
        if (stdoutBuffer[0] === 0xFF && stdoutBuffer[1] === 0xFE) {
          // UTF-16 LE BOM
          stdoutData = stdoutBuffer.toString('utf16le').replace(/^\uFEFF/, '');
        } else if (stdoutBuffer[0] === 0xFE && stdoutBuffer[1] === 0xFF) {
          // UTF-16 BE BOM
          stdoutData = stdoutBuffer.toString('utf16be').replace(/^\uFEFF/, '');
        } else if (stdoutBuffer[0] === 0xEF && stdoutBuffer[1] === 0xBB && stdoutBuffer[2] === 0xBF) {
          // UTF-8 BOM
          stdoutData = stdoutBuffer.toString('utf8').replace(/^\uFEFF/, '');
        }
      }

      const { images, videos, mediaItems, postDetails } = parseMediaJson(stdoutData);

      if (code !== 0 && mediaItems.length === 0) {
        const errorMsg = (stderrData.trim() || '').split('\n').pop().trim() || 'Gagal mendapatkan informasi media.';
        return reject(new Error(errorMsg));
      }

      const qualities = [
        { value: 'best', label: 'Kualitas Tertinggi (Asli)', format: 'original', quality: null },
        { value: 'high', label: 'Tinggi (85%)', format: 'webp', quality: 85 },
        { value: 'medium', label: 'Sedang (75%)', format: 'webp', quality: 75 },
        { value: 'low', label: 'Hemat (60%)', format: 'webp', quality: 60 },
        { value: 'png', label: 'PNG (Lossless)', format: 'png', quality: null },
        { value: 'jpg', label: 'JPG (90%)', format: 'jpg', quality: 90 }
      ];

      resolve({
        images,
        videos,
        mediaItems,
        postDetails: postDetails || null,
        qualities,
        count: mediaItems.length,
        stderr: stderrData.trim()
      });
    });

    child.on('error', (err) => {
      reject(new Error(`gallery-dl tidak dapat dijalankan: ${err.message}`));
    });
  });
}

/**
 * Download media from a social media post via gallery-dl
 */
async function downloadPostMedia({
  url,
  outputDir,
  imageFormat = 'original',
  totalImages = 0,
  outputTemplate,
  cookies,
  taskDir,
  onProgress,
  onLog
}) {
  return new Promise((resolve, reject) => {
    const { args: antiBotArgs, tempCookiesPath } = getAntiBotArgs(cookies, taskDir);
    const args = [
      '-q',
      ...antiBotArgs,
    ];

    // Output directory
    args.push('-D', outputDir);

     // Image format conversion via postprocessor
    // Skip conversion for GIF format to preserve animation
    if (imageFormat && imageFormat !== 'original' && imageFormat !== 'gif') {
      args.push('-P', 'image');
      args.push('-O', `format=${imageFormat}`);
    }

    // Filename template - convert yt-dlp template to gallery-dl format
    if (outputTemplate) {
      const galleryDlTemplate = outputTemplate
        .replace(/%\(title\)\.120s/g, '{title:.120}')
        .replace(/%\(title\)s/g, '{title}')
        .replace(/%\(id\)s/g, '{id}')
        .replace(/%\(ext\)s/g, '{ext}')
        .replace(/%\(uploader\)s/g, '{uploader}')
        .replace(/%\(playlist_index\)s/g, '{num}');
      args.push('-o', `filename=${galleryDlTemplate}`);
    } else {
      args.push('-o', 'filename={title}_{num}.{ext}');
    }

    args.push(url);

    if (onLog) {
      onLog(`Starting gallery-dl with arguments: ${args.join(' ')}`);
    }

    const child = spawn('gallery-dl', args);
    let stderrData = '';
    let filesDownloaded = 0;
    let totalDetected = 0;

    child.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split(/[\r\n]+/);
      for (const line of lines) {
        if (!line.trim()) continue;
        if (onLog) onLog(line);

        if (line.includes('Downloading') || line.includes('Saved')) {
          filesDownloaded++;
        }

        if (line.includes('[download]') || line.includes('downloaded')) {
          totalDetected++;
        }
      }

      if (onProgress) {
        const pct = totalImages > 0 ? Math.min((filesDownloaded / totalImages) * 100, 99) : 0;
        const countMsg = totalImages > 0
          ? `Mengunduh media... (${filesDownloaded}/${totalImages})`
          : `Mengunduh media... (${filesDownloaded} selesai)`;
        onProgress({
          percent: pct,
          speed: '',
          eta: '',
          status: 'downloading',
          downloadedBytes: 0,
          totalBytes: 0,
          message: countMsg
        });
      }
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderrData += text;
      if (onLog) onLog(`[stderr] ${text.trim()}`);
    });

    child.on('close', (code) => {
      cleanupTempCookies(tempCookiesPath);

      if (code !== 0 && filesDownloaded === 0 && totalDetected === 0) {
        return reject(new Error(stderrData.trim() || `gallery-dl keluar dengan kode ${code}`));
      }

      try {
        const extensions = ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.tiff', '.tif', '.mp4', '.webm', '.mov', '.mkv', '.avi', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg', '.ts', '.ogv', '.3gp'];
        const allFiles = fs.readdirSync(outputDir).filter(f => {
          const ext = path.extname(f).toLowerCase();
          return extensions.includes(ext) && !f.endsWith('.part');
        });

        if (allFiles.length === 0) {
          return reject(new Error('File media hasil unduhan tidak ditemukan di server.'));
        }

        if (allFiles.length === 1) {
          const file = allFiles[0];
          const filePath = path.join(outputDir, file);
          const stats = fs.statSync(filePath);

          resolve({
            fileName: file,
            filePath,
            fileSize: stats.size,
            formattedSize: formatBytes(stats.size),
            mode: 'image'
          });
        } else {
          const fileEntries = allFiles.map(f => {
            const stats = fs.statSync(path.join(outputDir, f));
            return { name: f, path: path.join(outputDir, f), size: stats.size };
          });

          const totalSize = fileEntries.reduce((sum, f) => sum + f.size, 0);

          resolve({
            fileName: fileEntries[0].name,
            filePath: fileEntries[0].path,
            fileSize: totalSize,
            formattedSize: formatBytes(totalSize) || '0 B',
            mode: 'image',
            playlistFiles: fileEntries,
            itemCount: fileEntries.length
          });
        }
      } catch (err) {
        reject(new Error(`Gagal membaca file hasil: ${err.message}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`gallery-dl tidak dapat dijalankan: ${err.message}`));
    });
  });
}

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return null;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

module.exports = {
  getImageInfo,
  downloadPostMedia
};
