import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import useLocale from '../hooks/useLocale';

const FaqItem = ({ questionKey, answerKey, isOpen, onToggle }) => {
  const { t } = useLocale();
  const answerRef = useRef(null);
  const [answerHeight, setAnswerHeight] = useState('0px');

  useEffect(() => {
    if (isOpen) {
      const el = answerRef.current;
      if (el) setAnswerHeight(`${el.scrollHeight}px`);
    } else {
      setAnswerHeight('0px');
    }
  }, [isOpen]);

  return (
    <div className="faq-item">
      <button
        type="button"
        className="faq-question fl-between w-100 text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>{t(questionKey)}</span>
        <div className={`faq-toggle ${isOpen ? 'open' : ''}`}>
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>
      <div
        ref={answerRef}
        className={`faq-answer-wrapper ${isOpen ? 'open' : ''}`}
        style={{ maxHeight: answerHeight }}
      >
        <div className="faq-answer">
          <p>{t(answerKey)}</p>
        </div>
      </div>
    </div>
  );
};

const faqItems = [
  { id: 'supported-sites', questionKey: 'faq.q1.question', answerKey: 'faq.q1.answer' },
  { id: 'install', questionKey: 'faq.q2.question', answerKey: 'faq.q2.answer' },
  { id: 'cookies', questionKey: 'faq.q3.question', answerKey: 'faq.q3.answer' },
  { id: 'quality', questionKey: 'faq.q4.question', answerKey: 'faq.q4.answer' },
  { id: 'formats', questionKey: 'faq.q5.question', answerKey: 'faq.q5.answer' },
  { id: 'qr-code', questionKey: 'faq.q6.question', answerKey: 'faq.q6.answer' },
  { id: 'download-speed', questionKey: 'faq.q7.question', answerKey: 'faq.q7.answer' },
  { id: 'storage', questionKey: 'faq.q8.question', answerKey: 'faq.q8.answer' },
  { id: 'captcha', questionKey: 'faq.q9.question', answerKey: 'faq.q9.answer' },
  { id: 'mobile', questionKey: 'faq.q10.question', answerKey: 'faq.q10.answer' }
];

const FaqPage = () => {
  const { t } = useLocale();
  const [openItem, setOpenItem] = useState(null);

  return (
    <main className="page-container fade-in">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">{t('faq.pageTitle')}</h1>
        <p className="c-dim mb-6">{t('faq.subtitle')}</p>

        <div className="faq-accordion">
          {faqItems.map((item) => (
            <FaqItem
              key={item.id}
              questionKey={item.questionKey}
              answerKey={item.answerKey}
              isOpen={openItem === item.id}
              onToggle={() => setOpenItem(openItem === item.id ? null : item.id)}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="btn-secondary inline-flex items-center gap-2">
            {t('faq.backToHome')}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default FaqPage;
