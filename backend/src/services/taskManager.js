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

    // Notify connected SSE listeners
    this.broadcast(task);
    return task;
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
      } else {
        this.updateTask(taskId, {
          status: 'downloading',
          queuePosition: null
        });
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
          message: 'File siap diunduh ke perangkat Anda!',
          fileName: result.fileName,
          filePath: result.filePath,
          fileSize: result.fileSize,
          formattedSize: result.formattedSize,
          playlistFiles: result.playlistFiles || []
        });
        next.resolve(result);
      })
      .catch((err) => {
        console.error(`[Download Error Task ${next.taskId}]:`, err.message);
        this.updateTask(next.taskId, {
          status: 'failed',
          error: err.message,
          message: `Gagal mengunduh: ${err.message}`
        });
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

  subscribe(id, res) {
    const task = this.tasks.get(id);
    if (!task) return false;

    task.sseClients.add(res);

    // Send immediate initial state
    res.write(`data: ${JSON.stringify(this.serializeTask(task))}\n\n`);

    res.on('close', () => {
      task.sseClients.delete(res);
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
      isCleaned: task.isCleaned
    };
  }

  /**
   * Called when client successfully downloads the file.
   * Cleans the file from the server automatically as required!
   */
  markDownloaded(id) {
    const task = this.tasks.get(id);
    if (!task) return;

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
