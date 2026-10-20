"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useCreationAccess } from "@/hooks/useCreationAccess";
import { notifyFeatureVisibilityChanged, useFeatureVisibility } from "@/hooks/useFeatureVisibility";
import { CREATION_CATEGORIES, CREATION_CATEGORY_LABELS, CREATION_PRODUCTS, CREATION_PRODUCT_LABELS, filterCreationTemplateKeys, normalizeCreationCategory, type CreationCategory } from "@/lib/creation-access";
import { TEMPLATE_KEYS } from "@/config/feature-visibility";
import { normalizeSportPreferences } from "@/lib/sports-preferences";

export default function CreationAccessSettings() {
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
  if (loading || preferences.loading) return <p role="status" className="py-4 text-sm text-[#6f6479]">Loading your workspace preferences…</p>;
  if (!access || !preferences.hasLoadedPreferences) return <div role="alert" className="space-y-3 py-3 text-sm"><p>{error || preferences.error || "Could not load your preferences."}</p><button type="button" onClick={() => { void reload(); void preferences.refresh(); }} className="min-h-11 rounded-xl border px-4 font-semibold">Retry</button></div>;
  const pending = (kind: string, key: string) => requests.some((item) => item.kind === kind && item.capability === key && item.status === "pending");
  return <div className="space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#7964ad]">Workspace preferences</p><h2 className="mt-1 text-2xl font-semibold text-[#251b32]">Event creation</h2><p className="mt-2 text-sm leading-6 text-[#6f6479]">Choose the event types you use. Your existing events and co-host access stay available.</p></div>
    <div className="space-y-3"><h3 className="font-semibold">Your event types</h3><div className="grid gap-2 sm:grid-cols-2">{CREATION_CATEGORIES.map((category) => {
      const allowed = access.allowedCategories.includes(category) && access.allowedProducts.includes("event_page");
      const waiting = pending("category", category);
      return <div key={category} className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-[#e5dcf5] bg-white px-4 py-3"><span className="text-sm font-medium">{CREATION_CATEGORY_LABELS[category]}</span><button type="button" disabled={Boolean(busy) || waiting} onClick={() => void (allowed ? toggleCategory(category) : request("category", category))} aria-label={`${CREATION_CATEGORY_LABELS[category]}: ${allowed ? selected(category) ? "Remove from workspace" : "Add to workspace" : waiting ? "Requested" : "Request access"}`} className="min-h-11 rounded-lg border border-[#d9cdfa] px-3 text-sm font-semibold text-[#59428d] disabled:opacity-50">{allowed ? selected(category) ? "Remove from workspace" : "Add to workspace" : waiting ? "Requested" : "Request access"}</button></div>;
    })}</div></div>
    <div className="space-y-3"><h3 className="font-semibold">Creation tools</h3>{CREATION_PRODUCTS.map((product) => {
      const allowed = access.allowedProducts.includes(product); const waiting = pending("product", product);
      return <div key={product} className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-[#e5dcf5] bg-white px-4 py-2"><span className="text-sm font-medium">{CREATION_PRODUCT_LABELS[product]}</span>{allowed ? product === "signup_form" ? <label className="inline-flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" disabled={Boolean(busy)} checked={preferences.quickAccess.includes("smart_signup")} onChange={(event) => void save(product, { quickAccess: event.target.checked ? [...new Set([...preferences.quickAccess, "smart_signup"])] : preferences.quickAccess.filter((key) => key !== "smart_signup") })} />Show in sidebar</label> : <span className="text-xs font-semibold text-[#6f6479]">Available</span> : <button type="button" disabled={Boolean(busy) || waiting} onClick={() => void request("product", product)} className="min-h-11 rounded-lg border px-3 text-sm font-semibold disabled:opacity-50">{waiting ? "Requested" : "Request access"}</button>}</div>;
    })}</div>
    <button type="button" disabled={Boolean(busy)} onClick={() => void save("reset", { visibleTemplateKeys: filterCreationTemplateKeys(TEMPLATE_KEYS, access), defaultCreateIntent: null, quickAccess: ["snap", "upload", "smart_signup"] })} className="min-h-11 rounded-xl border border-[#d9cdfa] bg-white px-4 text-sm font-semibold disabled:opacity-50">Reset preferences</button>
    {message ? <p role="status" className="text-sm leading-6 text-[#59428d]">{message}</p> : null}
    {(session?.user as any)?.isAdmin ? <Link href="/admin/creation-access" className="inline-flex min-h-11 items-center text-sm font-semibold text-[#59428d] underline">Review creation access requests</Link> : null}
  </div>;
}
