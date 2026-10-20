"use client";
import { useMemo } from "react";
import type { EventEditorRecord } from "./event-editor";
import { readEventResponse } from "./event-response";

/** Only generated-image job bookkeeping may advance without an authored edit. */
function sameAuthoredEvent(before: EventEditorRecord, after: EventEditorRecord): boolean {
  if (JSON.stringify(before.data.importedThemeArtwork) === JSON.stringify(after.data.importedThemeArtwork)) return false;
  const content = (row: EventEditorRecord) => JSON.stringify({
    title: row.title,
    data: Object.fromEntries(Object.entries(row.data).filter(([key]) => key !== "importedThemeArtwork")),
  });
  return before.id === after.id && content(before) === content(after);
}

/** A revision map per editor keeps background reads from replacing its saved baseline. */
export function createEventHistoryClient() {
  const revisions = new Map<string, string>();
  const records = new Map<string, EventEditorRecord>();
  return {
    async fetch(input: string, options: RequestInit = {}): Promise<Response> {
      const method = (options.method || "GET").toUpperCase();
      const key = input.split("?")[0].replace(/^\/api\/events\/([^/]+)\/public-slug$/, "/api/history/$1");
      const headers = new Headers(options.headers);
      const revision = revisions.get(key);
      let body = options.body;
      if (method === "PATCH") {
        // Vercel interprets If-Match as an HTTP entity precondition. Event
        // revisions belong to the application's JSON contract instead.
        const suppliedRevision = headers.get("If-Match")?.replace(/^"|"$/g, "");
        const expectedRevision = suppliedRevision || revision;
        if (expectedRevision) {
          const payload = typeof body === "string" ? JSON.parse(body) : {};
          body = JSON.stringify({ ...payload, expectedRevision: payload.expectedRevision ?? expectedRevision });
          headers.set("Content-Type", "application/json");
        }
        headers.delete("If-Match");
      }
      let response = await fetch(input, { ...options, body, headers });
      let row = await readEventResponse(response.clone());
      const baseline = records.get(key);
      if (method === "PATCH" && response.status === 409 && row?.code === "event_changed" && baseline?.revision && typeof body === "string") {
        const payload = JSON.parse(body);
        // A recovered draft can carry an older revision than the loaded record.
        // Never reinterpret that older authored baseline as current content.
        if (payload.expectedRevision === baseline.revision) {
          try {
            const latestResponse = await fetch(key, { credentials: options.credentials, cache: "no-store" });
            const latest = await readEventResponse(latestResponse);
            if (latestResponse.ok && typeof latest?.revision === "string" && latest.data && sameAuthoredEvent(baseline, latest as EventEditorRecord)) {
              // Keep server job state; the editor's image URL remains an explicit change.
              if (payload.data && typeof payload.data === "object") delete payload.data.importedThemeArtwork;
              body = JSON.stringify({ ...payload, expectedRevision: latest.revision });
              response = await fetch(input, { ...options, body, headers });
              row = await readEventResponse(response.clone());
            }
          } catch {
            // Retain the original conflict and editor baseline if refresh fails.
          }
        }
      }
      if (response.ok) {
        if (typeof row?.revision === "string" && typeof row.id === "string") {
          const eventKey = `/api/history/${encodeURIComponent(row.id)}`;
          if (method !== "GET" || !revisions.has(eventKey)) revisions.set(eventKey, row.revision);
          if (method !== "GET" || !revisions.has(key)) revisions.set(key, row.revision);
        }
        if (typeof row?.id === "string" && row.data && typeof row.data === "object" && !Array.isArray(row.data)) {
          const eventKey = `/api/history/${encodeURIComponent(row.id)}`;
          if (method !== "GET" || !records.has(eventKey)) records.set(eventKey, row as EventEditorRecord);
        }
      }
      return response;
    },
    clear(input: string) {
      revisions.delete(input.split("?")[0]);
      records.delete(input.split("?")[0]);
    },
    read(input: string): EventEditorRecord | null {
      return records.get(input.split("?")[0]) || null;
    },
    remember(input: string, revision: string) {
      revisions.set(input.split("?")[0], revision);
    },
  };
}
export function useEventHistoryClient() {
  return useMemo(createEventHistoryClient, []);
}
