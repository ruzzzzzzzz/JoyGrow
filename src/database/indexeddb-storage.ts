// indexeddb-storage.ts
const DB_NAME = 'joygrow_sqlite_db';
const STORE_NAME = 'sqlite_files';
const KEY = 'main';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadSQLiteFile(): Promise<Uint8Array | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(KEY);

    req.onsuccess = () => {
      const result = req.result as ArrayBuffer | undefined;
      resolve(result ? new Uint8Array(result) : null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveSQLiteFile(data: Uint8Array): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(data.buffer, KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
