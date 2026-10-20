import type { CustomEventInformation, CustomEventPage } from "../event-custom-design";
import type { CreateClassification, CreateGuess } from "./create-intent";

export const CREATION_INTAKE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export const CREATION_INTAKES_UPDATED_EVENT = "envitefy:creation-intakes-updated";
export type CreationSource = { kind: "files" | "url" | "text" | "scratch"; files: File[]; text: string; url?: string };
export type CreationIntake = {
  version: 1; id: string; ownerId: string; revision: number; updatedAt: number;
  phase: "source" | "recognizing" | "confirm" | "templates" | "editor";
  source: CreationSource; classification?: CreateClassification; guess?: CreateGuess;
  information?: CustomEventInformation; sourceText?: string; discoveryEventId?: string;
  selectedTemplateId?: string; eventId?: string; customPage?: CustomEventPage;
  /** This identity may already have durable server work, even after a lost response. */
  sourceReadStarted?: boolean;
  editorSnapshot?: Record<string, unknown>;
  editorFamily?: string;
};
type StoredIntake = Omit<CreationIntake, "source"> & { key: string; source: Omit<CreationSource, "files"> & { files: Array<{ blob: Blob; name: string; lastModified: number }> } };
const DATABASE = "envitefy-creation-intakes";
let writes: Promise<unknown> = Promise.resolve();
let writesSuspended = false;
let sessionEpoch = 0;
const retiredOwners = new Set<string>();
const discardedKeys = new Set<string>();
function notifyCreationIntakesUpdated(ownerId?: string): void {
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent(CREATION_INTAKES_UPDATED_EVENT, { detail: { ownerId: ownerId?.toLowerCase() } }));
}
export function suspendCreationIntakeWrites(): void { sessionEpoch++; writesSuspended = true; }
/** Called by the authenticated session boundary, never by a delayed editor callback. */
export function resumeCreationIntakeWrites(ownerId: string): void {
  const epoch = ++sessionEpoch;
  const task = writes.catch(() => {}).then(() => { if (epoch === sessionEpoch) { writesSuspended = false; retiredOwners.delete(ownerId.toLowerCase()); } });
  writes = task;
}

export function creationIntakeOwner(user: unknown): string {
  const value = user && typeof user === "object" ? user as { id?: unknown; email?: unknown } : {};
  return String(value.id || value.email || "").trim().toLowerCase();
}
export function createCreationIntake(ownerId: string, source: CreationSource): CreationIntake {
  if (!ownerId.trim()) throw new Error("Sign in to start an event.");
  return { version: 1, id: crypto.randomUUID(), ownerId: ownerId.toLowerCase(), revision: 0, updatedAt: Date.now(), phase: "source", source };
}
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("intakes", { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Browser recovery storage is unavailable. Keep this tab open and retry."));
    request.onblocked = () => reject(new Error("Close other Envitefy tabs and retry browser recovery storage."));
  });
}
const keyFor = (ownerId: string, id: string) => `${ownerId.toLowerCase()}:${id}`;
const valid = (row: StoredIntake, ownerId: string) => row.version === 1 && row.ownerId === ownerId.toLowerCase() && Date.now() - row.updatedAt <= CREATION_INTAKE_MAX_AGE;
function restore(row: StoredIntake): CreationIntake {
  const { key: _key, ...intake } = row;
  return { ...intake, source: { ...row.source, files: row.source.files.map(({ blob, name, lastModified }) => new File([blob], name, { type: blob.type, lastModified })) } };
}
/** Serialized writes and a transaction revision check prevent older async results replacing newer choices. */
export function writeCreationIntake(intake: CreationIntake): Promise<CreationIntake> {
  const captured = structuredClone(intake);
  const task = writes.catch(() => {}).then(async () => {
    if (writesSuspended || retiredOwners.has(captured.ownerId.toLowerCase()) || discardedKeys.has(keyFor(captured.ownerId, captured.id))) throw new Error("This browser creation was discarded or signed out. Start again from Create.");
    const db = await openDatabase();
    try {
      return await new Promise<CreationIntake>((resolve, reject) => {
        const tx = db.transaction("intakes", "readwrite"), store = tx.objectStore("intakes");
        const key = keyFor(captured.ownerId, captured.id), existing = store.get(key);
        let saved: CreationIntake;
        existing.onsuccess = () => {
          const row = existing.result as StoredIntake | undefined;
          if (row && captured.revision < row.revision) { saved = restore(row); return; }
          saved = { ...captured, revision: (row?.revision ?? captured.revision) + 1, updatedAt: Date.now() };
          store.put({ ...saved, key, source: { ...saved.source, files: saved.source.files.map(file => ({ blob: file, name: file.name, lastModified: file.lastModified })) } } satisfies StoredIntake);
        };
        tx.oncomplete = () => resolve(saved);
        tx.onerror = tx.onabort = () => reject(tx.error || new Error("Your progress could not be retained. Keep this tab open and retry."));
      });
    } finally { db.close(); }
  });
  writes = task;
  return task.then((saved) => { notifyCreationIntakesUpdated(saved.ownerId); return saved; });
}
export async function listCreationIntakes(ownerId: string): Promise<CreationIntake[]> {
  await writes.catch(() => {});
  if (!ownerId) return [];
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("intakes", "readwrite"), store = tx.objectStore("intakes"), request = store.getAll();
      let result: CreationIntake[] = [];
      request.onsuccess = () => {
        const rows = request.result as StoredIntake[];
        for (const row of rows) if (row.version !== 1 || Date.now() - row.updatedAt > CREATION_INTAKE_MAX_AGE) store.delete(row.key);
        result = rows.filter(row => valid(row, ownerId)).map(restore).sort((a, b) => b.updatedAt - a.updatedAt);
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error("Your browser progress could not be restored."));
    });
  } finally { db.close(); }
}
export async function readCreationIntake(ownerId: string, id: string): Promise<CreationIntake | null> {
  return (await listCreationIntakes(ownerId)).find(row => row.id === id) || null;
}
export function attachCreationIntakeEvent(ownerId: string, id: string, eventId: string): Promise<void> {
  const task = writes.catch(() => {}).then(async () => {
    if (writesSuspended || retiredOwners.has(ownerId.toLowerCase()) || discardedKeys.has(keyFor(ownerId, id))) return;
    const db = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("intakes", "readwrite"), store = tx.objectStore("intakes"), request = store.get(keyFor(ownerId, id));
        request.onsuccess = () => { const row = request.result as StoredIntake | undefined; if (row && valid(row, ownerId)) store.put({ ...row, eventId, revision: row.revision + 1, updatedAt: Date.now() }); };
        tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  });
  writes = task; return task.then(() => notifyCreationIntakesUpdated(ownerId));
}
export function clearCreationIntakes(ownerId?: string): Promise<void> {
  if (ownerId) retiredOwners.add(ownerId.toLowerCase());
  const task = writes.catch(() => {}).then(async () => {
    const db = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("intakes", "readwrite"), store = tx.objectStore("intakes"), request = store.getAll();
        request.onsuccess = () => { for (const row of request.result as StoredIntake[]) if (!ownerId || row.ownerId === ownerId.toLowerCase()) { discardedKeys.add(row.key); retiredOwners.add(row.ownerId); store.delete(row.key); } };
        tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  });
  writes = task; return task.then(() => notifyCreationIntakesUpdated(ownerId));
}
export function deleteCreationIntake(ownerId: string, id: string): Promise<void> {
  const key = keyFor(ownerId, id); discardedKeys.add(key);
  const task = writes.catch(() => {}).then(async () => {
    const db = await openDatabase();
    try { await new Promise<void>((resolve, reject) => { const tx = db.transaction("intakes", "readwrite"); tx.objectStore("intakes").delete(key); tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error); }); }
    finally { db.close(); }
  });
  writes = task; return task.then(() => notifyCreationIntakesUpdated(ownerId));
}
