"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "@/app/providers";
import {
  listThemesSorted,
  resolveThemeForDate,
  findActiveThemeWindow,
  ThemeKey,
  ThemeVariant,
} from "@/themes";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

type Message = { type: "success" | "error"; text: string } | null;

export default function ThemeTogglePage() {
  const { data: session, status } = useSession();
  const isAdmin = Boolean((session?.user as any)?.isAdmin);
  const { theme, themeKey, setTheme, setThemeKey } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [formKey, setFormKey] = useState<ThemeKey>(themeKey);
  const [formVariant, setFormVariant] = useState<ThemeVariant>(theme);
  const [message, setMessage] = useState<Message>(null);
  const initialVariantRef = useRef<ThemeVariant>(theme);

  const themes = useMemo(() => listThemesSorted(), []);
  const scheduleInfo = useMemo(() => {
    const now = new Date();
    const scheduledKey = resolveThemeForDate(now);
    const window = findActiveThemeWindow(now);
    return { key: scheduledKey as ThemeKey, window };
  }, []);

  const scheduleKey = scheduleInfo.key;
  const scheduleWindow = scheduleInfo.window;

  const isPreviewing =
    themeKey !== scheduleKey || theme !== initialVariantRef.current;

  useEffect(() => {
    setFormKey(themeKey);
  }, [themeKey]);

  useEffect(() => {
    setFormVariant(theme);
  }, [theme]);

  if (!mounted || status === "loading") {
    return (
      <div className="p-10">
        <p className="text-sm text-muted-foreground">Loading theme controls…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-10 space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Theme Toggle</h1>
        <p className="text-muted-foreground text-sm">
          You need admin access to preview or schedule themed layouts.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-surface hover:bg-surface/80"
        >
          Go back home
        </Link>
      </div>
    );
  }

  const scheduleRange = scheduleWindow
    ? `${dateFormatter.format(new Date(scheduleWindow.start))} → ${dateFormatter.format(new Date(scheduleWindow.end))}`
    : "Always";

  const handlePreview = async () => {
    setMessage(null);
    try {
      await setThemeKey(formKey, { persist: false, variant: formVariant });
      setTheme(formVariant, { persist: false, persistOverride: false });
      setMessage({
        type: "success",
        text: "Preview applied locally. Refresh or reset to return to the scheduled theme.",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.message || "Unable to preview theme",
      });
    }
  };

  const handleReset = async () => {
    setMessage(null);
    try {
      await setThemeKey(scheduleKey, {
        persist: false,
        variant: initialVariantRef.current,
      });
      setTheme(initialVariantRef.current, {
        persist: false,
        persistOverride: false,
      });
      setFormKey(scheduleKey);
      setFormVariant(initialVariantRef.current);
      setMessage({ type: "success", text: "Back to the scheduled theme." });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.message || "Unable to reset theme",
      });
    }
  };

  return (
    <div className="px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Theme Toggle</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Preview upcoming holiday themes without changing what other users see. The automatic schedule below remains the default unless you refresh in preview mode.
        </p>
      </div>

      {message ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-800"
              : "border-rose-400/60 bg-rose-400/10 text-rose-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="mx-auto w-full md:w-1/2 rounded-xl border border-border bg-surface p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Scheduled theme</h2>
          <p className="text-sm text-muted-foreground">
            Currently scheduled: <span className="font-medium text-foreground">{scheduleKey}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Active window: <span className="font-medium text-foreground">{scheduleRange}</span>
          </p>
        </div>
        <div className="space-y-4 border-t border-border/60 pt-6">
          <h2 className="text-lg font-semibold text-foreground">Preview selection</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-muted-foreground">Theme</span>
              <select
                value={formKey}
                onChange={(event) => setFormKey(event.target.value as ThemeKey)}
                className="rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {themes.map((theme) => (
                  <option key={theme.key} value={theme.key}>
                    {theme.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">
                {themes.find((item) => item.key === formKey)?.description}
              </span>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="text-muted-foreground">Variant</span>
              <select
                value={formVariant}
                onChange={(event) => setFormVariant(event.target.value as ThemeVariant)}
                className="rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-surface hover:bg-surface/80 text-sm"
          onClick={handlePreview}
        >
          Preview locally
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary hover:opacity-95 text-sm disabled:opacity-60"
          onClick={handleReset}
          disabled={!isPreviewing}
        >
          Reset to schedule
        </button>
      </div>
    </div>
  );
}
