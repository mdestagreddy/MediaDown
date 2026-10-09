# 🚀 MediaDown

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

3. **Konversi Format & Pengaturan Kualitas Audio Akurat**:
   - **Video**: `MP4`, `WebM`, `MKV`.
   - **Format Lossy (`MP3`, `M4A`, `OGG`)**:
     - Kualitas diatur spesifik berdasarkan **Bitrate**: `320 kbps` (Hi-Fi Master), `256 kbps`, `192 kbps`, `128 kbps`, `96 kbps`, `64 kbps`, atau Bitrate Asli Sumber.
   - **Format Lossless (`WAV`, `FLAC`)**:
     - Tidak menggunakan kompresi bitrate lossy, melainkan diatur langsung berdasarkan standar audio profesional:
       - **Sample Rate**: `Asli Sumber`, `44.1 kHz` (CD Audio), `48.0 kHz` (Studio/Video), `88.2 kHz`, `96.0 kHz` (Hi-Res Studio Master), `192.0 kHz` (Audiophile).
       - **Bit Depth**: `Asli Sumber`, `16-bit` (Standar CD), `24-bit` (Studio Master Hi-Res), `32-bit Float` (Pro DAW).

4. **Transfer Antar-Perangkat (Cross-Device via Wi-Fi & QR Code)**:
   - Unduh terlebih dahulu ke komputer server.
   - Sediakan tombol unduh langsung ke komputer ini atau **scan QR Code / buka URL** dari HP / tablet di jaringan Wi-Fi yang sama untuk langsung mengirim dan mengunduh ke perangkat tersebut.

5. **Auto-Cleanup / Auto-Wipe Server**:
   - Begitu file selesai diunduh oleh perangkat klien atau HP, server secara otomatis langsung menghapus file dari hard disk server demi menjaga privasi dan menghemat ruang penyimpanan.
   - Dilengkapi pembersih berkala (sweeper) untuk menghapus file yang tidak diunduh setelah 15 menit.

6. **Frontend Modern & Responsif**:
   - Desain gelap berkelas (*Cyber-Dark Glassmorphic*), animasi transisi mulus, indikator progress real-time (persen, kecepatan unduh, estimasi sisa waktu via Server-Sent Events).
   - Nyaman digunakan baik di layar HP, tablet, maupun desktop PC.

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

## 📂 Struktur Direktori

```
MediaDown/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express API & Server-Sent Events
│   │   ├── services/
│   │   │   ├── ytDlpService.js    # Ekstraksi metadata & engine unduhan yt-dlp
│   │   │   └── taskManager.js     # Manajemen task, SSE, & auto-cleanup server
│   │   └── utils/
│   │       └── network.js         # Deteksi otomatis IP LAN untuk QR transfer
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Komponen utama UI MediaDown
│   │   ├── App.css                # Styling modern responsif & glassmorphism
│   │   ├── index.css              # Reset, font, & styling global
│   │   ├── main.jsx
│   │   └── components/            # Komponen UI terpisah
│   │       ├── Header.jsx             # Brand, status server & tombol cookies
│   │       ├── HeroSection.jsx        # Judul hero & daftar platform
│   │       ├── UrlInputCard.jsx       # Input URL, tempel, analisis & error banner
│   │       ├── MediaBox.jsx           # Kartu inspeksi media (tabs + selector)
│   │       ├── MediaPreview.jsx       # Thumbnail & metadata media
│   │       ├── ModeTabs.jsx           # Tab mode Video / Audio
│   │       ├── VideoFormatSelector.jsx# Selector resolusi, audio & kontainer video
│   │       ├── AudioFormatSelector.jsx# Selector format, bitrate/sample rate & bit depth
│   │       ├── DownloadActionCard.jsx # Tombol mulai unduhan
│   │       ├── ProgressCard.jsx       # Progress unduhan real-time (SSE)
│   │       ├── ProcessingCard.jsx     # Status muxing/konversi FFmpeg
│   │       ├── ReadyBox.jsx           # Aksi unduh ke perangkat / QR
│   │       ├── CleanedBanner.jsx      # Banner file server terhapus
│   │       ├── FailedBanner.jsx       # Banner kegagalan
│   │       ├── QrModal.jsx            # Modal QR transfer cross-device
│   │       └── CookieModal.jsx        # Modal pengaturan cookies anti-bot
│   ├── vite.config.js             # Konfigurasi proxy API & host 0.0.0.0
│   └── package.json
└── README.md
```

