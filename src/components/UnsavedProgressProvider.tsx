"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Progress = {
  dirty: boolean;
  busy?: boolean;
  save: () => Promise<void>;
  discard?: () => Promise<void> | void;
};
type Navigation = () => void;
type ProgressContextValue = {
  register: (id: symbol, progress: () => Progress) => () => void;
  requestLeave: (navigate: Navigation) => void;
  allowNavigation: (navigate: Navigation) => void;
};
const ProgressContext = createContext<ProgressContextValue | null>(null);

export function useProgressNavigation() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("Event editors require UnsavedProgressProvider.");
  return context;
}

/** Register live state, so a click immediately after an edit sees the latest work. */
export function useUnsavedProgress(progress: Progress) {
  const context = useProgressNavigation();
  const current = useRef(progress);
  useLayoutEffect(() => { current.current = progress; });
  useLayoutEffect(() => context.register(Symbol("event-progress"), () => current.current), [context.register]);
  return context;
}

/** Compare event content only; loading a saved event is a clean starting point. */
export function useEventProgress({ snapshot, ready = true, enabled = true, ...actions }: {
  snapshot: object;
  ready?: boolean;
  enabled?: boolean;
  save: Progress["save"];
  discard?: Progress["discard"];
  busy?: boolean;
}) {
  const interacted = useRef(false);
  useEffect(() => {
    const edit = () => { interacted.current = true; };
    document.addEventListener("input", edit, true);
    document.addEventListener("change", edit, true);
    document.addEventListener("pointerdown", edit, true);
    document.addEventListener("keydown", edit, true);
    return () => {
      document.removeEventListener("input", edit, true);
      document.removeEventListener("change", edit, true);
      document.removeEventListener("pointerdown", edit, true);
      document.removeEventListener("keydown", edit, true);
    };
  }, []);
  const serialized = JSON.stringify(snapshot);
  const baseline = useRef(serialized);
  const wasReady = useRef(false);
  const latest = useRef(serialized);
  latest.current = serialized;
  if (!ready || !wasReady.current || !interacted.current) baseline.current = serialized;
  wasReady.current = ready;
  const [, refresh] = useState(0);
  const markSaved = useCallback(() => {
    baseline.current = latest.current;
    refresh((value) => value + 1);
  }, []);
  const navigation = useUnsavedProgress({
    ...actions,
    dirty: enabled && ready && baseline.current !== serialized,
    save: async () => { await actions.save(); markSaved(); },
    discard: async () => { await actions.discard?.(); markSaved(); },
  });
  return { ...navigation, markSaved };
}

export default function UnsavedProgressProvider({ children }: { children: ReactNode }) {
  const router = useContext(AppRouterContext);
  const entries = useRef(new Map<symbol, () => Progress>());
  const bypass = useRef(false);
  const pending = useRef<Navigation | null>(null);
  const resolving = useRef(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dirtyEntries = useCallback(() => [...entries.current.values()].map((read) => read()).filter((entry) => entry.dirty), []);
  const register = useCallback((id: symbol, read: () => Progress) => {
    entries.current.set(id, read);
    return () => { entries.current.delete(id); };
  }, []);
  const allowNavigation = useCallback((navigate: Navigation) => {
    bypass.current = true;
    try { navigate(); } finally { bypass.current = false; }
  }, []);
  const requestLeave = useCallback((navigate: Navigation) => {
    if (bypass.current || !dirtyEntries().length) { navigate(); return; }
    if (pending.current) return;
    pending.current = navigate;
    setError("");
    setOpen(true);
  }, [dirtyEntries]);
  const cancel = () => {
    if (resolving.current) return;
    pending.current = null;
    setError("");
    setOpen(false);
  };
  const resolve = async (choice: "save" | "discard") => {
    if (resolving.current) return;
    const progress = dirtyEntries();
    if (choice === "save" && progress.some((entry) => entry.busy)) {
      setError("Please wait for the current work to finish, then save your progress.");
      return;
    }
    resolving.current = true;
    setSaving(true);
    setError("");
    try {
      for (const entry of progress) {
        if (choice === "save") await entry.save();
        else await entry.discard?.();
      }
      const navigate = pending.current;
      pending.current = null;
      setOpen(false);
      if (navigate) allowNavigation(navigate);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Your progress could not be saved. Please try again.");
    } finally {
      resolving.current = false;
      setSaving(false);
    }
  };
  const value = useMemo(() => ({ register, requestLeave, allowNavigation }), [register, requestLeave, allowNavigation]);
  // Next's router context also covers Link, sidebar buttons and programmatic navigation.
  const guardedRouter = useMemo(() => router && ({
    ...router,
    push: (...args: Parameters<typeof router.push>) => requestLeave(() => router.push(...args)),
    replace: (...args: Parameters<typeof router.replace>) => requestLeave(() => router.replace(...args)),
    back: () => requestLeave(() => allowNavigation(() => window.history.back())),
    forward: () => requestLeave(() => allowNavigation(() => window.history.forward())),
  }), [router, requestLeave, allowNavigation]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (bypass.current || !dirtyEntries().length) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || bypass.current || !dirtyEntries().length) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.download || (link.target && link.target !== "_self")) return;
      const target = new URL(link.href, location.href);
      if (!["http:", "https:"].includes(target.protocol)) return;
      if (target.pathname === location.pathname && target.search === location.search && target.origin === location.origin) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      requestLeave(() => {
        if (target.origin === location.origin && router) router.push(`${target.pathname}${target.search}${target.hash}`);
        else {
          // beforeunload follows asynchronously for a full document navigation.
          window.removeEventListener("beforeunload", onBeforeUnload);
          location.assign(target.href);
        }
      });
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirtyEntries, requestLeave, router]);

  useEffect(() => {
    // Retain Next's history state and restore the current entry before opening a
    // dialog for native Back/Forward. No duplicate entries or lost editor state.
    const key = "__envitefyProgressIndex";
    let index: number = window.history.state?.[key] ?? 0;
    let restoring = false;
    let allowedPop = false;
    let afterRestore: Navigation | null = null;
    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;
    const originalGo = window.history.go;
    const originalBack = window.history.back;
    const originalForward = window.history.forward;
    originalReplace.call(window.history, { ...window.history.state, [key]: index }, "");
    window.history.pushState = function (state, unused, url) {
      index += 1;
      originalPush.call(this, { ...state, [key]: index }, unused, url);
    };
    window.history.replaceState = function (state, unused, url) {
      originalReplace.call(this, { ...state, [key]: index }, unused, url);
    };
    window.history.back = function () { allowedPop = bypass.current; originalBack.call(this); };
    window.history.forward = function () { allowedPop = bypass.current; originalForward.call(this); };
    const onPop = (event: PopStateEvent) => {
      const nextIndex: number = event.state?.[key] ?? index - 1;
      if (restoring) {
        event.stopImmediatePropagation();
        restoring = false;
        const next = afterRestore;
        afterRestore = null;
        next?.();
        return;
      }
      if (allowedPop || !dirtyEntries().length) {
        allowedPop = false;
        index = nextIndex;
        return;
      }
      const delta = nextIndex - index;
      if (!delta) return;
      event.stopImmediatePropagation();
      restoring = true;
      afterRestore = () => requestLeave(() => {
        allowedPop = true;
        originalGo.call(window.history, delta);
      });
      originalGo.call(window.history, -delta);
    };
    window.addEventListener("popstate", onPop, true);
    return () => {
      window.removeEventListener("popstate", onPop, true);
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
      window.history.back = originalBack;
      window.history.forward = originalForward;
    };
  }, [dirtyEntries, requestLeave]);

  return (
    <ProgressContext.Provider value={value}>
      <AppRouterContext.Provider value={guardedRouter}>
        <div className="contents" inert={open ? true : undefined}>{children}</div>
        <Dialog.Root open={open} onOpenChange={(next) => { if (!next) cancel(); }}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[1000] bg-[#211638]/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-[1001] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[#e5dcf7] bg-white p-6 text-[#251b3b] shadow-2xl sm:p-8" onEscapeKeyDown={(event) => { if (saving) event.preventDefault(); }} onInteractOutside={(event) => event.preventDefault()}>
              <Dialog.Title className="text-xl font-semibold">Save your progress?</Dialog.Title>
              <Dialog.Description className="mt-3 text-sm leading-6 text-[#746783]">You have unsaved changes. Save a draft to pick up where you left off, or discard this progress.</Dialog.Description>
              {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
              <div className="mt-6 flex flex-col gap-3">
                <button type="button" disabled={saving} onClick={() => void resolve("save")} className="rounded-full bg-[#7151d8] px-5 py-3 text-sm font-semibold text-white hover:bg-[#6342c7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7151d8] disabled:opacity-50">{saving ? "Please wait…" : "Save and leave"}</button>
                <button type="button" disabled={saving} onClick={() => void resolve("discard")} className="rounded-full border border-[#ded5ea] px-5 py-3 text-sm font-semibold hover:bg-[#f8f5fd] disabled:opacity-50">Discard and leave</button>
                <button type="button" disabled={saving} onClick={cancel} className="rounded-full px-5 py-2 text-sm font-medium text-[#7151d8] hover:bg-[#f8f5fd] disabled:opacity-50">Keep editing</button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </AppRouterContext.Provider>
    </ProgressContext.Provider>
  );
}
