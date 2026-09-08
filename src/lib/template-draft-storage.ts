export const TEMPLATE_DRAFT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export type DraftValue = null | boolean | number | string | DraftValue[] | { [key: string]: DraftValue };
export type EditorSnapshot = Record<string, DraftValue>;
export type TemplateDraft = {
  version: 1;
  id: string;
  category: string;
  templateId: string;
  updatedAt: number;
  snapshot: EditorSnapshot;
  assets: Record<string, Blob>;
  eventId?: string;
  pendingSave?: boolean;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("envitefy-template-drafts", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Browser draft storage is unavailable."));
    request.onblocked = () => reject(new Error("Close other Envitefy tabs and retry draft storage."));
  });
}
export async function writeTemplateDraft(draft: TemplateDraft): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite");
      tx.objectStore("drafts").put(draft);
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(tx.error || new Error("Could not retain this draft in your browser."));
    });
  } finally { db.close(); }
}
export async function readTemplateDraft(category: string, id?: string): Promise<TemplateDraft | null> {
  const db = await openDatabase();
  try {
    return await new Promise<TemplateDraft | null>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite");
      const store = tx.objectStore("drafts");
      const request = store.getAll();
      let result: TemplateDraft | null = null;
      request.onsuccess = () => {
        const rows = request.result as TemplateDraft[];
        const now = Date.now();
        for (const row of rows) if (row.version !== 1 || now - row.updatedAt > TEMPLATE_DRAFT_MAX_AGE) store.delete(row.id);
        result = rows.filter((row) => row.version === 1 && now - row.updatedAt <= TEMPLATE_DRAFT_MAX_AGE && row.category === category && (!id || row.id === id))
          .sort((a, b) => b.updatedAt - a.updatedAt)[0] || null;
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error("Could not restore your draft."));
    });
  } finally { db.close(); }
}
export async function deleteTemplateDraft(id: string) {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite");
      tx.objectStore("drafts").delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

/** Preserve blob contents, not object URLs whose lifetime ends at the next reload. */
export async function retainDraftMedia(snapshot: EditorSnapshot, assets: Record<string, Blob>) {
  async function visit(value: DraftValue): Promise<DraftValue> {
    if (typeof value === "string" && /^(blob:|data:image\/)/.test(value)) {
      if (!assets[value]) {
        const response = await fetch(value);
        if (!response.ok) throw new Error("A photo could not be retained. Please choose it again.");
        assets[value] = await response.blob();
      }
    } else if (Array.isArray(value)) {
      await Promise.all(value.map(visit));
    } else if (value && typeof value === "object") {
      await Promise.all(Object.values(value).map(visit));
    }
    return value;
  }
  await visit(snapshot);
}
export function replaceDraftMedia(snapshot: EditorSnapshot, replacements: Record<string, string>): EditorSnapshot {
  function visit(value: DraftValue): DraftValue {
    if (typeof value === "string") return replacements[value] || value;
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, visit(entry)]));
    return value;
  }
  return visit(snapshot) as EditorSnapshot;
}
