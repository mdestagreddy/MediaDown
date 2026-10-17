import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import MainPage from './pages/MainPage';
import { useTheme } from './hooks/useTheme';
import { fetchJson } from './utils/api';
import LocaleProvider from './contexts/LocaleProvider';
import ColorAccentProvider from './contexts/ColorAccentProvider';
import useCookies from './hooks/useCookies';

const PostsPage = lazy(() => import('./pages/PostsPage'));
const TermsPage = lazy(() => import('./pages/Terms'));
const FaqPage = lazy(() => import('./pages/Faq'));
const QrModal = lazy(() => import('./components/QrModal'));
const CookieModal = lazy(() => import('./components/CookieModal'));

function App() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  // Network Info (LAN IP for cross device)
  const [networkInfo, setNetworkInfo] = useState(null);

  // Cookies / Anti-Bot status (stored in IndexedDB per-browser)
  const {
    cookieText,
    setCookieText,
    cookieInfo,
    save: saveCookies,
    remove: deleteCookies,
    getCookieContent
  } = useCookies();

  // Cross-device QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrData, setQrData] = useState(null);

  const [showCookieModal, setShowCookieModal] = useState(false);
  const [cookieModalVisible, setCookieModalVisible] = useState(false);
  const [isSavingCookies, setIsSavingCookies] = useState(false);
  const [cookieStatusMsg, setCookieStatusMsg] = useState('');

  // Fetch network info on mount
  useEffect(() => {
    fetchJson('/api/network-info')
      .then(data => setNetworkInfo(data))
      .catch(err => console.error('Gagal mengambil info jaringan:', err));
  }, []);

  const openCookieModal = useCallback(() => {
    setCookieStatusMsg('');
    setShowCookieModal(true);
    setTimeout(() => setCookieModalVisible(true), 10);
  }, []);

  const closeCookieModal = useCallback(() => {
    setCookieModalVisible(false);
    setTimeout(() => setShowCookieModal(false), 250);
  }, []);

  const openQrModal = useCallback(() => {
    setShowQrModal(true);
    setTimeout(() => setQrModalVisible(true), 10);
  }, []);

  const closeQrModal = useCallback(() => {
    setQrModalVisible(false);
    setTimeout(() => setShowQrModal(false), 250);
  }, []);

  const onQrDataFetched = useCallback((data) => {
    setQrData(data);
  }, []);

  const handleSaveCookies = useCallback(async () => {
    if (!cookieText.trim()) return;
    setIsSavingCookies(true);
    setCookieStatusMsg('');
    try {
      const result = await saveCookies(cookieText);
      if (result.success) {
        setCookieStatusMsg('✅ Cookies berhasil disimpan di browser!');
      } else {
        setCookieStatusMsg('❌ Gagal: ' + result.error);
      }
    } catch (err) {
      setCookieStatusMsg('❌ Gagal menyimpan cookies: ' + err.message);
    } finally {
      setIsSavingCookies(false);
    }
   }, [cookieText, saveCookies]);

  const handleDeleteCookies = useCallback(async () => {
    try {
      await deleteCookies();
      setCookieStatusMsg('🗑️ Cookies berhasil dihapus.');
    } catch (err) {
      setCookieStatusMsg('❌ Gagal menghapus cookies: ' + err.message);
    }
  }, [deleteCookies]);

   const handleCookieFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCookieText(event.target.result);
    };
    reader.readAsText(file);
  }, [setCookieText]);

  // Auto scroll to top on route change
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <LocaleProvider>
      <ColorAccentProvider>
      <div className="app-container">
        <Header
          cookieInfo={cookieInfo}
          onOpenCookieModal={openCookieModal}
          networkInfo={networkInfo}
          theme={theme}
          resolvedTheme={resolvedTheme}
          onToggleTheme={toggleTheme}
        />

        <Suspense>
          <Routes>
            <Route
              path="/"
              element={(
             <MainPage
                  openQrModal={openQrModal}
                  onQrDataFetched={onQrDataFetched}
                  onOpenCookieModal={openCookieModal}
                  getCookieContent={getCookieContent}
                />
             )}
            />
             <Route path="terms" element={<TermsPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="posts" element={<PostsPage openQrModal={openQrModal} onQrDataFetched={onQrDataFetched} getCookieContent={getCookieContent} />} />
          </Routes>
        </Suspense>
      </div>

      {/* Cross-Device QR Code Modal (global, available on all pages) */}
      {showQrModal && (
        <Suspense>
          <QrModal
            qrData={qrData}
            networkInfo={networkInfo}
            visible={qrModalVisible}
            onClose={closeQrModal}
          />
        </Suspense>
      )}

      {/* Anti-Bot & Cookies Settings Modal (global, available on all pages) */}
      {showCookieModal && (
        <Suspense>
          <CookieModal
            cookieInfo={cookieInfo}
            cookieText={cookieText}
            setCookieText={setCookieText}
            isSavingCookies={isSavingCookies}
            cookieStatusMsg={cookieStatusMsg}
            onSave={handleSaveCookies}
            onDelete={handleDeleteCookies}
            onFileUpload={handleCookieFileUpload}
            visible={cookieModalVisible}
            onClose={closeCookieModal}
          />
        </Suspense>
      )}

      <Footer />
      </ColorAccentProvider>
      </LocaleProvider>
  );
}

export default App;
