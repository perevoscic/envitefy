"use client";

import { ArrowRight, CalendarDays, FileEdit, LoaderCircle, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { isEventDraft } from "@/lib/event-draft-access";
import { CREATION_CATEGORY_LABELS, normalizeCreationCategory } from "@/lib/creation-access";
import { creationIntakeOwner } from "@/lib/create/creation-intake";
import { buildCreationDraftItems } from "@/lib/create/creation-drafts";
import { useCreationDrafts } from "@/hooks/useCreationDrafts";
import { normalizeEventWorkspaceFilters, type EventWorkspaceView } from "@/lib/events-workspace";
import { buildEventProductPath, getPrimaryEventProductOutput } from "@/utils/event-product-route";
import { resolveOwnerEditHref } from "@/utils/event-edit-route";
import { EVENT_CACHE_INVALIDATE_EVENT } from "@/app/event-cache-context";

type Row = {
  id: string;
  title: string;
  public_slug?: string | null;
  created_at?: string | null;
  data: Record<string, any>;
};
const views: { id: EventWorkspaceView; label: string }[] = [
  { id: "all", label: "All events" },
  { id: "drafts", label: "Drafts" },
  { id: "schedules", label: "Schedules" },
  { id: "signups", label: "Sign-up Forms" },
];
const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7552bc] disabled:opacity-50";
const button = `${buttonBase} border-[#ded4e8] bg-white text-[#64457f]`;

export default function EventsWorkspaceClient() {
  const { data: session, status } = useSession();
  const owner = creationIntakeOwner(session?.user);
  const activeOwner = useRef(owner);
  activeOwner.current = owner;
  const [loadedOwner, setLoadedOwner] = useState("");
  const router = useRouter(),
    search = useSearchParams();
  const filters = normalizeEventWorkspaceFilters({
    kind: search?.get("view"),
    relation: search?.get("ownership"),
    search: search?.get("q"),
  });
  const [query, setQuery] = useState(filters.search);
  const [rows, setRows] = useState<Row[]>([]),
    [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [opening, setOpening] = useState<string | null>(null);
  const generation = useRef(0),
    active = useRef<AbortController | null>(null);
  const [refresh, setRefresh] = useState(0);
  const creationDrafts = useCreationDrafts(
    owner,
    String(refresh),
    status === "authenticated" && filters.kind === "drafts",
  );
  const browserDrafts = filters.kind === "drafts" && filters.relation !== "invited"
    ? buildCreationDraftItems({
        intakes: creationDrafts.intakes,
        ownerId: owner,
        savedEventIds: (loadedOwner === owner ? rows : []).map((row) => row.id),
      }).filter((draft) => draft.title.toLowerCase().includes(filters.search.toLowerCase()))
    : [];

  const changeFilters = useCallback(
    (updates: { view?: string; ownership?: string; q?: string }) => {
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(updates))
        if (!value || value === "all") params.delete(key);
        else params.set(key, value);
      router.replace(`/events${params.size ? `?${params}` : ""}`, { scroll: false });
    },
    [router],
  );
  useEffect(() => {
    setQuery(filters.search);
  }, [filters.search]);
  useEffect(() => {
    if (query === filters.search) return;
    const timer = setTimeout(() => changeFilters({ q: query }), 300);
    return () => clearTimeout(timer);
  }, [query, filters.search, changeFilters]);
  const load = useCallback(
    async (nextCursor?: string | null) => {
      active.current?.abort();
      const controller = new AbortController(),
        version = ++generation.current;
      active.current = controller;
      if (!owner || status !== "authenticated") {
        setRows([]);
        setCursor(null);
        setLoading(status === "loading");
        return;
      }
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        view: "cards",
        time: "all",
        limit: "24",
        kind: filters.kind,
        relation: filters.relation,
        q: filters.search,
      });
      if (nextCursor) params.set("cursor", nextCursor);
      try {
        const response = await fetch(`/api/history?${params}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok || !Array.isArray(result.items))
          throw new Error(result.error || "Your events could not be loaded. Please try again.");
        if (version !== generation.current) return;
        if (owner !== activeOwner.current) return;
        setLoadedOwner(owner);
        setRows((previous) =>
          nextCursor
            ? [...new Map([...previous, ...result.items].map((row: Row) => [row.id, row])).values()]
            : result.items,
        );
        setCursor(result.nextCursor || null);
      } catch (failure) {
        if (!controller.signal.aborted && version === generation.current)
          setError(failure instanceof Error ? failure.message : "Your events could not be loaded.");
      } finally {
        if (version === generation.current) setLoading(false);
      }
    },
    [filters.kind, filters.relation, filters.search, owner, status],
  );
  useEffect(() => {
    setRows([]);
    setCursor(null);
    void load();
    return () => {
      active.current?.abort();
      generation.current++;
    };
  }, [load, refresh]);
  useEffect(() => {
    const updated = () => setRefresh((value) => value + 1);
    window.addEventListener(EVENT_CACHE_INVALIDATE_EVENT, updated);
    window.addEventListener("history:deleted", updated);
    return () => {
      window.removeEventListener(EVENT_CACHE_INVALIDATE_EVENT, updated);
      window.removeEventListener("history:deleted", updated);
    };
  }, []);
  const edit = async (row: Row) => {
    const editorOwner = owner;
    setOpening(row.id);
    setError("");
    try {
      const response = await fetch(`/api/history/${encodeURIComponent(row.id)}`, {
        credentials: "include",
        cache: "no-store",
      });
      const record = await response.json();
      if (!response.ok) throw new Error(record.error || "This event could not be opened.");
      if (editorOwner !== activeOwner.current) return;
      router.push(resolveOwnerEditHref(row.id, record.data, record.title || row.title));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "This event could not be opened.");
    } finally {
      setOpening(null);
    }
  };

  return (
    <main className="min-h-screen bg-transparent px-4 pb-16 pt-7 text-foreground sm:px-8 sm:pt-11 lg:px-12">
      <div className="mx-auto max-w-[1240px]">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-4xl font-normal tracking-tight [font-family:var(--font-playfair),Georgia,serif] sm:text-5xl">
              My Events
            </h1>
            <p className="mt-3 text-base text-[#75677e]">
              Your events, invitations, schedules and sign-up forms.
            </p>
          </div>
          <Link href="/create" className={`${buttonBase} border-[#6743aa] bg-[#6743aa] text-white`}>
            Create an Event Page
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </header>
        <nav aria-label="Event views" className="flex flex-wrap gap-2">
          {views.map((view) => (
            <Link
              key={view.id}
              href={`/events?${new URLSearchParams({ view: view.id, ...(filters.relation !== "all" ? { ownership: filters.relation } : {}), ...(filters.search ? { q: filters.search } : {}) })}`}
              aria-current={filters.kind === view.id ? "page" : undefined}
              className={`${buttonBase} ${filters.kind === view.id ? "border-[#75539c] bg-[#eee6f6] text-[#54336f]" : "border-[#ded4e8] bg-white text-[#7c6f85]"}`}
            >
              {view.label}
            </Link>
          ))}
        </nav>
        <div className="mb-7 mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search events</span>
            <Search
              className="pointer-events-none absolute left-4 top-3.5 size-4 text-[#8e7c9e]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events"
              className="min-h-12 w-full rounded-xl border border-[#ded4e8] bg-white py-2 pl-11 pr-4 text-base focus-visible:outline-2 focus-visible:outline-[#7552bc]"
            />
          </label>
          <label className="sm:w-48">
            <span className="sr-only">Event ownership</span>
            <select
              aria-label="Event ownership"
              value={filters.relation}
              onChange={(event) => changeFilters({ ownership: event.target.value })}
              className="min-h-12 w-full rounded-xl border border-[#ded4e8] bg-white px-3 text-base"
            >
              <option value="all">All events</option>
              <option value="owned">My events</option>
              <option value="invited">Invited events</option>
            </select>
          </label>
        </div>
        {error ? (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-[#e7caca] bg-white p-4 text-sm text-[#8e4141]"
          >
            {error}
            <button type="button" onClick={() => void load()} className={`${button} ml-3`}>
              Try again
            </button>
          </div>
        ) : null}
        {filters.kind === "drafts" && creationDrafts.error ? (
          <div role="alert" className="mb-5 rounded-xl border border-[#e7caca] bg-white p-4 text-sm text-[#8e4141]">
            {creationDrafts.error}
            <button type="button" onClick={creationDrafts.refresh} className={`${button} ml-3`}>
              Try again
            </button>
          </div>
        ) : null}
        {(loading || (filters.kind === "drafts" && creationDrafts.loading)) && !rows.length && !browserDrafts.length ? (
          <p role="status" className="flex items-center gap-2 text-sm text-[#75677e]">
            <LoaderCircle
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            Loading your events…
          </p>
        ) : null}
        {!loading && !error && !rows.length && !browserDrafts.length && !(filters.kind === "drafts" && (creationDrafts.loading || creationDrafts.error)) ? (
          <div className="rounded-2xl border border-[#e2d9eb] bg-white p-8 text-center">
            <h2 className="text-xl font-semibold">
              {filters.search
                ? "No matching events"
                : filters.kind === "drafts"
                  ? "No saved drafts yet"
                  : "Nothing here yet"}
            </h2>
            <p className="mt-3 text-sm text-[#75677e]">
              {filters.search
                ? "Try another search or event view."
                : "Create something new, or save event details with Snap a Flyer."}
            </p>
          </div>
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {browserDrafts.map((draft) => (
            <article key={draft.id} className="min-w-0 rounded-2xl border border-[#e2d9eb] bg-white p-5 shadow-sm">
              <FileEdit className="mb-4 size-8 text-[#8a6d9b]" aria-hidden="true" />
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8a6d9b]">Draft</p>
              <h2 className="break-words text-xl font-semibold">{draft.title}</h2>
              <Link href={draft.href} aria-label={`Resume ${draft.title}`} className={`${button} mt-5`}>
                Resume
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
          {(loadedOwner === owner ? rows : []).map((row) => {
            const data = row.data || {},
              draft = isEventDraft(data),
              invited = data.ownership === "invited";
            const path = buildEventProductPath({
              eventId: row.id,
              title: row.title,
              data,
              publicSlug: row.public_slug,
            });
            const signup = getPrimaryEventProductOutput(data, row.title) === "signup_form";
            const category = normalizeCreationCategory(data.category);
            const categoryLabel = signup
              ? "Sign-up Form"
              : category
                ? CREATION_CATEGORY_LABELS[category]
                : typeof data.category === "string"
                  ? data.category.replaceAll("_", " ")
                  : "";
            let date = "Date to be confirmed";
            if (typeof data.start === "string" && Number.isFinite(Date.parse(data.start))) {
              try {
                date = new Intl.DateTimeFormat(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  ...(data.timezone ? { timeZone: data.timezone } : {}),
                }).format(new Date(data.start));
              } catch {
                date = data.start.slice(0, 10);
              }
            }
            return (
              <article
                key={row.id}
                className="overflow-hidden rounded-2xl border border-[#e2d9eb] bg-white shadow-sm"
              >
                <Link
                  href={path}
                  aria-label={`Open ${row.title}`}
                  className="block aspect-[4/3] overflow-hidden bg-[#eee6f4]"
                >
                  {data.thumbnail ? (
                    <img
                      src={data.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-center font-serif text-3xl text-[#8a6d9b]">
                      {row.title}
                    </div>
                  )}
                </Link>
                <div className="p-5">
                  <div className="mb-2 flex flex-wrap gap-2 text-xs font-medium text-[#82689e]">
                    <span>
                      {draft
                        ? "Draft"
                        : data.collaborationRole === "cohost"
                          ? "Co-host"
                          : invited
                            ? "Invited"
                            : "My event"}
                    </span>
                    {categoryLabel ? <span>· {categoryLabel}</span> : null}
                  </div>
                  <h2 className="break-words text-xl font-semibold">{row.title}</h2>
                  <p className="mt-3 flex items-center gap-2 text-sm text-[#75677e]">
                    <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                    {date}
                  </p>
                  {typeof data.location === "string" && data.location ? (
                    <p className="mt-1 truncate text-sm text-[#75677e]">{data.location}</p>
                  ) : null}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={signup && !invited ? `${path}#signup-host-dashboard` : path}
                      className={button}
                    >
                      {signup && !invited ? "View signups" : "Open"}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                    {!invited ? (
                      <button
                        type="button"
                        disabled={!!opening}
                        onClick={() => void edit(row)}
                        className={button}
                      >
                        <FileEdit className="size-4" aria-hidden="true" />
                        {opening === row.id ? "Opening…" : draft ? "Continue editing" : "Edit"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {cursor && loadedOwner === owner ? (
          <div className="mt-7 text-center">
            <button
              type="button"
              className={button}
              disabled={loading}
              onClick={() => void load(cursor)}
            >
              {loading ? "Loading…" : "Load more events"}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
