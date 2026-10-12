const fs = require('fs');
const path = require('path');

class TaskManager {
  constructor() {
    this.tasks = new Map();
    this.downloadsDir = path.resolve(__dirname, '../../downloads');

    // Queue configuration from env
    this.maxConcurrent = parseInt(process.env.MAX_CONCURRENT) || 4;
    this.activeCount = 0;
    this.queue = []; // Array of { taskId, downloadFn, resolve, reject }
    this.MAX_LOG_LINES = 200;

    // Ensure downloads base directory exists
    if (!fs.existsSync(this.downloadsDir)) {
      fs.mkdirSync(this.downloadsDir, { recursive: true });
    }

    // Clean up any leftover/orphan files from previous (possibly crashed) sessions
    this.cleanupOrphanFiles();

    // Background auto-cleanup for stale files older than 15 minutes
    setInterval(() => this.cleanupStaleTasks(), 2 * 60 * 1000);
  }

  createTask(id, metadata = {}) {
    const taskDir = path.join(this.downloadsDir, id);
    if (!fs.existsSync(taskDir)) {
      fs.mkdirSync(taskDir, { recursive: true });
    }

    const task = {
      id,
      taskDir,
      status: 'pending', // pending, queued, downloading, processing, ready, failed, cleaned
      progress: 0,
      speed: '',
      eta: '',
      message: 'Mempersiapkan unduhan...',
      fileName: null,
      filePath: null,
      fileSize: 0,
      formattedSize: '',
      mode: 'video', // video | audio | image | playlist
      playlistFiles: [], // array of { name, path, size } for playlist mode
      error: null,
      queuePosition: null,
      createdAt: Date.now(),
       downloadedCount: 0,
      isCleaned: false,
      activeDownloads: 0,
      sseDisconnectTimer: null,
      downloadedBytes: 0,
      totalBytes: 0,
      logs: [],
      _logBroadcastTimer: null,
      sseClients: new Set(),
      ...metadata
    };

    this.tasks.set(id, task);
    return task;
  }

  getTask(id) {
    return this.tasks.get(id);
  }

  updateTask(id, updates) {
    const task = this.tasks.get(id);
    if (!task) return null;

    Object.assign(task, updates);

    // Cancel any pending log broadcast since we're broadcasting now
    if (task._logBroadcastTimer) {
      clearTimeout(task._logBroadcastTimer);
      task._logBroadcastTimer = null;
    }

    // Notify connected SSE listeners
    this.broadcast(task);
    return task;
  }

  /**
   * Append a log line to a task. Uses a short debounce on the SSE
   * broadcast so that bursts of log lines (e.g. gallery-dl stdout)
   * don't flood connected clients. A subsequent updateTask call
   * will cancel the debounce and broadcast immediately.
   */
  addLog(id, message) {
    const task = this.tasks.get(id);
    if (!task) return;

    task.logs.push(message);
    if (task.logs.length > this.MAX_LOG_LINES) {
      task.logs = task.logs.slice(-this.MAX_LOG_LINES);
    }

    // Schedule a debounced broadcast for log-only updates
    if (task._logBroadcastTimer) {
      clearTimeout(task._logBroadcastTimer);
    }
    task._logBroadcastTimer = setTimeout(() => {
      const currentTask = this.tasks.get(id);
      if (currentTask) {
        currentTask._logBroadcastTimer = null;
        this.broadcast(currentTask);
      }
    }, 100);
  }

  /**
   * Enqueue a download task to run when a worker slot is available
   */
  enqueueTask(taskId, downloadFn) {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    return new Promise((resolve, reject) => {
      // Set queue position for tasks that need to wait
      const position = this.activeCount >= this.maxConcurrent ? this.queue.length : null;
      if (position !== null) {
        this.updateTask(taskId, {
          status: 'queued',
          queuePosition: position + 1
        });
        this.addLog(taskId, `Antrean - posisi ${position + 1}. Menunggu giliran...`);
      } else {
        this.updateTask(taskId, {
          status: 'downloading',
          queuePosition: null
        });
        this.addLog(taskId, 'Mulai mengunduh dari server platform media sosial...');
      }

      this.queue.push({ taskId, downloadFn, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process the queue - start downloads up to maxConcurrent
   */
  processQueue() {
    if (this.activeCount >= this.maxConcurrent) return;
    if (this.queue.length === 0) return;

    const next = this.queue.shift();
    this.activeCount++;

    // Update queue positions for remaining tasks
    let pos = 1;
    for (const item of this.queue) {
      this.updateTask(item.taskId, { queuePosition: pos });
      pos++;
    }

    const task = this.tasks.get(next.taskId);
    if (task) {
      this.updateTask(next.taskId, {
        status: 'downloading',
        queuePosition: null
      });
    }

    // Execute the download function
    next.downloadFn()
      .then((result) => {
        this.updateTask(next.taskId, {
          status: 'ready',
          progress: 100,
          speed: '',
          eta: '',
          downloadedBytes: task.fileSize || 0,
          totalBytes: task.fileSize || 0,
          message: 'File siap diunduh ke perangkat Anda!',
          fileName: result.fileName,
          filePath: result.filePath,
          fileSize: result.fileSize,
          formattedSize: result.formattedSize,
          playlistFiles: result.playlistFiles || []
        });
        this.addLog(next.taskId, `Unduhan selesai! File siap: ${result.fileName || 'media'}`);
        next.resolve(result);
      })
      .catch((err) => {
        console.error(`[Download Error Task ${next.taskId}]:`, err.message);
        this.updateTask(next.taskId, {
          status: 'failed',
          error: err.message,
          message: `Gagal mengunduh: ${err.message}`
        });
        this.addLog(next.taskId, `Gagal: ${err.message}`);
        next.reject(err);
      })
      .finally(() => {
        this.activeCount--;
        this.processQueue();
      });
  }

  /**
   * Get current queue status
   */
  getQueueStatus() {
    const queuedTasks = this.queue.map((item, idx) => {
      const task = this.tasks.get(item.taskId);
      return task ? { id: item.taskId, title: task.title, status: 'queued', position: idx + 1 } : null;
    }).filter(Boolean);

    return {
      activeCount: this.activeCount,
      maxConcurrent: this.maxConcurrent,
      queuedCount: this.queue.length,
      queuedTasks
    };
  }

  /**
   * Track an active file download transfer for this task.
   * Increments the active download counter and cancels any pending
   * SSE-disconnect cleanup since the client is actively downloading.
   */
  startDownload(id) {
    const task = this.tasks.get(id);
    if (!task) return;

    task.activeDownloads += 1;

    if (task.sseDisconnectTimer) {
      clearTimeout(task.sseDisconnectTimer);
      task.sseDisconnectTimer = null;
    }
  }

  /**
   * Decrement the active download counter when a transfer ends
   * (either via 'finish' or 'close' on the response).
   */
  endDownload(id) {
    const task = this.tasks.get(id);
    if (!task) return;

    task.activeDownloads = Math.max(0, task.activeDownloads - 1);
  }

  subscribe(id, res) {
    const task = this.tasks.get(id);
    if (!task) return false;

    task.sseClients.add(res);

    // A client just connected, so cancel any pending disconnect-based cleanup
    if (task.sseDisconnectTimer) {
      clearTimeout(task.sseDisconnectTimer);
      task.sseDisconnectTimer = null;
    }

    // Send immediate initial state
    res.write(`data: ${JSON.stringify(this.serializeTask(task))}\n\n`);

    res.on('close', () => {
      task.sseClients.delete(res);

      // When the last SSE client disconnects for a 'ready' task (e.g. page refresh,
      // tab close, URL change) and no download transfer is in progress, schedule
      // a delayed cleanup. The grace period allows the frontend to reconnect
      // (via its auto-reconnect logic) before the file is removed.
      if (
        task.status === 'ready' &&
        task.sseClients.size === 0 &&
        task.activeDownloads === 0 &&
        !task.isCleaned
      ) {
        if (task.sseDisconnectTimer) {
          clearTimeout(task.sseDisconnectTimer);
        }

        task.sseDisconnectTimer = setTimeout(() => {
          const currentTask = this.tasks.get(id);
          if (
            currentTask &&
            !currentTask.isCleaned &&
            currentTask.status === 'ready' &&
            currentTask.sseClients.size === 0 &&
            currentTask.activeDownloads === 0
          ) {
            currentTask.sseDisconnectTimer = null;
            currentTask.message = 'File server otomatis dihapus karena tidak ada koneksi klien yang tersisa.';
            this.broadcast(currentTask);
            this.cleanTaskFile(id);
          }
        }, 5000);
      }
    });

    return true;
  }

  broadcast(task) {
    if (!task || !task.sseClients || task.sseClients.size === 0) return;
    const payload = `data: ${JSON.stringify(this.serializeTask(task))}\n\n`;
    for (const client of task.sseClients) {
      try {
        client.write(payload);
      } catch (err) {
        task.sseClients.delete(client);
      }
    }
  }

  serializeTask(task) {
    return {
      id: task.id,
      status: task.status,
      progress: task.progress,
      speed: task.speed,
      eta: task.eta,
      message: task.message,
      fileName: task.fileName,
      fileSize: task.fileSize,
      formattedSize: task.formattedSize,
      mode: task.mode,
      playlistFiles: task.playlistFiles?.map(f => ({ name: f.name, size: f.size })),
      itemCount: task.playlistFiles?.length || 0,
      queuePosition: task.queuePosition,
      error: task.error,
      downloadedCount: task.downloadedCount,
      isCleaned: task.isCleaned,
      downloadedBytes: task.downloadedBytes,
      totalBytes: task.totalBytes,
      logs: task.logs
    };
  }

  /**
   * Called when client successfully downloads the file.
   * Cleans the file from the server automatically as required!
   */
  markDownloaded(id) {
    const task = this.tasks.get(id);
    if (!task) return;

    // Cancel any pending SSE-disconnect cleanup since a download has completed
    if (task.sseDisconnectTimer) {
      clearTimeout(task.sseDisconnectTimer);
      task.sseDisconnectTimer = null;
    }

    task.downloadedCount += 1;
    task.message = 'Berhasil diunduh ke perangkat klien. Menghapus file dari server...';
    this.broadcast(task);

    // Safe grace period before removing to let client socket flush and close completely
    setTimeout(() => {
      this.cleanTaskFile(id);
    }, 2500);
  }

  /**
   * Remove downloaded files and directory from server storage
   */
  cleanTaskFile(id) {
    const task = this.tasks.get(id);
    if (!task || task.isCleaned) return;

    // Cancel any pending SSE-disconnect cleanup since we're cleaning now
    if (task.sseDisconnectTimer) {
      clearTimeout(task.sseDisconnectTimer);
      task.sseDisconnectTimer = null;
    }

    // Cancel any pending log broadcast
    if (task._logBroadcastTimer) {
      clearTimeout(task._logBroadcastTimer);
      task._logBroadcastTimer = null;
    }

    try {
      if (task.taskDir && fs.existsSync(task.taskDir)) {
        fs.rmSync(task.taskDir, { recursive: true, force: true });
      }
      task.isCleaned = true;
      task.status = 'cleaned';
      task.message = 'File server telah otomatis dihapus setelah pengunduhan berhasil.';
      task.filePath = null;
      this.broadcast(task);
      console.log(`[Auto-Clean] File task ${id} berhasil dihapus dari server.`);
    } catch (err) {
      console.error(`[Auto-Clean Error] Gagal menghapus task ${id}:`, err.message);
    }
  }

  /**
   * Periodically remove files older than 15 minutes to prevent leftover disk storage
   */
  cleanupStaleTasks() {
    const maxAge = 15 * 60 * 1000;
    const now = Date.now();

    for (const [id, task] of this.tasks.entries()) {
      if (now - task.createdAt > maxAge) {
        if (!task.isCleaned) {
          this.cleanTaskFile(id);
        }
        // Remove task record after 30 minutes
        if (now - task.createdAt > 30 * 60 * 1000) {
          this.tasks.delete(id);
        }
      }
    }

    this.cleanupOrphanFiles();
  }

  /**
   * Remove orphan folders and junk files in the downloads directory
   * that are not tracked by any known task (e.g. failed/crashed downloads)
   */
  cleanupOrphanFiles() {
    if (!fs.existsSync(this.downloadsDir)) return;

    const trackedDirs = new Set();
    for (const task of this.tasks.values()) {
      if (task.taskDir && !task.isCleaned) {
        trackedDirs.add(task.taskDir);
      }
    }

     let removed = 0;
    for (const entry of fs.readdirSync(this.downloadsDir, { withFileTypes: true })) {
      const fullPath = path.join(this.downloadsDir, entry.name);

      // Skip active task folders
      if (trackedDirs.has(fullPath)) continue;

      // Remove orphaned subdirectories (task-* UUID folders, tmp/, temp/) but skip dotfiles
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
          removed++;
        } catch (err) {
          console.error(`[Orphan Cleanup] Gagal hapus ${entry.name}:`, err.message);
        }
        continue;
      }

      // Remove stray partial/temp files
      if (entry.isFile() && (entry.name.endsWith('.part') || entry.name.endsWith('.temp') || entry.name.endsWith('.tmp'))) {
        try {
          fs.rmSync(fullPath);
          removed++;
        } catch (err) {
          console.error(`[Orphan Cleanup] Gagal hapus ${entry.name}:`, err.message);
        }
      }
    }

    if (removed > 0) {
      console.log(`[Orphan Cleanup] ${removed} item(s) sampah dibersihkan dari downloads/`);
    }
  }
}

module.exports = new TaskManager();
