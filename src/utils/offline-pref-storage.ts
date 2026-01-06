// src/utils/offline-pref-storage.ts

const META_DB = 'joygrow_meta';
const PREF_STORE = 'prefs';
const OFFLINE_KEY = 'offline_mode';

function openMetaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(META_DB, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PREF_STORE)) {
        db.createObjectStore(PREF_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineModePref(): Promise<boolean> {
  const db = await openMetaDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PREF_STORE, 'readonly');
    const store = tx.objectStore(PREF_STORE);
    const req = store.get(OFFLINE_KEY);

    req.onsuccess = () => {
      // default false if not set
      resolve(req.result === true);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function setOfflineModePref(value: boolean): Promise<void> {
  const db = await openMetaDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PREF_STORE, 'readwrite');
    const store = tx.objectStore(PREF_STORE);
    const req = store.put(value, OFFLINE_KEY);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
