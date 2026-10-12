const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const cookiesPath = path.resolve(__dirname, '../../cookies.txt');

function getAntiBotArgs() {
  const args = [];

  if (fs.existsSync(cookiesPath)) {
    args.push('--cookies', cookiesPath);
  }

  return args;
}

/**
 * List available images for a URL using gallery-dl
 */
async function getImageInfo(url) {
  return new Promise((resolve, reject) => {
    const args = [
      '-q',
      '-j',
      ...getAntiBotArgs(),
      url
    ];

    const child = spawn('gallery-dl', args);
    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0 && !stdoutData.trim()) {
        const errorMsg = stderrData.trim() || 'Gagal mendapatkan informasi gambar.';
        return reject(new Error(errorMsg));
      }

      const images = parseImageJson(stdoutData);

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
        qualities,
        count: images.length
      });
    });

    child.on('error', (err) => {
      reject(new Error(`gallery-dl tidak dapat dijalankan: ${err.message}`));
    });
  });
}

/**
 * Parse gallery-dl JSON output
 * Each line is a JSON object with image info
 */
function parseImageJson(output) {
  const images = [];
  const lines = output.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const entry = JSON.parse(trimmed);
      const imageUrl = entry.url || entry.image_url || '';

      if (imageUrl) {
        const extMatch = imageUrl.match(/\.(jpg|jpeg|png|webp|gif|svg|bmp|tiff?)/i);
        const id = entry.id || entry._id || `img_${images.length + 1}`;
        images.push({
          id,
          url: imageUrl,
          ext: extMatch ? extMatch[1].toLowerCase() : 'jpg',
          label: `${id} (${extMatch ? extMatch[1].toUpperCase() : 'Image'})`,
          title: entry.title || id
        });
      }
    } catch {
      // Skip non-JSON lines
    }
  }

  return images;
}

/**
 * Download images using gallery-dl
 */
async function downloadImages({
  url,
  outputDir,
  imageFormat = 'original',
  imageQuality = 'best',
  totalImages = 0,
  onProgress,
  onLog
}) {
  return new Promise((resolve, reject) => {
    const args = [
      '-q',
      ...getAntiBotArgs(),
    ];

    // Output directory
    args.push('-D', outputDir);

    // Image format conversion via postprocessor
    if (imageFormat && imageFormat !== 'original') {
      args.push('-P', 'image');
      args.push('-O', `format=${imageFormat}`);

      // Image quality
      if (imageQuality && imageQuality !== 'best' && typeof imageQuality === 'number') {
        args.push('-O', `quality=${imageQuality}`);
      }
    }

    // Filename template
    args.push('-o', 'filename={title}_{num}.{ext}');

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
          ? `Mengunduh gambar... (${filesDownloaded}/${totalImages})`
          : `Mengunduh gambar... (${filesDownloaded} selesai)`;
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
      if (code !== 0 && filesDownloaded === 0 && totalDetected === 0) {
        return reject(new Error(stderrData.trim() || `gallery-dl keluar dengan kode ${code}`));
      }

      try {
        const extensions = ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.tiff', '.tif'];
        const allFiles = fs.readdirSync(outputDir).filter(f => {
          const ext = path.extname(f).toLowerCase();
          return extensions.includes(ext) && !f.endsWith('.part');
        });

        if (allFiles.length === 0) {
          return reject(new Error('File gambar hasil unduhan tidak ditemukan di server.'));
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
  downloadImages,
  formatBytes
};
