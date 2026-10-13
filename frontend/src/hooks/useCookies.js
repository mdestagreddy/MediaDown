import { useState, useEffect, useCallback } from 'react';
import { putCookie, getCookie, deleteCookie } from '../utils/indexedDB';

const useCookies = () => {
  const [cookieText, setCookieText] = useState('');
  const [cookieInfo, setCookieInfo] = useState({ exists: false, size: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const content = await getCookie();
    setCookieInfo({
      exists: !!content && typeof content === 'string' && content.trim().length > 0,
      size: content && typeof content === 'string' ? content.length : 0
    });
    setLoading(false);
    return content;
  }, []);

  const save = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return { success: false, error: 'Konten cookies tidak boleh kosong.' };
    await putCookie(trimmed);
    setCookieText('');
    await refresh();
    return { success: true };
  }, [refresh]);

  const remove = useCallback(async () => {
    await deleteCookie();
    setCookieText('');
    await refresh();
    return { success: true };
  }, [refresh]);

  const getCookieContent = useCallback(async () => {
    const content = await getCookie();
    return content || null;
  }, []);

  useEffect(() => {
    getCookie().then((content) => {
      setCookieInfo({
        exists: !!content && typeof content === 'string' && content.trim().length > 0,
        size: content && typeof content === 'string' ? content.length : 0
      });
      setLoading(false);
    });
  }, []);

  return {
    cookieText,
    setCookieText,
    cookieInfo,
    loading,
    save,
    remove,
    refresh,
    getCookieContent
  };
};

export default useCookies;
