import './HeroSection.css';

const PLATFORMS = [
  'YouTube',
  'TikTok (No Watermark)',
  'Instagram Reels & Stories',
  'X / Twitter',
  'Facebook',
  'Threads',
  'Reddit',
  'SoundCloud',
  '1000+ Situs Lainnya'
];

const HeroSection = () => (
  <section className="hero-section">
    <h1 className="hero-title">
      Unduh Media Sosial <span className="gradient-text">Tanpa Hambatan</span>
    </h1>
    <p className="hero-desc">
      Bebas dari kegagalan downloader pihak ketiga. Pilih resolusi video & audio secara terpisah,
      konversi ke berbagai format pilihan, dan unduh ke laptop maupun ponsel Anda dengan auto-clean server.
    </p>

    {/* Supported Platforms */}
    <div className="platforms-bar">
      {PLATFORMS.map((platform, idx) => (
        <div key={idx} className="platform-pill">
          <span>●</span>
          <span>{platform}</span>
        </div>
      ))}
    </div>
  </section>
);

export default HeroSection;
