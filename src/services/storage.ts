/**
 * Simple IndexedDB wrapper to handle large data storage (like base64 images)
 * that exceed localStorage quotas.
 */

const DB_NAME = 'NanoVerseDB';
const COLLECTION_STORE = 'collection';
const ICONS_STORE = 'icons';
const DB_VERSION = 2;

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(COLLECTION_STORE)) {
        db.createObjectStore(COLLECTION_STORE);
      }
      if (!db.objectStoreNames.contains(ICONS_STORE)) {
        db.createObjectStore(ICONS_STORE);
      }
    };
  });
}

export async function saveCollection(collection: any[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([COLLECTION_STORE], 'readwrite');
    const store = transaction.objectStore(COLLECTION_STORE);
    const request = store.put(collection, 'current-collection');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function loadCollection(): Promise<any[] | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([COLLECTION_STORE], 'readonly');
    const store = transaction.objectStore(COLLECTION_STORE);
    const request = store.get('current-collection');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function saveIcon(type: string, base64: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ICONS_STORE], 'readwrite');
    const store = transaction.objectStore(ICONS_STORE);
    const request = store.put(base64, type);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function loadIcon(type: string): Promise<string | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ICONS_STORE], 'readonly');
    const store = transaction.objectStore(ICONS_STORE);
    const request = store.get(type);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function clearAllData(): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([COLLECTION_STORE, ICONS_STORE], 'readwrite');
    const collectionStore = transaction.objectStore(COLLECTION_STORE);
    const iconsStore = transaction.objectStore(ICONS_STORE);
    
    collectionStore.clear();
    iconsStore.clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
