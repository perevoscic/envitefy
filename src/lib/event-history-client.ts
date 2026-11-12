"use client";
import { useMemo } from "react";
import type { EventEditorRecord } from "./event-editor";
import { readEventResponse } from "./event-response";
import { supportsEventCollaboration } from "./event-collaboration-types";

function stableContent(value: unknown): string {
  return JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
      : item,
  );
}

function sameMeetImport(before: EventEditorRecord, after: EventEditorRecord): boolean {
  const previous = before.data.pipelineSummary as { discoveryId?: string } | undefined;
  const current = after.data.pipelineSummary as { discoveryId?: string } | undefined;
  return before.data.createdVia === "meet-discovery-v2" && after.data.createdVia === "meet-discovery-v2" &&
    Boolean(previous?.discoveryId && previous.discoveryId === current?.discoveryId);
}

function completedArtwork(row: EventEditorRecord): string | undefined {
  const job = row.data.importedThemeArtwork as { themeId?: string; status?: string; imageUrl?: string } | undefined;
  const theme = row.data.importedTheme as { id?: string; artworkUrl?: string } | undefined;
  return job?.status === "ready" && job.themeId === theme?.id && job.imageUrl && job.imageUrl === theme?.artworkUrl
    ? job.imageUrl : undefined;
}

/** Background progress and a verified image result can advance without an authored edit. */
function sameAuthoredEvent(before: EventEditorRecord, after: EventEditorRecord): boolean {
  const image = completedArtwork(after);
  const previousTheme = before.data.importedTheme as { id?: string; artworkUrl?: string } | undefined;
  const currentTheme = after.data.importedTheme as { id?: string } | undefined;
  const generatedImage = image && previousTheme?.id === currentTheme?.id;
  const jobChanged = stableContent(before.data.importedThemeArtwork) !== stableContent(after.data.importedThemeArtwork);
  const progressChanged = sameMeetImport(before, after) && stableContent(before.data.pipelineSummary) !== stableContent(after.data.pipelineSummary);
  if (!jobChanged && !progressChanged && !(generatedImage && previousTheme?.artworkUrl !== image)) return false;
  const content = (row: EventEditorRecord) => stableContent({
    title: row.title,
    data: Object.fromEntries(Object.entries(row.data)
      .filter(([key]) => key !== "importedThemeArtwork" && !(key === "pipelineSummary" && sameMeetImport(before, after)))
      .map(([key, value]) => [key, key === "importedTheme" && generatedImage
        ? Object.fromEntries(Object.entries(value as object).filter(([name]) => name !== "artworkUrl")) : value])),
  });
  return before.id === after.id && content(before) === content(after);
}

const importConflict = Symbol("import-conflict");

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sameValue(left: unknown, right: unknown): boolean {
  return stableContent(left) === stableContent(right);
}

/** Retain newer unchanged fields and this editor's changes; overlapping edits stay a conflict. */
function reconcileValue(base: unknown, mine: unknown, theirs: unknown): unknown {
  if (sameValue(mine, theirs) || sameValue(theirs, base)) return mine;
  if (sameValue(mine, base)) return theirs;
  if (isPlainObject(mine) && isPlainObject(theirs) && (base === undefined || isPlainObject(base))) {
    const baseRecord = isPlainObject(base) ? base : {};
    const merged: Record<string, unknown> = {};
    for (const key of new Set([...Object.keys(baseRecord), ...Object.keys(mine), ...Object.keys(theirs)])) {
      const value = reconcileValue(baseRecord[key], mine[key], theirs[key]);
      if (value === importConflict) return importConflict;
      if (value !== undefined || Object.hasOwn(mine, key) || Object.hasOwn(theirs, key)) merged[key] = value;
    }
    return merged;
  }
  return importConflict;
}

function mismatchedArtwork(row: EventEditorRecord): boolean {
  const job = row.data.importedThemeArtwork as { themeId?: string; status?: string; imageUrl?: string } | undefined;
  const theme = row.data.importedTheme as { id?: string; artworkUrl?: string } | undefined;
  return job?.status === "ready" && Boolean(job.imageUrl) && Boolean(theme?.artworkUrl) && job.themeId === theme?.id && job.imageUrl !== theme?.artworkUrl;
}

function reconcileEventSave(payload: Record<string, any>, baseline: EventEditorRecord, latest: EventEditorRecord): boolean {
  if (baseline.id !== latest.id || !supportsEventCollaboration(baseline.data) ||
    !supportsEventCollaboration(latest.data) || baseline.data.signupForm || latest.data.signupForm ||
    mismatchedArtwork(latest) || !isPlainObject(payload.data)) return false;
  // A different discovery run is a different authored baseline, not another host edit.
  if ((baseline.data.createdVia === "meet-discovery-v2" || latest.data.createdVia === "meet-discovery-v2") && !sameMeetImport(baseline, latest)) return false;
  const data: Record<string, unknown> = {};
  for (const [key, mine] of Object.entries(payload.data)) {
    if (key === "importedThemeArtwork" || (key === "pipelineSummary" && sameMeetImport(baseline, latest))) continue;
    // History PATCH is shallow: omitted top-level fields retain their latest values.
    const value = reconcileValue(baseline.data[key], mine, latest.data[key]);
    if (value === importConflict) return false;
    data[key] = value;
  }
  if ("title" in payload) {
    const title = reconcileValue(baseline.title, payload.title, latest.title);
    if (title === importConflict) return false;
    payload.title = title;
  }
  payload.data = data;
  return true;
}

function retainBackgroundResults(payload: Record<string, any>, before: EventEditorRecord, after: EventEditorRecord) {
  if (!payload.data || typeof payload.data !== "object") return;
  delete payload.data.importedThemeArtwork;
  if (sameMeetImport(before, after)) delete payload.data.pipelineSummary;
  const image = completedArtwork(after);
  const previousTheme = before.data.importedTheme as { id?: string; artworkUrl?: string } | undefined;
  if (!image || !previousTheme) return;
  const retainImage = (theme: { id?: string; artworkUrl?: string } | undefined) => {
    if (theme && theme.id === previousTheme.id && theme.artworkUrl === previousTheme.artworkUrl)
      theme.artworkUrl = image;
  };
  // Preserve an explicit replacement or clear; only advance an unchanged image.
  retainImage(payload.data.importedTheme);
  retainImage(payload.data.templateEditor?.snapshot?.data?.importedTheme);
  retainImage(payload.data.manualEditor?.snapshot?.data?.importedTheme);
}

/** A revision map per editor keeps background reads from replacing its saved baseline. */
export function createEventHistoryClient() {
  const revisions = new Map<string, string>();
  const records = new Map<string, EventEditorRecord>();
  // A merged save can retain fields that this mounted editor has not rendered yet.
  const editorViews = new Map<string, EventEditorRecord>();
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
      const baseline = records.get(key);
      const submitted = method === "PATCH" && typeof body === "string" ? JSON.parse(body) : null;
      const editorView = editorViews.get(key) || baseline;
      let merged = editorViews.has(key);
      if (merged && baseline?.revision && editorView && submitted?.expectedRevision === baseline.revision && isPlainObject(submitted.data)) {
        const payload = structuredClone(submitted);
        if (!reconcileEventSave(payload, editorView, baseline))
          return Response.json({ code: "event_changed", error: "This event changed in another editor. Your edits are still here; reopen the latest event before saving." }, { status: 409 });
        body = JSON.stringify(payload);
      }
      let response = await fetch(input, { ...options, body, headers });
      let row = await readEventResponse(response.clone());
      if (method === "PATCH" && response.status === 409 && row?.code === "event_changed" && baseline?.revision && typeof body === "string") {
        const payload = JSON.parse(body);
        // A recovered draft can carry an older revision than the loaded record.
        // Never reinterpret that older authored baseline as current content.
        if (payload.expectedRevision === baseline.revision) {
          try {
            const latestResponse = await fetch(key, { credentials: options.credentials, cache: "no-store" });
            const latest = await readEventResponse(latestResponse);
            const current = latest as EventEditorRecord;
            if (latestResponse.ok && typeof latest?.revision === "string" && latest.data && (sameAuthoredEvent(baseline, current) || reconcileEventSave(payload, baseline, current))) {
              retainBackgroundResults(payload, baseline, current);
              body = JSON.stringify({ ...payload, expectedRevision: latest.revision });
              response = await fetch(input, { ...options, body, headers });
              row = await readEventResponse(response.clone());
              merged = true;
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
          if (method === "PATCH" && merged && submitted && editorView) editorViews.set(eventKey, {
            ...row as EventEditorRecord,
            title: submitted.title ?? editorView.title,
            data: { ...editorView.data, ...submitted.data },
          });
        }
      }
      return response;
    },
    clear(input: string) {
      revisions.delete(input.split("?")[0]);
      records.delete(input.split("?")[0]);
      editorViews.delete(input.split("?")[0]);
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
