import './HeroSection.css';
import useLocale from '../hooks/useLocale';

const HeroSection = ({ titleKey = 'main.heroTitle', titleSpanKey = 'main.heroTitleSpan', descKey = 'main.heroDesc', platformsKey = 'main.platforms' }) => {
  const { t } = useLocale();
  const platforms = t(platformsKey).split(',');
  const spanText = t(titleSpanKey);

  return (
    <section className="hero-section">
      <h1 className="hero-title">
        {t(titleKey)}{' '}
        {spanText && <span className="gradient-text">{spanText}</span>}
      </h1>
      <p className="hero-desc">
        {t(descKey)}
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
