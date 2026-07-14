/**
 * Minimal promise-based IndexedDB helper. Unlike localStorage (~5-10MB per origin,
 * synchronous), IndexedDB gives each origin hundreds of MB to low GB and is fully async —
 * used here so product/loan records (which carry inline base64 banner images, video
 * confirmations, etc.) stop hitting a hard quota wall during normal use.
 *
 * One shared database, one object store per "collection" (mirrors the old one-key-per-
 * collection localStorage layout: products/loans each store their whole array under a
 * single fixed key, while published-config snapshots get their own row per product id).
 */

const DB_NAME = 'caltos_db';
const DB_VERSION = 1;
export const STORE_NAMES = ['products', 'loans', 'published_configs'] as const;
export type StoreName = (typeof STORE_NAMES)[number];

/** Fixed key used for stores that hold a single serialized array as one record. */
export const WHOLE_COLLECTION_KEY = 'all';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORE_NAMES) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function idbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSet(store: StoreName, key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbDelete(store: StoreName, key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
