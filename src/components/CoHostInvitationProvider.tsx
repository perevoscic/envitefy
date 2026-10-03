"use client";

import { Bell, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PendingCoHostInvitation } from "@/lib/event-collaboration-types";

type InvitationState = {
  invitations: PendingCoHostInvitation[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  remove: (id: string) => void;
};
const empty: InvitationState = {
  invitations: [],
  loading: false,
  error: null,
  refresh: async () => {},
  remove: () => {},
};
const Context = createContext<InvitationState>(empty);
export const useCoHostInvitations = () => useContext(Context);

export default function CoHostInvitationProvider({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const { data: session, status } = useSession();
  const identity =
    active && status === "authenticated" ? session?.user?.email?.trim().toLowerCase() || "" : "";
  const [snapshot, setSnapshot] = useState<{
    identity: string;
    invitations: PendingCoHostInvitation[];
  }>({ identity: "", invitations: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<PendingCoHostInvitation | null>(null);
  const seen = useRef(new Set<string>());
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (!identity) return;
    setSnapshot((current) => ({
      ...current,
      invitations: current.invitations.filter(
        (invite) => Date.parse(invite.expiresAt) > Date.now(),
      ),
    }));
    setNotice((current) =>
      current && Date.parse(current.expiresAt) > Date.now() ? current : null,
    );
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort("timeout"), 15_000);
    setLoading(true);
    try {
      const response = await fetch("/api/cohost-invitations", {
        cache: "no-store",
        signal: controller.signal,
      });
      const result = await response.json();
      if (request.current !== controller) return;
      if (response.status === 401 || response.status === 403) {
        setSnapshot({ identity, invitations: [] });
        setNotice(null);
      }
      if (!response.ok) throw new Error(result.error || "Co-host invitations could not be loaded.");
      const invitations: PendingCoHostInvitation[] = result.invitations.filter(
        (invite: PendingCoHostInvitation) => Date.parse(invite.expiresAt) > Date.now(),
      );
      setSnapshot({ identity, invitations });
      setError(null);
      const fresh = invitations.find((invite) => !seen.current.has(invite.id));
      for (const invite of invitations) seen.current.add(invite.id);
      if (fresh) setNotice(fresh);
      else
        setNotice((current) =>
          current && invitations.some((invite) => invite.id === current.id) ? current : null,
        );
    } catch (cause) {
      if (
        request.current !== controller ||
        (controller.signal.aborted && controller.signal.reason !== "timeout")
      )
        return;
      setError(
        controller.signal.reason === "timeout"
          ? "Co-host invitations took too long to load. Try again."
          : cause instanceof Error
            ? cause.message
            : "Co-host invitations could not be loaded.",
      );
    } finally {
      window.clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
      }
    }
  }, [identity]);

  useEffect(() => {
    seen.current.clear();
    setSnapshot({ identity, invitations: [] });
    setNotice(null);
    setError(null);
    setLoading(false);
    if (!identity) return;
    void refresh();
    const update = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(update, 30_000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
      request.current?.abort();
      request.current = null;
    };
  }, [identity, refresh]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5_000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const remove = useCallback((id: string) => {
    // Stop an older list read from restoring an invitation that was just accepted.
    request.current?.abort();
    request.current = null;
    setLoading(false);
    setSnapshot((current) => ({
      ...current,
      invitations: current.invitations.filter((invite) => invite.id !== id),
    }));
    setNotice((current) => (current?.id === id ? null : current));
  }, []);
  const invitations =
    snapshot.identity === identity && identity ? snapshot.invitations : empty.invitations;
  const value = useMemo(
    () => ({
      invitations,
      loading: Boolean(identity) && loading,
      error: identity ? error : null,
      refresh,
      remove,
    }),
    [invitations, identity, loading, error, refresh, remove],
  );
  return (
    <Context.Provider value={value}>
      {children}
      {identity && snapshot.identity === identity && notice ? (
        <aside
          aria-label="New co-host invitation"
          className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-[90] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-indigo-200 bg-white p-4 text-slate-900 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <Bell size={20} aria-hidden="true" className="mt-3 shrink-0 text-indigo-600" />
            <div className="min-w-0 flex-1">
              <p role="status" className="break-words text-sm leading-6">
                <strong>{notice.ownerName}</strong> invited you to co-host{" "}
                <strong>{notice.eventTitle}</strong>.
              </p>
              <Link
                href="/#dashboard-cohost-invitations"
                onClick={() => {
                  setNotice(null);
                  // Same-page hash links do not fire hashchange; open the dashboard bell directly.
                  window.dispatchEvent(new Event("envitefy:open-cohost-invitations"));
                }}
                className="inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                View invitations
              </Link>
            </div>
            <button
              type="button"
              aria-label="Dismiss invitation notification"
              onClick={() => setNotice(null)}
              className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </aside>
      ) : null}
    </Context.Provider>
  );
}
