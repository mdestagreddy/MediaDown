# 🚀 MediaDown

<a href="https://github.com/mdestagreddy/MediaDown">
  <img src="https://img.shields.io/badge/Source%20Code-black?logo=github&style=for-the-badge" alt="GitHub">
</a>

Aplikasi pengunduh media sosial performa tinggi berbasis **yt-dlp** & **FFmpeg** dengan antarmuka web modern responsif (React).

Dirancang khusus untuk melampaui website downloader pihak ketiga yang sering rusak karena pembaruan API sosmed (Instagram, TikTok, YouTube, Twitter/X, Facebook, Reddit, dsb).

---

## ✨ Fitur Unggulan

1. **Jantung Server yt-dlp & FFmpeg**:
   - Mendukung ribuan platform sosmed dan situs video/audio.
   - Mengambil stream asli langsung dari sumber tanpa batas kecepatan buatan.

2. **Kualitas Video & Audio Terpisah (Custom Combinations)**:
    - Tidak lagi dipaksa menggunakan video yang sudah digabung atau kualitas audio rendah dari server sosmed.
     - Anda bebas memilih resolusi video tertinggi (4K, 1440p, 1080p 60fps, 720p, dll.) dan memasangkannya dengan stream audio pilihan (Best Audio, 320 kbps, 128 kbps, atau video tanpa suara/mute).
     - **Preset Kualitas Video untuk Pemula (MP4)**: Pemilih resolusi cepat dengan 8 preset bertahap — `144p`, `240p`, `360p`, `480p (SD)`, `720p (HD)`, `1080p (Full HD)`, `1440p (2K QHD)`, dan `2160p (4K UHD)`. Setiap preset otomatis menggunakan kodek selektor tinggi (`bestvideo[height<=N]`) dan **mengunci kontainer MP4** yang kompatibel semua perangkat. Preset yang melebihi resolusi maksimum video sumber otomatis disembunyikan.
     - **Opsi Kustom**: Pilih format video spesifik dari daftar lengkap + audio bebas + kontainer WebM/MKV untuk kontrol penuh.
     - **Auto-Detect Audio-Only**: Jika konten tidak memiliki stream video (mis. SoundCloud), tab "Video + Audio" otomatis disembunyikan dan aplikasi langsung beralih ke tab "Audio" untuk ekstraksi langsung.

3. **Konversi Format & Pengaturan Kualitas Audio Akurat**:
    - **Video**: `MP4`, `WebM`, `MKV`.
    - **Format Lossy (`MP3`, `M4A`, `OGG Vorbis`, `Opus`)**:
      - Kualitas diatur spesifik berdasarkan **Bitrate**: `320 kbps` (Hi-Fi Master), `256 kbps`, `192 kbps`, `128 kbps`, `96 kbps`, `64 kbps`, atau **Original Source Quality** (mempertahankan kodek asli).
      - **Opus** mendukung bitrate ekstra rendah untuk hemat kuota: `550 kbps` (Hi-Fi), `320 kbps`, `256 kbps`, `192 kbps`, `128 kbps`, `96 kbps`, `64 kbps`, `48 kbps`, `32 kbps` (VoIP), `24 kbps` (Low Bandwidth).
      - **Original**: Mempertahankan format dan kodek audio sumber asli tanpa re-encoding, cocok untuk platform audio-only seperti SoundCloud.
    - **Format Lossless (`WAV`, `FLAC`)**:
     - Tidak menggunakan kompresi bitrate lossy, melainkan diatur langsung berdasarkan standar audio profesional:
       - **Sample Rate**: `Asli Sumber`, `44.1 kHz` (CD Audio), `48.0 kHz` (Studio/Video), `88.2 kHz`, `96.0 kHz` (Hi-Res Studio Master), `192.0 kHz` (Audiophile).
        - **Bit Depth**: `Asli Sumber`, `16-bit` (Standar CD), `24-bit` (Studio Master Hi-Res), `32-bit Float` (Pro DAW).
     - **Metadata & Cover Art Embedding** (MP3, M4A, FLAC):
       - Aktifkan toggle "Sertakan Metadata & Cover Art" untuk menyematkan judul, artis, album, dan gambar cover ke dalam file audio.
       - Untuk MP3, thumbnail otomatis dikonversi ke JPEG sebelum disematkan sebagai ID3 APIC frame.
       - Menggunakan `--embed-thumbnail` + `--embed-metadata` dari yt-dlp.

4. **Transfer Antar-Perangkat (Cross-Device via Wi-Fi & QR Code)**:
   - Unduh terlebih dahulu ke komputer server.
   - Sediakan tombol unduh langsung ke komputer ini atau **scan QR Code / buka URL** dari HP / tablet di jaringan Wi-Fi yang sama untuk langsung mengirim dan mengunduh ke perangkat tersebut.

5. **Auto-Cleanup / Auto-Wipe Server**:
    - Begitu file selesai diunduh oleh perangkat klien atau HP, server secara otomatis langsung menghapus file dari hard disk server demi menjaga privasi dan menghemat ruang penyimpanan.
    - File juga otomatis dihapus saat koneksi klien terputus (refresh halaman, menutup browser/tab, ganti URL) — timer SSE disconnect membersihkan file yang siap dalam 5 detik jika tidak ada koneksi ulang.
    - Dilengkapi pembersih berkala (sweeper) untuk menghapus file yang tidak diunduh setelah 15 menit.

6. **Frontend Modern & Responsif**:
    - Desain gelap berkelas (*Cyber-Dark Glassmorphic*), animasi transisi mulus, indikator progress real-time (persen, kecepatan unduh, estimasi sisa waktu via Server-Sent Events).
    - Tampilan log terminal lengkap di bawah progress card — meliputi semua output yt-dlp/gallery-dl (URL, kecepatan, status FFmpeg muxing) dengan auto-scroll ke entri terbaru.
    - Informasi progres byte-level (`15.2 MB / 33.4 MB`) untuk unduhan video/audio, dan hitungan file (`3/10`) untuk galeri gambar.
    - Nyaman digunakan baik di layar HP, tablet, maupun desktop PC.
    - **Tema Terang/Gelap otomatis**: mendeteksi preferensi perangkat (`prefers-color-scheme`). Toggle manual via ikon di header (Auto ↔ Terang ↔ Gelap), pilihan tersimpan di *localStorage*.
    - **Multi-Language Support (i18n)** dilengkapi di bawah.

7. **Multi-Language Support (i18n):**
    - Bahasa Indonesia & English (auto-detect dari perangkat atau pilih manual).
    - Semua string teks disimpan dalam file JSON (`src/locales/id.json`, `src/locales/en.json`).
    - Toggle bahasa tersedia di footer; preferensi disimpan di *localStorage*.

8. **Queue-Based Download Processing**:
   - Unduhan diproses secara berurut dengan kontrol concurrency (`MAX_CONCURRENT`, default 4) agar server tidak kelebihan beban.
   - Pantau antrean via `GET /api/queue`.

9. **Auto-Wipe sampai bersih (Orphan Cleanup)**:
   - On startup & tiap 2 menit, semua folder/task yang tidak terlacak (`backend/downloads/`, termasuk sisa crash) dan file `.part/.tmp` otomatis dihapus.

10. **Anti-Bot (Cloudflare Turnstile) — production only**:
   - Proteksi captcha pada `POST /api/info`, `/api/image-info`, `/api/download`.
   - Aktif **hanya di production** (`import.meta.env.PROD`) ketika `VITE_TURNSTILE_SITE_KEY` diset. Di dev, captcha otomatis tidak muncul.
   - Jika `TURNSTILE_SECRET_KEY` belum di-set di backend, semua request lolos (graceful degradation).

11. **Rate Limiting**:
    - `express-rate-limit` mencegah looping/flood API: 90 req/menit/IP → `429 Too Many Requests` pada semua route `/api/`.

12. **Server resilience**:
    - Handler `uncaughtException` / `unhandledRejection` mencegah server crash mendadak dan mencatat error ke log.

13. **Anti Double-Click / Download Guard**:
    - `useRef` guard mencegah trigger download ganda saat klik cepat pada tombol "Unduh Sekarang".
    - QR modal tidak auto-tampil — hanya muncul saat user klik "Kirim ke HP / Perangkat Lain".

14. **Media Preview Before Download**:
    - Di halaman *Ready*, tonton dengar pratinjau video/audio/gambar langsung di browser sebelum mengunduh.
    - Endpoint `/api/preview/:taskId/:filename?` melayani file dengan `Content-Disposition: inline`.

15. **Manual Server File Deletion**:
    - Tombol "Hapus File dari Server Sekarang" di *Ready Box* memungkinkan hapus manual file.
    - File otomatis dihapus setelah unduh berhasil (auto-cleanup).

16. **Playlist Metadata & Quality Selection**:
    - Ekstraksi metadata penuh untuk setiap item playlist (judul, artis/uploader, durasi, cover/artwork) pada platform seperti SoundCloud, YouTube Music, dan lainnya.
    - Menggunakan `--yes-playlist` dengan `--playlist-end 100` untuk mengambil hingga 100 item pertama dengan metadata lengkap.
    - Pemilihan kualitas untuk playlist: pilih mode unduh (Video + Audio atau Audio Only) dan kualitas (Best, High, Medium, Low) sebelum memulai unduh.
    - Toggle "Sertakan Metadata & Cover Art" tersedia di mode playlist (Audio Only) untuk format MP3/M4A/FLAC.
    - Auto-detect: jika konten hanya audio (mis. SoundCloud), tab "Video + Audio" otomatis disembunyikan.

17. **FAQ Page**:
    - Halaman `/faq` dengan 10 pertanyaan umum (multi-bahasa).

18. **Video Quality Presets API**:
    - `POST /api/download` menerima parameter `videoQualityPreset` (`144p`, `240p`, `360p`, `480p`, `720p`, `1080p`, `1440p`, `2160p`, `custom`).
    - Preset otomatis memilih format video dengan batasan resolusi maksimum via `bestvideo[height<=N]` dan menggabungkan dengan audio terbaik, lalu meremix ke kontainer **MP4**.
    - Opsi `custom` menggunakan ID format spesifik yang dipilih pengguna dan respek `videoContainer` (`mp4`, `webm`, `mkv`).

19. **Metadata & Cover Art Embedding**:
    - Aktifkan toggle di bawah format audio (MP3, M4A, FLAC) untuk menyematkan judul, artis, album, dan gambar cover ke dalam file audio.
    - Berlaku untuk mode Audio tunggal sekaligus untuk playlist mode (Audio Only).
    - Menggunakan `--embed-thumbnail` + `--embed-metadata` dari yt-dlp; MP3 otomatis mengkonversi thumbnail ke JPEG.

---

## 🔒 Keamanan

### Cloudflare Turnstile (anti-bot)
- **Get keys**: [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/)
- **Backend** (`backend/.env`):
  ```
  TURNSTILE_SECRET_KEY=your_secret_key
  ```
- **Frontend** (build-time, `frontend/.env`):
  ```
  VITE_TURNSTILE_SITE_KEY=your_site_key
  ```
- Aktif otomatis di **production build** saja. Di `npm run dev`, captcha tidak muncul.

### Rate limiting
| Aturan | Nilai |
|---|---|
| Window | 60 detik |
| Limit / IP | 90 request |
| Endpoint | Semua `/api/*` |
| Response over-limit | `429` + header `Retry-After` |

### Queue & concurrency
- `MAX_CONCURRENT` (env, default `4`) — jumlah unduhan simultan maksimal.
- Task berikutnya otomatis jalan ketika slot ada. Cek antrean via `GET /api/queue`.

---

## 🛠️ Panduan Menjalankan Aplikasi

### 1. Prasyarat Sistem
- **Node.js** (v18+)
- **yt-dlp** & **ffmpeg** (sudah terpasang di sistem dan terdaftar dalam PATH)

### 2. Jalankan Backend (Port 5000)
```bash
cd backend
npm install   # Jika belum terpasang
npm run dev   # atau: npm start
```

Backend akan aktif di:
- Local: `http://localhost:5000`
- Network: `http://<IP-LAN-ANDA>:5000`

### 3. Jalankan Frontend (Port 5173)
```bash
cd frontend
npm install   # Jika belum terpasang
npm run dev
```

Buka browser:
- `http://localhost:5173` (di komputer Anda)
- `http://<IP-LAN-ANDA>:5173` (di HP atau perangkat lain dalam Wi-Fi yang sama)

---

## 🐳 Deployment (Docker)

Proyek sudah dilengkapi konfigurasi Docker siap pakai untuk produksi.

### 0. Persiapan
Salin `.env.example` → `.env`, lalu isi key Turnstile & engine path:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:
```
PORT=5000
TURNSTILE_SECRET_KEY=your_cloudflare_secret        # optional, kosongkan = nonaktif
YTDLP_COOKIE_FILE=/app/cookies/cookies.txt         # optional
```

Edit `frontend/.env` (build-time):
```
VITE_TURNSTILE_SITE_KEY=your_cloudflare_sitekey   # optional, kosongkan = nonaktif di prod
```

### 1. Build & jalankan
```bash
docker-compose up -d --build
```

| Service | Port | Keterangan |
|---|---|---|
| `backend` | 5000 | Express API + yt-dlp/gallery-dl/ffmpeg |
| `frontend` | 5173 → 80 | React build via nginx |
| `nginx` | 80/443 | Reverse proxy (API → backend, / → frontend) |

### 2. Akses
- Lokal: `http://localhost`
- LAN: `http://<IP-LAN-ANDA>`

### 3. Environment variables
Lihat `backend/.env.example` & `frontend/.env.example` untuk daftar lengkap termasuk `MAX_CONCURRENT`, engine paths, dan Turnstile.

---

## 📂 Struktur Direktori

```
MediaDown/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express API & Server-Sent Events
│   │   ├── services/
│   │   │   ├── ytDlpService.js    # Ekstraksi metadata & engine unduhan yt-dlp
│   │   │   ├── galleryDlService.js# Engine unduhan gambar via gallery-dl
│   │   │   └── taskManager.js     # Manajemen task, SSE, log & auto-cleanup server
│   │   └── utils/
│   │       └── network.js         # Deteksi otomatis IP LAN untuk QR transfer
│   ├── .env.example               # Env template (TURNSTILE_SECRET_KEY, engine paths)
│   ├── Dockerfile                 # Production image (Node + yt-dlp + ffmpeg + gallery-dl)
│   ├── .dockerignore
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Layout shell: Header, Footer, QrModal, CookieModal + shared state
│   │   ├── App.css                # Styling modern responsif & glassmorphism
│   │   ├── index.css              # Reset, font, & styling global
│   │   ├── main.jsx               # Entry point (BrowserRouter + LocaleProvider)
│   │   ├── contexts/
│   │   │   └── LocaleContext.jsx  # React Context provider untuk i18n state
│   │   ├── hooks/
│   │   │   ├── useLocale.js       # Hook konsumsi locale context (t, setLocale, locale)
│   │   │   └── useTheme.js        # Hook tema (auto/light/dark) + prefers-color-scheme
│   │   ├── locales/
│   │   │   ├── index.js           # Loader JSON + translate() helper
│   │   │   ├── id.json            # String Indonesia
│   │   │   └── en.json            # String English
│   │   ├── utils/
│   │   │   └── api.js             # fetchJson helper
│   │   ├── components/            # Komponen UI terpisah
│   │   │   ├── Header.jsx             # Brand, status server, tema, tombol cookies (route-aware)
│   │   │   ├── Footer.jsx             # Copyright, link navigasi, GitHub, powered-by, language toggle
│   │   │   ├── HeroSection.jsx        # Judul hero & daftar platform
│   │   │   ├── UrlInputCard.jsx       # Input URL, tempel, analisis & error banner
│   │   │   ├── MediaBox.jsx           # Kartu inspeksi media (tabs + selector)
│   │   │   ├── MediaPreview.jsx       # Thumbnail & metadata media
│   │   │   ├── ModeTabs.jsx           # Tab mode Video / Audio / Gambar / Playlist
│   │   │   ├── VideoFormatSelector.jsx# Selector preset kualitas video + format & kontainer (144p–4K + Custom)
│   │   │   ├── AudioFormatSelector.jsx# Selector format, bitrate/sample rate & bit depth
│   │   │   ├── DownloadActionCard.jsx # Tombol mulai unduhan
│   │   │   ├── ProgressCard.jsx       # Progress unduhan real-time + log terminal via SSE
│   │   │   ├── ProcessingCard.jsx     # Status muxing/konversi FFmpeg + log terminal
│   │   │   ├── ReadyBox.jsx           # Aksi unduh ke perangkat / QR
│   │   │   ├── CleanedBanner.jsx      # Banner file server terhapus
│   │   │   ├── FailedBanner.jsx       # Banner kegagalan
│   │   │   ├── QrModal.jsx            # Modal QR transfer cross-device
│   │   │   ├── CookieModal.jsx        # Modal pengaturan cookies anti-bot
│   │   │   └── shared.css             # Utilitas & styling bersama
│   │   └── pages/
│   │       ├── MainPage.jsx           # Route page: logika unduh utama
│   │       └── Terms.jsx              # Route page: Syarat & Ketentuan (i18n)
│   ├── .env.example                   # Env template (VITE_TURNSTILE_SITE_KEY, dll)
│   ├── Dockerfile                     # Builder (vite) + nginx runtime
│   ├── .dockerignore
│   ├── vite.config.js             # Konfigurasi proxy API & host 0.0.0.0
│   └── package.json
├── docker-compose.yml           # Orchestration: backend + frontend + nginx
├── nginx/
│   ├── conf.d/default.conf    # Reverse proxy (API → 5000, / → frontend)
│   └── letsencrypt/           # TLS cert mount
└── README.md
```

