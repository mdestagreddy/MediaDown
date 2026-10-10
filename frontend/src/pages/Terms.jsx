import './Terms.css';
import useLocale from '../hooks/useLocale';

const TermsPage = () => {
  const { t } = useLocale();

  const sections = [
    {
      title: t('terms.toc.usage'),
      body: t('terms.sections.usage')
    },
    {
      title: t('terms.toc.copyright'),
      body: t('terms.sections.copyright')
    },
    {
      title: t('terms.toc.prohibited'),
      body: <ul>
        <li>{t('terms.prohibited.1')}</li>
        <li>{t('terms.prohibited.2')}</li>
        <li>{t('terms.prohibited.3')}</li>
        <li>{t('terms.prohibited.4')}</li>
      </ul>
    },
    {
      title: t('terms.toc.storage'),
      body: t('terms.sections.storage')
    },
    {
      title: t('terms.toc.cookies'),
      body: t('terms.sections.cookies')
    },
    {
      title: t('terms.toc.availability'),
      body: t('terms.sections.availability')
    },
    {
      title: t('terms.toc.disclaimer'),
      body: t('terms.sections.disclaimer')
    },
    {
      title: t('terms.toc.liability'),
      body: t('terms.sections.liability')
    },
    {
      title: t('terms.toc.law'),
      body: t('terms.sections.law')
    }
  ];

  return (
    <article className="terms-content">
      <h1 className="terms-title">{t('terms.pageTitle')}</h1>
      <p className="terms-sub t-justify">
        {t('terms.subtitle')}
      </p>

      <ol className="terms-list">
        {sections.map((s, i) => (
          <li className="terms-item" key={i}>
            <h2 className="terms-h2">{i + 1}. {s.title}</h2>
            <span className="t-justify">{s.body}</span>
          </li>
        ))}
      </ol>
    </article>
  );
};

export default TermsPage;
