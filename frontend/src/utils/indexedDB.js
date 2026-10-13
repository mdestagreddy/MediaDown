const DB_NAME = 'MediaDownDB';
const DB_VERSION = 1;
const COOKIE_STORE_NAME = 'cookies';
const COOKIE_STORE_KEY = 'global';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(COOKIE_STORE_NAME)) {
        db.createObjectStore(COOKIE_STORE_NAME);
      }
    };
  });
}

async function putCookie(content) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COOKIE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(COOKIE_STORE_NAME);
    store.put(content, COOKIE_STORE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getCookie() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COOKIE_STORE_NAME, 'readonly');
    const store = tx.objectStore(COOKIE_STORE_NAME);
    const req = store.get(COOKIE_STORE_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteCookie() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COOKIE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(COOKIE_STORE_NAME);
    store.delete(COOKIE_STORE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export { putCookie, getCookie, deleteCookie };
