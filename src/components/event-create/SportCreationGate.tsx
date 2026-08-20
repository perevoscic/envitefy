"use client";

import { Check, Settings2, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { notifyFeatureVisibilityChanged, useFeatureVisibility } from "@/hooks/useFeatureVisibility";
import { normalizeSportActivityKey } from "@/lib/sports-discovery/profiles";
import {
  buildSportCreationHref,
  getSportCreationLabel,
  isSportsCreationEnabled,
  SPORT_PREFERENCE_OPTIONS,
  type SportPreferences,
  syncSportsVisibilityKeys,
} from "@/lib/sports-preferences";

type SportCreationGateProps = {
  unavailableSport?: string | null;
  requestedSport?: string | null;
  surface: "gymnastics" | "sports";
  children: (activeSport: string, preferences: SportPreferences) => ReactNode;
};

export default function SportCreationGate({
  requestedSport,
  unavailableSport,
  surface,
  children,
}: SportCreationGateProps) {
  const router = useRouter();
  const visibility = useFeatureVisibility();
  const explicitSport = normalizeSportActivityKey(requestedSport);
  const unavailableSportKey = normalizeSportActivityKey(unavailableSport);
  const suggestion = explicitSport
    ? { sport: explicitSport, source: "url" as const }
    : visibility.sportPreferenceSuggestion;
  const [selection, setSelection] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [optimisticPreferences, setOptimisticPreferences] = useState<SportPreferences | null>(null);
  const preferences = optimisticPreferences || visibility.sportPreferences;
  const sportsEnabled = isSportsCreationEnabled(visibility.visibleTemplateKeys);

  useEffect(() => {
    if (preferences.setupCompleted || selection || !suggestion?.sport) return;
    setSelection(suggestion.sport);
  }, [preferences.setupCompleted, selection, suggestion?.sport]);

  const activeSport = useMemo(() => {
    if (!preferences.setupCompleted) return null;
    if (explicitSport && preferences.enabledSports.includes(explicitSport)) return explicitSport;
    return preferences.primarySport;
  }, [explicitSport, preferences]);

  useEffect(() => {
    if (!activeSport) return;
    if (surface === "gymnastics" && activeSport !== "gymnastics") {
      const href = buildSportCreationHref(activeSport);
      const separator = href.includes("?") ? "&" : "?";
      router.replace(
        `${href}${separator}unavailableSport=${encodeURIComponent(
          explicitSport || unavailableSportKey || "gymnastics",
        )}`,
      );
    } else if (surface === "sports" && activeSport === "gymnastics") {
      const unavailable = explicitSport || unavailableSportKey;
      router.replace(
        unavailable
          ? `/event/gymnastics?unavailableSport=${encodeURIComponent(unavailable)}`
          : "/event/gymnastics",
      );
    }
  }, [activeSport, explicitSport, router, surface, unavailableSportKey]);

  const confirmSetup = async () => {
    const sport = normalizeSportActivityKey(selection);
    if (!sport) return;
    setSaving(true);
    setSaveError("");
    const nextPreferences: SportPreferences = {
      primarySport: sport,
      enabledSports: [sport],
      setupCompleted: true,
    };
    const source = suggestion?.sport === sport ? suggestion.source : "manual";
    try {
      const response = await fetch("/api/user/feature-visibility", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sportPreferences: nextPreferences,
          sportPreferenceSource: source,
          visibleTemplateKeys: syncSportsVisibilityKeys(
            visibility.visibleTemplateKeys,
            nextPreferences,
            true,
          ),
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json?.error || "Could not save your sport.");
      setOptimisticPreferences(nextPreferences);
      notifyFeatureVisibilityChanged();
      router.replace(buildSportCreationHref(sport));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save your sport.");
    } finally {
      setSaving(false);
    }
  };

  if (visibility.loading && !optimisticPreferences) {
    return (
      <main className="min-h-screen bg-[#f8f8fb] px-4 pb-12 pt-24 sm:px-6 lg:pt-12">
        <div className="mx-auto h-72 max-w-5xl animate-pulse rounded-[2rem] bg-white/80" />
      </main>
    );
  }

  if (!sportsEnabled) {
    return (
      <main className="min-h-screen bg-[#f8f8fb] px-4 pb-12 pt-24 text-[#20172b] sm:px-6 lg:pt-12">
        <section className="mx-auto max-w-xl rounded-[2rem] border border-[#e4dff0] bg-white p-8 text-center shadow-[0_24px_80px_rgba(44,35,76,0.1)]">
          <Settings2 className="mx-auto h-9 w-9 text-[#6658ed]" />
          <h1 className="mt-4 text-3xl font-black">Sports creation is turned off</h1>
          <p className="mt-3 text-sm leading-6 text-[#6b6376]">
            Your saved sports are still here. Turn Sports back on in Profile Settings whenever you
            want to create another sports event.
          </p>
          <Link
            href="/settings#your-sports"
            className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#5f55ff] px-5 py-3 text-sm font-bold text-white"
          >
            Open Profile Settings
          </Link>
        </section>
      </main>
    );
  }

  if (!preferences.setupCompleted) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,#eeeaff_0,transparent_34%),radial-gradient(circle_at_88%_12%,#e9f7ff_0,transparent_30%),#f8f8fb] px-3 pb-9 pt-24 text-[#1f1729] sm:px-6 lg:pt-9">
        <section className="mx-auto max-w-5xl rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-[0_26px_90px_rgba(44,35,76,0.12)] sm:rounded-[2rem] sm:p-9">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eeeaff] text-[#5f55ff]">
              <Trophy className="h-6 w-6" />
            </span>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[#6658ed]">
              Personalize your workspace
            </p>
            <h1 className="mt-2 text-[2rem] font-black tracking-tight sm:text-5xl">
              What sport do you manage?
            </h1>
            <p className="mt-4 text-base leading-7 text-[#6b6376]">
              Pick your main sport. We’ll keep event creation focused, and you can add more sports
              later in Profile Settings.
            </p>
            {suggestion?.sport ? (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#f2f0ff] px-4 py-2 text-xs font-bold text-[#5046b5]">
                <Sparkles className="h-3.5 w-3.5" />
                {suggestion.source === "url"
                  ? `${getSportCreationLabel(suggestion.sport)} selected from this link`
                  : `Suggested: ${getSportCreationLabel(suggestion.sport)}`}
              </p>
            ) : null}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {SPORT_PREFERENCE_OPTIONS.map((sport) => {
              const selected = selection === sport.key;
              return (
                <button
                  key={sport.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelection(sport.key)}
                  className={`relative min-h-24 rounded-2xl border px-3 py-4 text-left transition ${
                    selected
                      ? "border-[#6658ed] bg-[#f0edff] text-[#3526a8] shadow-[0_8px_24px_rgba(95,85,255,0.15)] ring-1 ring-[#6658ed]"
                      : "border-[#e4dff0] bg-white text-[#393143] hover:-translate-y-0.5 hover:border-[#aaa0f5]"
                  }`}
                >
                  {selected ? (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#6658ed] text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  ) : null}
                  <span className="block pr-5 text-sm font-black">{sport.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-7 flex flex-col items-center gap-3">
            <button
              type="button"
              disabled={!selection || saving}
              onClick={() => void confirmSetup()}
              className="min-h-11 w-full rounded-2xl bg-[#17111e] px-7 py-3.5 text-sm font-black text-white transition hover:bg-[#302639] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-52"
            >
              {saving ? "Saving…" : "Continue"}
            </button>
            {saveError ? <p className="text-sm font-semibold text-red-600">{saveError}</p> : null}
          </div>
        </section>
      </main>
    );
  }

  if (!activeSport || (surface === "gymnastics") !== (activeSport === "gymnastics")) {
    return (
      <main className="min-h-screen bg-[#f8f8fb] px-4 pb-12 pt-24 sm:px-6 lg:pt-12">
        <div className="mx-auto h-32 max-w-5xl animate-pulse rounded-[2rem] bg-white/80" />
      </main>
    );
  }

  const rejectedSport =
    unavailableSportKey ||
    (explicitSport && !preferences.enabledSports.includes(explicitSport) ? explicitSport : null);
  const requestedWasDisabled = Boolean(rejectedSport);

  return (
    <>
      {preferences.enabledSports.length > 1 || requestedWasDisabled ? (
        <div className="sport-creation-notice border-b border-[#e7e2ef] bg-white/90 px-4 pb-3 pt-20 backdrop-blur sm:px-6 lg:py-3">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#8a8294]">
                Creating for
              </p>
              <p className="text-sm font-black text-[#2b2234]">
                {getSportCreationLabel(activeSport)}
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              {preferences.enabledSports.length > 1 ? (
                <label className="flex min-w-0 items-center justify-between gap-2 text-xs font-bold text-[#665e70]">
                  Switch sport
                  <select
                    value={activeSport}
                    onChange={(event) => router.push(buildSportCreationHref(event.target.value))}
                    className="min-h-11 min-w-0 rounded-xl border border-[#dcd5e7] bg-white px-3 py-2 text-base font-bold text-[#30283a] sm:text-sm"
                  >
                    {preferences.enabledSports.map((sport) => (
                      <option key={sport} value={sport}>
                        {getSportCreationLabel(sport)}
                        {sport === preferences.primarySport ? " (Primary)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <Link
                href="/settings#your-sports"
                className="inline-flex min-h-11 items-center text-xs font-bold text-[#5548d8]"
              >
                Manage sports
              </Link>
            </div>
            {requestedWasDisabled ? (
              <p className="w-full rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {getSportCreationLabel(rejectedSport)} is not enabled for this account. We opened
                your primary sport instead. Add it in Profile Settings if you manage it.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      {children(activeSport, preferences)}
    </>
  );
}
