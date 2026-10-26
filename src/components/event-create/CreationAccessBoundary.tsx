"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useCreationAccess } from "@/hooks/useCreationAccess";
import { creationAllowed, type CreationProduct } from "@/lib/creation-access";
/** Explains unavailable new creation without changing source, route, or saved-event access. */
export default function CreationAccessBoundary({ product, category, eventId, children }: { product: CreationProduct; category?: string | null; eventId?: string | null; children: ReactNode }) {
  const { data: session, status } = useSession();
  const creation = useCreationAccess();
  const [existing, setExisting] = useState<{ id: string; identity: string; allowed: boolean } | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const admitted = useRef("");
  const guestWorkspace = useRef("");
  const owner = useRef({ identity: "", generation: 0 });
  const identity = session?.user?.email || (session?.user as { id?: string } | undefined)?.id || "";
  // Adopting a guest draft keeps its mounted fields. A later account change or
  // sign-out starts a fresh workspace before another account can see them.
  if ((status === "authenticated" && owner.current.identity && owner.current.identity !== identity) ||
      (status === "unauthenticated" && owner.current.identity)) {
    owner.current.generation += 1;
    guestWorkspace.current = "";
    admitted.current = "";
  }
  if (status === "authenticated") owner.current.identity = identity;
  else if (status === "unauthenticated") owner.current.identity = "";
  const guestWorkspaceKey = `${product}:${category || ""}`;
  const workspaceKey = `${identity}:${product}:${category || ""}:${eventId || ""}`;
  const workspace = (warning = "") => <Fragment key={owner.current.generation}><p hidden={!warning} role={warning ? "alert" : undefined} className="mx-auto max-w-5xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">{warning}</p>{children}</Fragment>;
  useEffect(() => {
    if (!eventId || status !== "authenticated") return;
    const controller = new AbortController();
    setExisting(null); setError("");
    fetch(`/api/history/${encodeURIComponent(eventId)}`, { credentials: "include", cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not open your saved event.");
        if (!controller.signal.aborted) setExisting({ id: eventId, identity, allowed: payload.permissions?.canEdit === true });
      }).catch((failure) => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not verify event access."); });
    return () => controller.abort();
  }, [eventId, status, identity, attempt]);
  const retry = useCallback(() => { setAttempt((value) => value + 1); void creation.reload(); }, [creation.reload]);
  // Public galleries and template previews retain their signed-out experience.
  if (status === "unauthenticated" && !eventId) { guestWorkspace.current = guestWorkspaceKey; return workspace(); }
  if (eventId && existing?.id === eventId && existing.identity === identity && existing.allowed && status === "authenticated") { admitted.current = workspaceKey; return workspace(); }
  if (!eventId && creation.access && creationAllowed(creation.access, product, category || undefined)) { guestWorkspace.current = ""; admitted.current = workspaceKey; return workspace(); }
  // A guest already editing must survive session hydration and the initial
  // account access read. This retains local work, without granting save access.
  if (!eventId && guestWorkspace.current === guestWorkspaceKey) {
    if (status === "loading" || (!creation.access && !creation.error)) return workspace();
    guestWorkspace.current = "";
  }
  // Background access refreshes must not unmount an editor and discard in-memory work.
  if (status === "authenticated" && admitted.current === workspaceKey) return workspace("Access has changed. Your edits are retained here; review access in Settings before saving a new event.");
  const waiting = status === "loading" || (eventId ? status === "authenticated" && (!existing || existing.identity !== identity) && !error : creation.loading && !creation.access);
  if (waiting) return <p role="status" className="mx-auto max-w-xl px-5 py-20 text-center text-sm text-[#6f6479]">Opening your event workspace…</p>;
  const failure = error || (!eventId ? creation.error : "");
  return <section className="mx-auto my-12 max-w-xl space-y-4 rounded-2xl border border-[#e2d9f1] bg-white p-6 text-[#30243e] sm:p-8"><h1 className="text-2xl font-semibold">{failure ? "Your workspace could not be loaded" : eventId ? "Editing access is required" : "Access to this event type is required"}</h1><p role={failure ? "alert" : undefined} className="text-sm leading-6 text-[#6f6479]">{failure || (eventId ? "Open this event from its owner account or accepted co-host invitation." : "Your source and edits are kept. You can request access in Settings and return here to continue.")}</p><div className="flex flex-wrap gap-3">{failure ? <button type="button" onClick={retry} className="min-h-11 rounded-xl border px-4 text-sm font-semibold">Retry</button> : null}<Link href="/settings#creation" className="inline-flex min-h-11 items-center rounded-xl bg-[#6555e8] px-4 text-sm font-semibold text-white">Open Settings</Link><Link href="/create" className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-[#59428d]">Back to Create</Link></div></section>;
}
