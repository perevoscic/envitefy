"use client";

export type PendingSnapUpload = {
  file: File;
  previewUrl: string | null;
};

type SnapUploadWindow = Window & {
  __pendingSnapUpload?: PendingSnapUpload | null;
};

const DB_NAME = "envitefy-pending-snap-upload";
const STORE_NAME = "uploads";
const RECORD_KEY = "current";

function getRuntimeWindow(): SnapUploadWindow | null {
  if (typeof window === "undefined") return null;
  return window as SnapUploadWindow;
}

async function openPendingUploadDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    throw new Error("IndexedDB is unavailable");
  }

  return await new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB"));
  });
}

async function persistPendingSnapUpload(pending: PendingSnapUpload): Promise<void> {
  const db = await openPendingUploadDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Failed to persist pending upload"));
      tx.onabort = () => reject(tx.error || new Error("Pending upload transaction aborted"));

      store.put(pending, RECORD_KEY);
    });
  } finally {
    db.close();
  }
}

async function readPersistedPendingSnapUpload(): Promise<PendingSnapUpload | null> {
  const db = await openPendingUploadDb();
  try {
    return await new Promise<PendingSnapUpload | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(RECORD_KEY);

      request.onsuccess = () => {
        const result = request.result;
        if (
          result &&
          typeof result === "object" &&
          result.file instanceof File &&
          ("previewUrl" in result
            ? typeof result.previewUrl === "string" || result.previewUrl === null
            : true)
        ) {
          resolve({
            file: result.file,
            previewUrl: typeof result.previewUrl === "string" ? result.previewUrl : null,
          });
          return;
        }
        resolve(null);
      };
      request.onerror = () => reject(request.error || new Error("Failed to read pending upload"));
    });
  } finally {
    db.close();
  }
}

async function clearPersistedPendingSnapUpload(): Promise<void> {
  const db = await openPendingUploadDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Failed to clear pending upload"));
      tx.onabort = () => reject(tx.error || new Error("Pending upload clear aborted"));

      store.delete(RECORD_KEY);
    });
  } finally {
    db.close();
  }
}

export async function savePendingSnapUpload(pending: PendingSnapUpload): Promise<void> {
  const runtimeWindow = getRuntimeWindow();
  if (runtimeWindow) {
    runtimeWindow.__pendingSnapUpload = pending;
  }

  try {
    await persistPendingSnapUpload(pending);
  } catch {
    // Runtime memory fallback is still available in same-tab navigations.
  }
}

export async function takePendingSnapUpload(): Promise<PendingSnapUpload | null> {
  try {
    const persisted = await readPersistedPendingSnapUpload();
    if (persisted) {
      await clearPersistedPendingSnapUpload();
      const runtimeWindow = getRuntimeWindow();
      if (runtimeWindow) {
        delete runtimeWindow.__pendingSnapUpload;
      }
      return persisted;
    }
  } catch {
    // Fall back to same-runtime memory if IndexedDB is unavailable or fails.
  }

  const runtimeWindow = getRuntimeWindow();
  const pending = runtimeWindow?.__pendingSnapUpload ?? null;
  if (runtimeWindow) {
    delete runtimeWindow.__pendingSnapUpload;
  }
  return pending;
}

export async function clearPendingSnapUpload(): Promise<void> {
  const runtimeWindow = getRuntimeWindow();
  if (runtimeWindow) {
    delete runtimeWindow.__pendingSnapUpload;
  }

  try {
    await clearPersistedPendingSnapUpload();
  } catch {
    // ignore
  }
}
