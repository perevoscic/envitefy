// @ts-nocheck
"use client";

import React, { useCallback, useMemo, useState, memo } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Edit2,
  Image as ImageIcon,
  Menu,
  Palette,
  Upload,
} from "lucide-react";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";

type FieldSpec = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea";
};

export type ThemeSpec = {
  id: string;
  name: string;
  bg: string;
  text: string;
  accent: string;
  preview: string;
};

export type SimpleTemplateConfig = {
  slug: string;
  displayName: string;
  category: string;
  defaultHero: string;
  detailFields: FieldSpec[];
  themes: ThemeSpec[];
};

const InputGroup = memo(({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
      {label}
    </label>
    {type === "textarea" ? (
      <textarea
        className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow min-h-[90px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    ) : (
      <input
        type={type}
        className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )}
  </div>
), (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.value === nextProps.value &&
    prevProps.label === nextProps.label &&
    prevProps.type === nextProps.type &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.onChange === nextProps.onChange
  );
});

InputGroup.displayName = "InputGroup";

const ThemeSwatch = ({
  theme,
  active,
  onClick,
}: {
  theme: ThemeSpec;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`relative overflow-hidden rounded-lg border text-left transition-all ${
      active
        ? "border-indigo-600 ring-1 ring-indigo-600 shadow-md"
        : "border-slate-200 hover:border-slate-400 hover:shadow-sm"
    }`}
  >
    <div className={`h-12 w-full ${theme.preview} border-b border-black/5`} />
    <div className="p-3">
      <div className="text-sm font-semibold text-slate-800">{theme.name}</div>
      <div className="text-xs text-slate-500">Palette preset</div>
    </div>
  </button>
);

export function createSimpleCustomizePage(config: SimpleTemplateConfig) {
  return function SimpleCustomizePage() {
    const search = useSearchParams();
    const router = useRouter();
    const defaultDate = search?.get("d") ?? undefined;
    const initialDate = useMemo(() => {
      if (!defaultDate) {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split("T")[0];
      }
      try {
        const d = new Date(defaultDate);
        return Number.isNaN(d.getTime())
          ? new Date().toISOString().split("T")[0]
          : d.toISOString().split("T")[0];
      } catch {
        return new Date().toISOString().split("T")[0];
      }
    }, [defaultDate]);

    const [data, setData] = useState(() => ({
      title: `${config.displayName}`,
      date: initialDate,
      time: "14:00",
      city: "Chicago",
      state: "IL",
      venue: "",
      details: "",
      hero: "",
      rsvpEnabled: true,
      rsvpDeadline: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 10);
        return d.toISOString().split("T")[0];
      })(),
      extra: Object.fromEntries(config.detailFields.map((f) => [f.key, ""])),
    }));
    const [themeId, setThemeId] = useState(
      config.themes[0]?.id ?? "default-theme"
    );
    const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
    const [rsvpAttending, setRsvpAttending] = useState("yes");
    const [submitting, setSubmitting] = useState(false);
    const [themesExpanded, setThemesExpanded] = useState(false);
    const {
      mobileMenuOpen,
      openMobileMenu,
      closeMobileMenu,
      previewTouchHandlers,
      drawerTouchHandlers,
    } = useMobileDrawer();

    const currentTheme =
      config.themes.find((t) => t.id === themeId) || config.themes[0];

    const isDarkBackground = useMemo(() => {
      const bg = currentTheme?.bg?.toLowerCase() ?? "";
      const id = currentTheme?.id?.toLowerCase() ?? "";
      const darkTokens = [
        "black",
        "slate-9",
        "stone-9",
        "neutral-9",
        "gray-9",
        "grey-9",
        "indigo-9",
        "purple-9",
        "violet-9",
        "emerald-9",
        "teal-9",
        "blue-9",
        "navy",
        "midnight",
      ];
      const hasDarkToken = darkTokens.some((token) => bg.includes(token));
      const hasDarkHex = /#0[0-9a-f]{5,}/i.test(bg);
      const idHintsDark = /(night|dark)/i.test(id);
      return hasDarkToken || hasDarkHex || idHintsDark;
    }, [currentTheme]);

    const rawTextClass = currentTheme?.text || "";
    const forceLightText =
      isDarkBackground && !rawTextClass.toLowerCase().includes("text-white");
    const textClass = forceLightText
      ? "text-white"
      : rawTextClass || "text-white";
    const accentClass = forceLightText
      ? "text-white"
      : currentTheme?.accent || textClass;
    const usesLightText = /text-(white|slate-50|neutral-50|gray-50)/.test(
      textClass
    );
    const headingShadow = usesLightText
      ? { textShadow: "0 2px 6px rgba(0,0,0,0.55)" }
      : undefined;
    const bodyShadow = usesLightText
      ? { textShadow: "0 1px 3px rgba(0,0,0,0.45)" }
      : undefined;
    // Title color for dark backgrounds - light gold/beige
    const titleColor = isDarkBackground
      ? { color: "#f5e6d3" } // Light beige/gold
      : undefined;

    const locationParts = [data.venue, data.city, data.state]
      .filter(Boolean)
      .join(", ");

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setData((prev) => ({ ...prev, hero: url }));
      }
    };

    const updateExtra = useCallback((key: string, value: string) => {
      setData((prev) => ({
        ...prev,
        extra: { ...prev.extra, [key]: value },
      }));
    }, []);

    const handlePublish = useCallback(async () => {
      if (submitting) return;
      setSubmitting(true);
      try {
        let startISO: string | null = null;
        let endISO: string | null = null;
        if (data.date) {
          const start = new Date(`${data.date}T${data.time || "14:00"}:00`);
          const end = new Date(start);
          end.setHours(end.getHours() + 2);
          startISO = start.toISOString();
          endISO = end.toISOString();
        }

        const payload: any = {
          title: data.title || config.displayName,
          data: {
            category: config.category,
            createdVia: "template",
            createdManually: true,
            startISO,
            endISO,
            location: locationParts || undefined,
            venue: data.venue || undefined,
            description: data.details || undefined,
            rsvp: data.rsvpEnabled ? data.rsvpDeadline || undefined : undefined,
            numberOfGuests: 0,
            templateId: config.slug,
            customFields: data.extra,
            heroImage: data.hero || config.defaultHero,
          },
        };

        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        const id = (json as any)?.id as string | undefined;
        if (!id) throw new Error("Failed to create event");
        router.push(`/event/${id}?created=1`);
      } catch (err: any) {
        alert(String(err?.message || err || "Failed to create event"));
      } finally {
        setSubmitting(false);
      }
    }, [
      submitting,
      data.date,
      data.time,
      data.title,
      data.details,
      data.venue,
      data.hero,
      data.rsvpEnabled,
      data.rsvpDeadline,
      data.extra,
      locationParts,
      config.category,
      config.displayName,
      config.slug,
      config.defaultHero,
      router,
    ]);

    const infoLine = (
      <div
        className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-base font-medium opacity-90 ${textClass}`}
        style={bodyShadow}
      >
        <span>
          {new Date(data.date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <span className="hidden md:inline-block w-1 h-1 rounded-full bg-current opacity-50"></span>
        <span>{data.time}</span>
        {locationParts && (
          <>
            <span className="hidden md:inline-block w-1 h-1 rounded-full bg-current opacity-50"></span>
            <span className="md:truncate">{locationParts}</span>
          </>
        )}
      </div>
    );

    return (
      <div className="relative flex h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
        <div
          {...previewTouchHandlers}
          className="flex-1 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px] my-4 md:my-8 transition-all duration-500 ease-in-out">
            <div
              className={`min-h-[780px] w-full shadow-2xl md:rounded-xl overflow-hidden flex flex-col ${currentTheme.bg} ${textClass} transition-all duration-500 relative z-0`}
            >
              <div className="relative z-10">
                <div
                  className={`p-6 md:p-8 border-b border-white/10 ${textClass}`}
                >
                  <div
                    className="cursor-pointer hover:opacity-80 transition-opacity group"
                    onClick={() => {}}
                  >
                    <h1
                      className={`text-3xl md:text-5xl font-serif mb-2 leading-tight flex items-center gap-2 ${textClass}`}
                      style={{
                        fontFamily: "var(--font-playfair)",
                        ...(headingShadow || {}),
                        ...(titleColor || {}),
                      }}
                    >
                      {data.title || config.displayName}
                      <span className="inline-block ml-2 opacity-0 group-hover:opacity-50 transition-opacity">
                        <Edit2 size={22} />
                      </span>
                    </h1>
                    {infoLine}
                  </div>
                </div>

                <div className="relative w-full h-64 md:h-96">
                  {data.hero ? (
                    <img
                      src={data.hero}
                      alt="Hero"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={config.defaultHero}
                      alt="Hero"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 1000px"
                    />
                  )}
                </div>

                <section className="py-10 border-t border-white/10 px-6 md:px-10">
                  <h2
                    className={`text-2xl mb-3 ${accentClass}`}
                    style={{ ...headingShadow, ...(titleColor || {}) }}
                  >
                    Details
                  </h2>
                  {data.details ? (
                    <p
                      className={`text-base leading-relaxed opacity-90 whitespace-pre-wrap ${textClass}`}
                      style={bodyShadow}
                    >
                      {data.details}
                    </p>
                  ) : (
                    <p
                      className={`text-sm opacity-70 ${textClass}`}
                      style={bodyShadow}
                    >
                      Add a short description so guests know what to expect.
                    </p>
                  )}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.detailFields.map((field) => {
                      const val = data.extra[field.key];
                      return (
                        <div
                          key={field.key}
                          className="bg-white/5 border border-white/10 rounded-lg p-4"
                        >
                          <div
                            className={`text-xs uppercase tracking-wide opacity-80 ${textClass}`}
                            style={bodyShadow}
                          >
                            {field.label}
                          </div>
                          <div
                            className={`mt-2 text-base font-semibold opacity-90 ${textClass}`}
                            style={bodyShadow}
                          >
                            {val || "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {data.rsvpEnabled && (
                  <section className="max-w-xl mx-auto text-center p-6 md:p-8">
                    <h2
                      className={`text-2xl mb-6 ${accentClass}`}
                      style={{ ...headingShadow, ...(titleColor || {}) }}
                    >
                      RSVP
                    </h2>
                    <div className="bg-white/5 border border-white/10 p-8 rounded-xl text-left">
                      {!rsvpSubmitted ? (
                        <div className="space-y-6">
                          <div className="text-center mb-4">
                            <p className="opacity-80">
                              {data.rsvpDeadline
                                ? `Kindly respond by ${new Date(
                                    data.rsvpDeadline
                                  ).toLocaleDateString()}`
                                : "Please RSVP"}
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
                              Full Name
                            </label>
                            <input
                              className="w-full p-4 rounded-lg bg-white/10 border border-white/20 focus:border-white/50 outline-none transition-colors text-inherit placeholder:text-inherit/30"
                              placeholder="Guest Name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-3">
                              Attending?
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <label className="group relative cursor-pointer">
                                <input
                                  type="radio"
                                  name="attending"
                                  className="peer sr-only"
                                  checked={rsvpAttending === "yes"}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setRsvpAttending("yes");
                                  }}
                                />
                                <div className="p-5 rounded-xl border-2 border-white/20 bg-white/10 hover:bg-white/20 transition-all flex items-start gap-3 peer-checked:border-current peer-checked:bg-white/25">
                                  <div className="mt-0.5">
                                    <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                                      <div className="w-3 h-3 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                  <div className="text-left">
                                    <div className="font-semibold">
                                      Joyfully Accept
                                    </div>
                                    <p className="text-sm opacity-70">
                                      We’ll be there.
                                    </p>
                                  </div>
                                </div>
                              </label>
                              <label className="group relative cursor-pointer">
                                <input
                                  type="radio"
                                  name="attending"
                                  className="peer sr-only"
                                  checked={rsvpAttending === "no"}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setRsvpAttending("no");
                                  }}
                                />
                                <div className="p-5 rounded-xl border-2 border-white/20 bg-white/10 hover:bg-white/20 transition-all flex items-start gap-3 peer-checked:border-current peer-checked:bg-white/25">
                                  <div className="mt-0.5">
                                    <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                                      <div className="w-3 h-3 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                  <div className="text-left">
                                    <div className="font-semibold">
                                      Regretfully Decline
                                    </div>
                                    <p className="text-sm opacity-70">
                                      Sending warm wishes.
                                    </p>
                                  </div>
                                </div>
                              </label>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRsvpSubmitted(true);
                            }}
                            className="w-full py-4 mt-2 bg-white text-slate-900 font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-slate-200 transition-colors shadow-lg"
                          >
                            Send RSVP
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-4xl mb-4">🎉</div>
                          <h3 className="text-2xl font-serif mb-2">
                            Thank you!
                          </h3>
                          <p className="opacity-70">Your RSVP has been sent.</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRsvpSubmitted(false);
                              setRsvpAttending("yes");
                            }}
                            className="text-sm underline mt-6 opacity-50 hover:opacity-100"
                          >
                            Send another response
                          </button>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                <footer className="text-center py-8 border-t border-white/10 mt-1">
                  <p className="text-sm opacity-60">
                    Powered By Envitefy. Creat. Share. Enjoy.
                  </p>
                </footer>
              </div>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 bg-slate-900/50 z-10"
            onClick={closeMobileMenu}
            role="presentation"
          ></div>
        )}

        <div
          className={`w-full md:w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 absolute md:relative top-0 right-0 bottom-0 h-full transition-transform duration-300 transform md:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          {...drawerTouchHandlers}
        >
          <div
            className="flex-1 overflow-y-auto"
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            <div className="md:hidden sticky top-0 z-20 flex items-center justify-between bg-white border-b border-slate-100 px-4 py-3 gap-3">
              <button
                onClick={closeMobileMenu}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-full px-3 py-1"
              >
                <ChevronLeft size={14} />
                Back to preview
              </button>
              <span className="text-sm font-semibold text-slate-700">
                Customize
              </span>
            </div>

            <div className="p-6 pt-4 md:pt-6 space-y-8">
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-800">
                  {config.displayName}
                </h2>
                <p className="text-sm text-slate-500">
                  Tweak your date, location, and details. Themes update the
                  preview instantly.
                </p>
              </div>

              <InputGroup
                label="Headline"
                value={data.title}
                onChange={(v) => setData((p) => ({ ...p, title: v }))}
                placeholder={`${config.displayName} title`}
              />

              <div className="grid grid-cols-2 gap-4">
                <InputGroup
                  label="Date"
                  type="date"
                  value={data.date}
                  onChange={(v) => setData((p) => ({ ...p, date: v }))}
                />
                <InputGroup
                  label="Time"
                  type="time"
                  value={data.time}
                  onChange={(v) => setData((p) => ({ ...p, time: v }))}
                />
              </div>

              <InputGroup
                label="Venue"
                value={data.venue}
                onChange={(v) => setData((p) => ({ ...p, venue: v }))}
                placeholder="Venue name (optional)"
              />
              <div className="grid grid-cols-2 gap-4">
                <InputGroup
                  label="City"
                  value={data.city}
                  onChange={(v) => setData((p) => ({ ...p, city: v }))}
                />
                <InputGroup
                  label="State"
                  value={data.state}
                  onChange={(v) => setData((p) => ({ ...p, state: v }))}
                />
              </div>

              <InputGroup
                label="Description"
                type="textarea"
                value={data.details}
                onChange={(v) => setData((p) => ({ ...p, details: v }))}
                placeholder="Tell guests what to expect."
              />

              <div className="grid grid-cols-1 gap-4">
                {config.detailFields.map((field) => (
                  <InputGroup
                    key={field.key}
                    label={field.label}
                    type={field.type === "textarea" ? "textarea" : "text"}
                    value={data.extra[field.key] || ""}
                    onChange={(v) => updateExtra(field.key, v)}
                    placeholder={field.placeholder}
                  />
                ))}
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Hero Image
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:bg-slate-50 transition-colors relative">
                  {data.hero ? (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden">
                      <img
                        src={data.hero}
                        alt="Hero"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setData((p) => ({ ...p, hero: "" }))}
                        className="absolute top-2 right-2 px-2 py-1 text-xs bg-white rounded-full shadow hover:bg-red-50 text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <ImageIcon size={20} />
                      </div>
                      <p className="text-sm text-slate-600 mb-1">
                        Upload header photo
                      </p>
                      <p className="text-xs text-slate-400">
                        Recommended: 1600x900px
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setThemesExpanded(!themesExpanded)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 hover:text-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Palette size={16} /> Theme ({config.themes.length})
                  </div>
                  {themesExpanded ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
                {themesExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                    {config.themes.map((theme) => (
                      <ThemeSwatch
                        key={theme.id}
                        theme={theme}
                        active={themeId === theme.id}
                        onClick={() => setThemeId(theme.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 sticky bottom-0">
            <button
              onClick={handlePublish}
              disabled={submitting}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm tracking-wide transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>

        {!mobileMenuOpen && (
          <div className="md:hidden fixed bottom-4 right-4 z-30">
            <button
              type="button"
              onClick={openMobileMenu}
              className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-3 text-sm font-semibold shadow-lg"
            >
              <Menu size={18} />
              Edit
            </button>
          </div>
        )}
      </div>
    );
  };
}
