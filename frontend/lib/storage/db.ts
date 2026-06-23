export const DB_NAME = "astro-app";
export const DB_VERSION = 2;

export const STORES = {
  chartHistory: "chart-history",
  birthProfiles: "birth-profiles",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

function ensureStores(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains(STORES.chartHistory)) {
    const chartStore = db.createObjectStore(STORES.chartHistory, { keyPath: "id" });
    chartStore.createIndex("kind", "kind", { unique: false });
    chartStore.createIndex("savedAt", "savedAt", { unique: false });
  }

  if (!db.objectStoreNames.contains(STORES.birthProfiles)) {
    const profileStore = db.createObjectStore(STORES.birthProfiles, { keyPath: "id" });
    profileStore.createIndex("savedAt", "savedAt", { unique: false });
  }
}

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB 不可用"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error("無法開啟 IndexedDB"));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      ensureStores((event.target as IDBOpenDBRequest).result);
    };
  });
}

export function runTransaction<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = fn(store);

        request.onerror = () => reject(request.error ?? new Error("IndexedDB 操作失敗"));
        request.onsuccess = () => resolve(request.result as T);

        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          reject(tx.error ?? new Error("IndexedDB 交易失敗"));
          db.close();
        };
        tx.onabort = () => {
          reject(tx.error ?? new Error("IndexedDB 交易中止"));
          db.close();
        };
      }),
  );
}
