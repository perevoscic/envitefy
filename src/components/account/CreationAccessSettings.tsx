"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useCreationAccess } from "@/hooks/useCreationAccess";
import { notifyFeatureVisibilityChanged, useFeatureVisibility } from "@/hooks/useFeatureVisibility";
import { CREATION_CATEGORIES, CREATION_CATEGORY_LABELS, CREATION_PRODUCTS, CREATION_PRODUCT_LABELS, filterCreationTemplateKeys, normalizeCreationCategory, type CreationCategory } from "@/lib/creation-access";
import { TEMPLATE_KEYS } from "@/config/feature-visibility";
import { normalizeSportPreferences } from "@/lib/sports-preferences";

const buttonClass = "inline-flex min-h-11 max-w-full items-center justify-center rounded-lg border border-[color:var(--settings-line,var(--border))] px-3 py-2 text-sm font-medium text-[color:var(--settings-ink,var(--foreground))] transition-colors hover:bg-[color:var(--settings-selection,var(--muted))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--settings-accent,var(--ring))] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";
const rowClass = "flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[color:var(--settings-line,var(--border))] py-3 last:border-b-0";
const headingClass = "!font-sans text-base font-medium !tracking-normal text-[color:var(--settings-ink,var(--foreground))]";

export default function CreationAccessSettings({ showHeading = true }: { showHeading?: boolean }) {
  const { data: session } = useSession();
  const { access, loading, error, reload } = useCreationAccess();
  const preferences = useFeatureVisibility();
  const [requests, setRequests] = useState<Array<{ kind: string; capability: string; status: string }>>([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const requestGeneration = useRef(0);
  const loadRequests = async () => {
    const generation = requestGeneration.current;
    const response = await fetch("/api/user/creation-access", { cache: "no-store" });
    if (response.ok) {
      const payload = await response.json();
      if (generation === requestGeneration.current) setRequests(payload.requests || []);
    }
  };
  useEffect(() => { requestGeneration.current++; setRequests([]); setMessage(""); void loadRequests(); return () => { requestGeneration.current++; }; }, [session?.user?.email]);
  useEffect(() => { const update = () => { if (document.visibilityState === "visible") void loadRequests(); }; window.addEventListener("focus", update); const timer = requests.some((item) => item.status === "pending") ? window.setInterval(update, 30_000) : undefined; return () => { window.removeEventListener("focus", update); if (timer) window.clearInterval(timer); }; }, [requests.some((item) => item.status === "pending")]);
  const selected = (category: CreationCategory) => preferences.visibleTemplateKeys.some((key) => normalizeCreationCategory(key) === category)
    || preferences.sportPreferences.enabledSports.some((key) => normalizeCreationCategory(key) === category);
  const save = async (capability: string, body: object) => {
    setBusy(capability); setMessage("");
    try {
      const response = await fetch("/api/user/feature-visibility", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save your preferences.");
      notifyFeatureVisibilityChanged();
      setMessage("Workspace preferences saved.");
    } catch (failure) { setMessage(failure instanceof Error ? failure.message : "Could not save your preferences."); }
    finally { setBusy(""); }
  };
  const toggleCategory = async (category: CreationCategory) => {
    if (!access || !preferences.hasLoadedPreferences) return;
    const remove = selected(category);
    const preferenceCategory = category;
    const current = preferences.visibleTemplateKeys.filter((key) => normalizeCreationCategory(key) !== preferenceCategory);
    const key = TEMPLATE_KEYS.find((item) => normalizeCreationCategory(item) === preferenceCategory);
    if (!remove && key) current.push(key);
    const sports = ["gymnastics", "football", "soccer", "cheerleading", "dance-ballet", "sport-events"].includes(category);
    const enabled = preferences.sportPreferences.enabledSports.filter((sport) => normalizeCreationCategory(sport) !== category);
    if (!remove && sports && category !== "sport-events") enabled.push(category === "dance-ballet" ? "dance" : category);
    if (!remove && sports && !current.includes("sport_events") && category !== "gymnastics" && category !== "football") current.push("sport_events");
    await save(category, { visibleTemplateKeys: current, ...(sports ? { sportPreferences: normalizeSportPreferences({ ...preferences.sportPreferences, enabledSports: enabled, setupCompleted: enabled.length > 0 }) } : {}) });
  };
  const request = async (kind: "category" | "product", capability: string) => {
    setBusy(capability); setMessage("");
    try {
      const response = await fetch("/api/user/creation-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, capability }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not request access.");
      await loadRequests(); setMessage("Access requested. An Envitefy administrator will review it.");
    } catch (failure) { setMessage(failure instanceof Error ? failure.message : "Could not request access."); }
    finally { setBusy(""); }
  };
  if (loading || preferences.loading) return <p role="status" className="py-4 text-sm text-[color:var(--settings-muted,var(--muted-foreground))]">Loading your workspace preferences…</p>;
  if (!access || !preferences.hasLoadedPreferences) return <div role="alert" className="space-y-3 py-3 text-sm"><p>{error || preferences.error || "Could not load your preferences."}</p><button type="button" onClick={() => { void reload(); void preferences.refresh(); }} className={buttonClass}>Retry</button></div>;
  const pending = (kind: string, key: string) => requests.some((item) => item.kind === kind && item.capability === key && item.status === "pending");
  return (
    <div className="space-y-7 text-[color:var(--settings-ink,var(--foreground))]">
      {showHeading ? <h2 className="!font-sans text-2xl font-medium !tracking-normal">Creation tools &amp; access</h2> : null}
      <div>
        <h3 className={headingClass}>Creation tools</h3>
        <div className="mt-2">
          {CREATION_PRODUCTS.map((product) => {
            const allowed = access.allowedProducts.includes(product);
            const waiting = pending("product", product);
            return (
              <div key={product} className={rowClass}>
                <span className="min-w-0 basis-36 grow text-sm font-medium">{CREATION_PRODUCT_LABELS[product]}</span>
                {allowed ? (
                  <span className="text-sm text-[color:var(--settings-muted,var(--muted-foreground))]">Available</span>
                ) : (
                  <button type="button" disabled={Boolean(busy) || waiting} onClick={() => void request("product", product)} className={`${buttonClass} ml-auto`}>
                    {waiting ? "Requested" : "Request access"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <h3 className={headingClass}>Your event types</h3>
        <div className="mt-2">
          {CREATION_CATEGORIES.map((category) => {
            const allowed = access.allowedCategories.includes(category) && access.allowedProducts.includes("event_page");
            const waiting = pending("category", category);
            const action = allowed ? selected(category) ? "Remove from workspace" : "Add to workspace" : waiting ? "Requested" : "Request access";
            return (
              <div key={category} className={rowClass}>
                <span className="min-w-0 basis-36 grow text-sm font-medium">{CREATION_CATEGORY_LABELS[category]}</span>
                <button
                  type="button"
                  disabled={Boolean(busy) || waiting}
                  onClick={() => void (allowed ? toggleCategory(category) : request("category", category))}
                  aria-label={`${CREATION_CATEGORY_LABELS[category]}: ${action}`}
                  className={`${buttonClass} ml-auto`}
                >
                  {action}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-[color:var(--settings-line,var(--border))] pt-6">
        <button type="button" disabled={Boolean(busy)} onClick={() => void save("reset", { visibleTemplateKeys: filterCreationTemplateKeys(TEMPLATE_KEYS, access), defaultCreateIntent: null, quickAccess: ["snap", "upload", "smart_signup"] })} className={buttonClass}>Reset preferences</button>
        {message ? <p role="status" className="text-sm text-[color:var(--settings-muted,var(--muted-foreground))]">{message}</p> : null}
      </div>
      {(session?.user as any)?.isAdmin ? <Link href="/admin/creation-access" className="inline-flex min-h-11 items-center text-sm font-medium text-[color:var(--settings-accent,var(--primary))] underline underline-offset-4">Review creation access requests</Link> : null}
    </div>
  );
}
