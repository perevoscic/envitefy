"use client";
import { useMemo } from "react";

/** A revision map per editor keeps background reads from replacing its saved baseline. */
export function createEventHistoryClient() {
  const revisions = new Map<string, string>();
  return {
    async fetch(input: string, options: RequestInit = {}): Promise<Response> {
      const method = (options.method || "GET").toUpperCase();
      const key = input.split("?")[0];
      const headers = new Headers(options.headers);
      const revision = revisions.get(key);
      if (method === "PATCH" && revision) headers.set("If-Match", revision);
      const response = await fetch(input, { ...options, headers });
      if (response.ok) {
        const row = await response
          .clone()
          .json()
          .catch(() => null);
        if (typeof row?.revision === "string" && typeof row.id === "string") {
          const eventKey = `/api/history/${encodeURIComponent(row.id)}`;
          if (method !== "GET" || !revisions.has(eventKey)) revisions.set(eventKey, row.revision);
          if (method !== "GET" || !revisions.has(key)) revisions.set(key, row.revision);
        }
      }
      return response;
    },
    clear(input: string) {
      revisions.delete(input.split("?")[0]);
    },
    remember(input: string, revision: string) {
      revisions.set(input.split("?")[0], revision);
    },
  };
}
export function useEventHistoryClient() {
  return useMemo(createEventHistoryClient, []);
}
