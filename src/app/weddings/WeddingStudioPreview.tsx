"use client";

import {
  Calendar,
  CheckCircle2,
  Copy,
  MapPin,
  Share2,
  Wine,
} from "lucide-react";
import { useMemo, useState } from "react";

type ThemeId = "gold" | "ivory" | "midnight";

const themeButtons: Array<{ id: ThemeId; label: string }> = [
  { id: "gold", label: "Champagne Gold" },
  { id: "ivory", label: "Classic Ivory" },
  { id: "midnight", label: "Midnight Noir" },
];

export default function WeddingStudioPreview() {
  const [names, setNames] = useState("Eleanor & Julian");
  const [date, setDate] = useState("September 12, 2027");
  const [venue, setVenue] = useState("Villa Cetinale, Tuscany");
  const [theme, setTheme] = useState<ThemeId>("gold");
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const suiteLink = useMemo(() => {
    const slug = names
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);
    return `https://envitefy.com/weddings/${slug || "wedding-suite"}`;
  }, [names]);

  const cardClass =
    theme === "midnight"
      ? "bg-slate-900 text-white border-2 border-[#ab8a5f]"
      : theme === "ivory"
        ? "bg-slate-50 text-slate-900 border-2 border-slate-300"
        : "bg-white text-slate-900 border border-[rgba(171,138,95,0.35)]";

  const iconClass =
    theme === "midnight"
      ? "bg-slate-800 border-[#ab8a5f] text-[#c0a37b]"
      : theme === "ivory"
        ? "bg-slate-200 border-slate-300 text-slate-700"
        : "bg-[#f2ece1] border-[#e5d7c3] text-[#795b3d]";

  const subtitleClass =
    theme === "midnight"
      ? "text-[#c0a37b]"
      : theme === "ivory"
        ? "text-slate-700"
        : "text-[#795b3d]";

  const bannerClass =
    theme === "midnight"
      ? "bg-slate-800 border-slate-700 text-[#e5d7c3]"
      : theme === "ivory"
        ? "bg-white border-slate-200 text-slate-700"
        : "bg-[#fbf9f5] border-[#f2ece1] text-slate-700";

  const actionClass =
    theme === "midnight"
      ? "bg-[#94724c] hover:bg-[#795b3d]"
      : theme === "ivory"
        ? "bg-slate-800 hover:bg-slate-900"
        : "bg-[#795b3d] hover:bg-[#634932]";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(suiteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
        <div className="space-y-6 rounded-[2.5rem] border border-[#e5d7c3] bg-white p-8 shadow-[0_30px_60px_-15px_rgba(121,91,61,0.12)] sm:p-10 lg:col-span-6">
          <h3 className="border-b border-[#f2ece1] pb-4 font-wedding-serif text-2xl font-normal tracking-wide text-slate-900">
            Invitation Configuration
          </h3>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="wedding-names"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600"
              >
                Couple&apos;s Names
              </label>
              <input
                id="wedding-names"
                type="text"
                value={names}
                onChange={(event) => setNames(event.target.value)}
                className="w-full rounded-2xl border border-[#e5d7c3] bg-[#fbf9f5]/40 px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#ab8a5f]"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="wedding-date"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600"
                >
                  Wedding Date
                </label>
                <input
                  id="wedding-date"
                  type="text"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5d7c3] bg-[#fbf9f5]/40 px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#ab8a5f]"
                />
              </div>
              <div>
                <label
                  htmlFor="wedding-venue"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600"
                >
                  Venue & Location
                </label>
                <input
                  id="wedding-venue"
                  type="text"
                  value={venue}
                  onChange={(event) => setVenue(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5d7c3] bg-[#fbf9f5]/40 px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#ab8a5f]"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                Select Theme Palette
              </p>
              <div className="grid grid-cols-3 gap-3 pt-1">
                {themeButtons.map((button) => {
                  const selected = theme === button.id;
                  return (
                    <button
                      key={button.id}
                      type="button"
                      onClick={() => setTheme(button.id)}
                      className={[
                        "rounded-2xl px-3 py-3 text-xs font-medium uppercase tracking-wider transition-all border-2",
                        button.id === "midnight" && !selected
                          ? "border-transparent bg-slate-900 text-slate-100"
                          : "",
                        button.id === "ivory" && !selected
                          ? "border-transparent bg-slate-50 text-slate-800"
                          : "",
                        button.id === "gold" && !selected
                          ? "border-transparent bg-[#faf7f2] text-[#523c2a]"
                          : "",
                        selected && button.id === "gold"
                          ? "border-[#94724c] bg-[#faf7f2] text-[#523c2a]"
                          : "",
                        selected && button.id === "ivory"
                          ? "border-slate-600 bg-slate-100 text-slate-900"
                          : "",
                        selected && button.id === "midnight"
                          ? "border-slate-400 bg-slate-800 text-white"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {button.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-[#f2ece1] pt-4 sm:flex-row">
            <span className="text-xs italic text-slate-500">Instant preview synchronization</span>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#94724c] to-[#795b3d] px-7 py-3.5 text-xs font-medium uppercase tracking-widest text-white shadow-md transition hover:from-[#795b3d] hover:to-[#634932] sm:w-auto"
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              Generate Wedding Suite Link
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center lg:col-span-6">
          <div
            className={`relative w-full max-w-md space-y-6 rounded-[2.5rem] p-8 text-center shadow-[0_30px_60px_-15px_rgba(121,91,61,0.12)] transition-all duration-500 sm:p-10 ${cardClass}`}
          >
            {theme === "gold" ? (
              <div
                className="pointer-events-none absolute inset-[6px] rounded-[2.2rem] border border-[rgba(171,138,95,0.2)]"
                aria-hidden="true"
              />
            ) : null}
            <div
              className={`relative inline-flex rounded-full border p-4 text-xl shadow-sm ${iconClass}`}
            >
              <Wine className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="relative space-y-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-[0.3em] ${subtitleClass}`}
              >
                The Wedding Celebration
              </span>
              <h3 className="font-wedding-serif text-3xl font-normal tracking-wide sm:text-4xl">
                {names.trim() || "Wedding Suite"}
              </h3>
              <p
                className={`font-wedding-script text-2xl ${
                  theme === "midnight" ? "text-[#c0a37b]" : "text-[#94724c]"
                }`}
              >
                With Joyful Hearts
              </p>
            </div>
            <div className="relative space-y-3 border-y border-slate-100/80 py-6 text-xs font-light tracking-wider opacity-90">
              <div className="flex items-center justify-center gap-2.5">
                <Calendar className="h-3.5 w-3.5 text-[#94724c]" aria-hidden="true" />
                <span>{date}</span>
              </div>
              <div className="flex items-center justify-center gap-2.5">
                <MapPin className="h-3.5 w-3.5 text-[#94724c]" aria-hidden="true" />
                <span>{venue}</span>
              </div>
            </div>
            <div
              className={`relative flex items-center justify-center gap-2 rounded-2xl border p-4 text-xs tracking-wider ${bannerClass}`}
            >
              <Wine className="h-3.5 w-3.5 text-[#94724c]" aria-hidden="true" />
              <span>Ceremony & Reception RSVP Open</span>
            </div>
            <div className="relative pt-2">
              <button
                type="button"
                className={`w-full rounded-2xl py-4 text-xs font-medium uppercase tracking-widest text-white shadow-lg transition ${actionClass}`}
              >
                RSVP to Wedding
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wedding-suite-modal-title"
        >
          <div className="relative w-full max-w-md space-y-6 rounded-[2.5rem] border border-[#e5d7c3] bg-white p-10 text-center shadow-[0_30px_60px_-15px_rgba(121,91,61,0.12)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#e5d7c3] bg-[#faf7f2] text-[#795b3d] shadow-inner">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h4
                id="wedding-suite-modal-title"
                className="font-wedding-serif text-3xl font-normal tracking-wide text-slate-900"
              >
                Wedding Suite Link Ready
              </h4>
              <p className="text-xs font-light text-slate-600 sm:text-sm">
                Your luxury digital wedding invitation has been generated successfully.
              </p>
            </div>
            <div className="truncate rounded-2xl border border-[#e5d7c3] bg-[#fbf9f5] p-3.5 font-mono text-xs text-slate-700 select-all">
              {suiteLink}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => void copyLink()}
                className="flex-1 rounded-xl bg-[#795b3d] py-3.5 text-xs font-medium uppercase tracking-widest text-white shadow-md transition hover:bg-[#634932]"
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  {copied ? "Copied" : "Copy Link"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl bg-slate-100 px-5 py-3.5 text-xs font-medium uppercase tracking-widest text-slate-700 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
