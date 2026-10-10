import './HeroSection.css';
import useLocale from '../hooks/useLocale';

const HeroSection = () => {
  const { t } = useLocale();
  const platforms = t('main.platforms').split(',');

  return (
    <section className="hero-section">
      <h1 className="hero-title">
        {t('main.heroTitle')} <span className="gradient-text">{t('main.heroTitleSpan')}</span>
      </h1>
      <p className="hero-desc">
        {t('main.heroDesc')}
      </p>

      {/* Supported Platforms */}
      <div className="platforms-bar">
        {platforms.map((platform, idx) => (
          <div key={idx} className="platform-pill">
            <span>●</span>
            <span>{platform}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
