"use client";

import { SessionContext } from "next-auth/react";
import { useContext, useEffect, useState } from "react";
import {
  CALENDAR_DEFAULT_CHANGED,
  CALENDAR_DEFAULT_STORAGE_KEY,
  type CalendarConnections,
  type CalendarProvider,
  normalizeCalendarProvider,
  readLocalCalendarDefault,
  validCalendarDefault,
  writeLocalCalendarDefault,
} from "@/lib/calendar-preference";

type Preference = { provider: CalendarProvider | null; connections: CalendarConnections | null };
const pendingProfiles = new Map<string, Promise<Preference>>();
const handledChanges = new WeakSet<Event>();

function loadPreference(account: string): Promise<Preference> {
  const pending = pendingProfiles.get(account);
  if (pending) return pending;
  const request = Promise.all([
    fetch("/api/user/profile", { cache: "no-store" }),
    fetch("/api/calendars", { credentials: "include", cache: "no-store" }),
  ])
    .then(async ([profileResponse, connectionsResponse]) => {
      const profile: unknown = profileResponse.ok ? await profileResponse.json() : null;
      const calendars: unknown = connectionsResponse.ok ? await connectionsResponse.json() : null;
      const provider = normalizeCalendarProvider(
        profile && typeof profile === "object" && "preferredProvider" in profile
          ? profile.preferredProvider
          : null,
      );
      const connections =
        calendars && typeof calendars === "object"
          ? {
              apple: "apple" in calendars && Boolean(calendars.apple),
              google: "google" in calendars && Boolean(calendars.google),
              microsoft: "microsoft" in calendars && Boolean(calendars.microsoft),
            }
          : null;
      return { provider, connections };
    })
    .catch(() => ({ provider: null, connections: null }))
    .finally(() => {
      if (pendingProfiles.get(account) === request) pendingProfiles.delete(account);
    });
  pendingProfiles.set(account, request);
  return request;
}

export function useCalendarPreference() {
  // Standalone, public previews may render without a SessionProvider.
  const session = useContext(SessionContext);
  const loading = session?.status === "loading";
  const account = session?.data?.user?.email || "";
  const [preference, setPreference] = useState<(Preference & { account: string }) | null>(null);

  useEffect(() => {
    if (loading) return;
    let revision = 0;
    let mounted = true;
    const refresh = async () => {
      const current = ++revision;
      const next = account
        ? await loadPreference(account)
        : { provider: readLocalCalendarDefault(), connections: null };
      if (mounted && current === revision) setPreference({ ...next, account });
    };
    const onChange = (event: Event) => {
      // Several event controls can be mounted together. Invalidate once per
      // notification so they share the same profile/connection requests.
      if (!handledChanges.has(event)) {
        handledChanges.add(event);
        pendingProfiles.clear();
      }
      void refresh();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === CALENDAR_DEFAULT_STORAGE_KEY) onChange(event);
    };
    void refresh();
    window.addEventListener(CALENDAR_DEFAULT_CHANGED, onChange);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onChange);
    return () => {
      mounted = false;
      window.removeEventListener(CALENDAR_DEFAULT_CHANGED, onChange);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onChange);
    };
  }, [account, loading]);

  const current = !loading && preference?.account === account ? preference : null;
  const provider = validCalendarDefault(
    current?.provider || null,
    Boolean(account),
    current?.connections || null,
  );
  const canRemember = (choice: CalendarProvider) =>
    !loading &&
    Boolean(validCalendarDefault(choice, Boolean(account), current?.connections || null));
  const remember = async (choice: CalendarProvider | null) => {
    if (loading || (choice && !canRemember(choice))) return;
    if (account) {
      try {
        const response = await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferredProvider: choice }),
        });
        if (!response.ok) return;
      } catch {
        return;
      }
    }
    setPreference({ account, provider: choice, connections: current?.connections || null });
    writeLocalCalendarDefault(choice);
  };

  return { provider, canRemember, remember, signedIn: Boolean(account) };
}
