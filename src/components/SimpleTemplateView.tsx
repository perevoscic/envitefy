// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Share2,
  Calendar as CalendarIcon,
  Apple,
  MapPin,
  Clock,
  ExternalLink,
  Users,
  Check,
  HelpCircle,
  X,
  Bus,
  Hotel,
  FileText,
  CheckSquare,
  Car,
  Megaphone,
} from "lucide-react";
import EventEditModal from "@/components/EventEditModal";
import EventDeleteModal from "@/components/EventDeleteModal";
import EventActions from "@/components/EventActions";

type ThemeSpec = {
  id: string;
  name: string;
  bg: string;
  text: string;
  accent: string;
  preview?: string;
};

type SimpleTemplateViewProps = {
  eventId: string;
  eventData: any;
  eventTitle: string;
  isOwner: boolean;
  isReadOnly: boolean;
  viewerKind: "owner" | "guest" | "readonly";
  shareUrl: string;
  sessionEmail: string | null;
};

export default function SimpleTemplateView({
  eventId,
  eventData,
  eventTitle,
  isOwner,
  isReadOnly,
  viewerKind,
  shareUrl,
  sessionEmail,
}: SimpleTemplateViewProps) {
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpAttending, setRsvpAttending] = useState("yes");

  // Default theme fallback
  const DEFAULT_THEME: ThemeSpec = {
    id: "default",
    name: "Default",
    bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700",
    text: "text-white",
    accent: "text-white",
    preview: "bg-slate-800",
  };

  // Extract theme directly from event data - it should have the full theme object
  const theme: ThemeSpec = (() => {
    // The theme object should be stored directly in eventData.theme
    const storedTheme = eventData?.theme;

    // Debug logging
    if (typeof window !== "undefined") {
      console.log("[SimpleTemplateView] eventData.theme:", storedTheme);
      console.log(
        "[SimpleTemplateView] eventData.themeId:",
        eventData?.themeId
      );
      console.log(
        "[SimpleTemplateView] eventData.address:",
        eventData?.address
      );
    }

    if (storedTheme?.bg && storedTheme?.text) {
      return storedTheme;
    }
    return DEFAULT_THEME;
  })();

  // Template config
  const templateConfig = eventData?.templateConfig || {};
  const detailFields = templateConfig?.detailFields || [];
  const rsvpCopy = templateConfig?.rsvpCopy || {
    editorTitle: "RSVP",
    toggleLabel: "Enable RSVP",
    deadlineLabel: "RSVP Deadline",
  };

  // Event data extraction
  const heroImage = eventData?.heroImage || "";
  const description = eventData?.description || "";
  const customFields = eventData?.customFields || {};
  const advancedSections =
    eventData?.advancedSections || customFields?.advancedSections || {};
  const rsvpEnabled = eventData?.rsvpEnabled ?? false;
  const rsvpDeadline = eventData?.rsvpDeadline || "";
  const venue = eventData?.venue || "";
  const city = eventData?.city || "";
  const state = eventData?.state || "";
  const address = eventData?.address || "";
  const time = eventData?.time || "";
  const date = eventData?.date || "";

  // Format date
  const formatDate = (d: string) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  // Format time
  const formatTime = (t: string) => {
    if (!t) return "";
    try {
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    } catch {
      return t;
    }
  };

  // Build location string for header (compact)
  const headerLocation = [venue, city, state].filter(Boolean).join(", ");
  // Full location with address
  const fullLocation = [venue, address, city, state].filter(Boolean).join(", ");

  // Theme classes
  const isDarkBackground = (() => {
    const bg = theme?.bg?.toLowerCase() ?? "";
    const id = theme?.id?.toLowerCase() ?? "";
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
      "from-slate-9",
      "from-purple-9",
      "from-indigo-9",
      "from-blue-9",
      "from-red-9",
      "from-rose-9",
      "from-orange-9",
      "from-cyan-9",
      "from-green-9",
      "from-emerald-9",
      "from-violet-9",
      "from-fuchsia",
      "from-yellow-6",
      "from-amber-9",
    ];
    return (
      darkTokens.some((token) => bg.includes(token)) ||
      /#0[0-9a-f]{5,}/i.test(bg) ||
      /(night|dark|midnight)/i.test(id) ||
      bg.includes("900") ||
      bg.includes("950") ||
      bg.includes("800")
    );
  })();

  const rawTextClass = theme?.text || "";
  const forceLightText =
    isDarkBackground && !rawTextClass.toLowerCase().includes("text-white");
  const textClass = forceLightText
    ? "text-white"
    : rawTextClass || "text-white";
  const accentClass = theme?.accent || textClass;
  const usesLightText =
    /text-(white|slate-50|neutral-50|gray-50)/.test(textClass) ||
    isDarkBackground;
  const headingShadow = usesLightText
    ? { textShadow: "0 2px 6px rgba(0,0,0,0.55)" }
    : undefined;
  const bodyShadow = usesLightText
    ? { textShadow: "0 1px 3px rgba(0,0,0,0.45)" }
    : undefined;
  const titleColor = isDarkBackground ? { color: "#f5e6d3" } : undefined;

  // Calendar handlers
  const toGoogleDate = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const buildEventDetails = () => {
    let start: Date | null = null;
    if (date) {
      const tentative = new Date(`${date}T${time || "14:00"}`);
      if (!Number.isNaN(tentative.getTime())) start = tentative;
    }
    if (!start) start = new Date();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return {
      title: eventTitle,
      start,
      end,
      location: fullLocation,
      description,
    };
  };

  const buildIcsUrl = (details: ReturnType<typeof buildEventDetails>) => {
    const params = new URLSearchParams();
    params.set("title", details.title);
    if (details.start) params.set("start", details.start.toISOString());
    if (details.end) params.set("end", details.end.toISOString());
    if (details.location) params.set("location", details.location);
    if (details.description) params.set("description", details.description);
    params.set("disposition", "inline");
    return `/api/ics?${params.toString()}`;
  };

  const openWithAppFallback = (appUrl: string, webUrl: string) => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }, 700);
    const clear = () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", clear);
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") clear();
    });
    try {
      window.location.href = appUrl;
    } catch {
      clearTimeout(timer);
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleShare = () => {
    const details = buildEventDetails();
    if (
      typeof navigator !== "undefined" &&
      (navigator as any).share &&
      shareUrl
    ) {
      (navigator as any)
        .share({
          title: details.title,
          text: details.description || details.location || details.title,
          url: shareUrl,
        })
        .catch(() => {
          window.open(shareUrl, "_blank", "noopener,noreferrer");
        });
    } else if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleGoogleCalendar = () => {
    const details = buildEventDetails();
    const start = toGoogleDate(details.start);
    const end = toGoogleDate(details.end);
    const query = `action=TEMPLATE&text=${encodeURIComponent(
      details.title
    )}&dates=${start}/${end}&location=${encodeURIComponent(
      details.location
    )}&details=${encodeURIComponent(details.description || "")}`;
    const webUrl = `https://calendar.google.com/calendar/render?${query}`;
    const appUrl = `comgooglecalendar://?${query}`;
    openWithAppFallback(appUrl, webUrl);
  };

  const handleOutlookCalendar = () => {
    const details = buildEventDetails();
    const webUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
      details.title
    )}&body=${encodeURIComponent(
      details.description || ""
    )}&location=${encodeURIComponent(
      details.location
    )}&startdt=${encodeURIComponent(
      details.start.toISOString()
    )}&enddt=${encodeURIComponent(details.end.toISOString())}`;
    const appUrl = `ms-outlook://events/new?subject=${encodeURIComponent(
      details.title
    )}&body=${encodeURIComponent(
      details.description || ""
    )}&location=${encodeURIComponent(
      details.location
    )}&startdt=${encodeURIComponent(
      details.start.toISOString()
    )}&enddt=${encodeURIComponent(details.end.toISOString())}`;
    openWithAppFallback(appUrl, webUrl);
  };

  const handleAppleCalendar = () => {
    const details = buildEventDetails();
    const icsPath = buildIcsUrl(details);
    const absoluteIcs =
      typeof window !== "undefined"
        ? `${window.location.origin}${icsPath}`
        : icsPath;
    window.location.href = absoluteIcs;
  };

  // Section presence flags and navigation items
  const hasRoster = Array.isArray(advancedSections?.roster?.athletes)
    ? advancedSections.roster.athletes.length > 0
    : false;
  const hasMeet = Boolean(advancedSections?.meet?.session);
  const hasPractice = Array.isArray(advancedSections?.practice?.blocks)
    ? advancedSections.practice.blocks.length > 0
    : false;
  const hasLogistics = (() => {
    const logistics = advancedSections?.logistics;
    if (!logistics) return false;
    return (
      Boolean(logistics.transport) ||
      Boolean(logistics.hotel) ||
      Boolean(logistics.meals) ||
      (logistics.forms?.length ?? 0) > 0
    );
  })();
  const hasGear = (advancedSections?.gear?.items?.length ?? 0) > 0;
  const hasVolunteers =
    (advancedSections?.volunteers?.slots?.length ?? 0) > 0 ||
    (advancedSections?.volunteers?.carpools?.length ?? 0) > 0;
  const hasAnnouncements =
    (advancedSections?.announcements?.items?.length ?? 0) > 0;
  const hasRsvpSection = rsvpEnabled;

  const navItems = useMemo(
    () =>
      [
        { id: "details", label: "Details", enabled: true },
        { id: "roster", label: "Roster", enabled: hasRoster },
        { id: "meet", label: "Meet", enabled: hasMeet },
        { id: "practice", label: "Practice", enabled: hasPractice },
        { id: "logistics", label: "Logistics", enabled: hasLogistics },
        { id: "gear", label: "Gear", enabled: hasGear },
        { id: "volunteers", label: "Volunteers", enabled: hasVolunteers },
        { id: "announcements", label: "Announcements", enabled: hasAnnouncements },
        { id: "rsvp", label: "RSVP", enabled: hasRsvpSection },
      ].filter((item) => item.enabled),
    [
      hasAnnouncements,
      hasGear,
      hasLogistics,
      hasMeet,
      hasPractice,
      hasRoster,
      hasRsvpSection,
      hasVolunteers,
    ]
  );

  const [activeSection, setActiveSection] = useState<string>(
    navItems[0]?.id || "details"
  );

  useEffect(() => {
    if (!navItems.length) return;

    const updateActiveFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && navItems.some((i) => i.id === hash)) {
        setActiveSection(hash);
      } else {
        setActiveSection(navItems[0].id);
      }
    };

    updateActiveFromHash();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id && navItems.some((i) => i.id === id)) {
              setActiveSection(id);
              if (window.location.hash !== `#${id}`) {
                window.history.replaceState(null, "", `#${id}`);
              }
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    const targets = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];
    targets.forEach((el) => observer.observe(el));

    window.addEventListener("hashchange", updateActiveFromHash);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", updateActiveFromHash);
    };
  }, [navItems]);

  // Render roster section
  const renderRosterSection = () => {
    const roster = advancedSections?.roster;
    if (!roster?.athletes?.length) return null;

    const statusIcon = (status: string) => {
      switch (status) {
        case "going":
          return <Check size={16} className="text-green-400" />;
        case "notgoing":
          return <X size={16} className="text-red-400" />;
        case "maybe":
          return <HelpCircle size={16} className="text-yellow-400" />;
        default:
          return <HelpCircle size={16} className="text-gray-400" />;
      }
    };

    const confirmed = roster.athletes.filter(
      (a: any) => a.status === "going"
    ).length;
    const pending = roster.athletes.filter(
      (a: any) => a.status !== "going" && a.status !== "notgoing"
    ).length;

    return (
      <section
        id="roster"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Team Roster
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roster.athletes.map((athlete: any, idx: number) => (
            <div
              key={idx}
              className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <div
                  className={`font-semibold ${textClass}`}
                  style={bodyShadow}
                >
                  {athlete.name}
                </div>
                <div
                  className={`text-sm opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  Level {athlete.level} •{" "}
                  {athlete.events?.join(", ") || "All events"}
                </div>
              </div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
                {statusIcon(athlete.status)}
              </div>
            </div>
          ))}
        </div>
        <div
          className={`mt-4 text-sm opacity-70 ${textClass}`}
          style={bodyShadow}
        >
          {confirmed} confirmed • {pending} pending
        </div>
      </section>
    );
  };

  // Render meet section
  const renderMeetSection = () => {
    const meet = advancedSections?.meet;
    if (!meet?.session) return null;

    return (
      <section
        id="meet"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Meet Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div
              className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
            >
              Session
            </div>
            <div className={`mt-1 font-bold ${textClass}`} style={bodyShadow}>
              {meet.session}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div
              className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
            >
              Warm-up
            </div>
            <div className={`mt-1 font-bold ${textClass}`} style={bodyShadow}>
              {meet.warmupTime || "—"}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div
              className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
            >
              March-in
            </div>
            <div className={`mt-1 font-bold ${textClass}`} style={bodyShadow}>
              {meet.marchInTime || "—"}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div
              className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
            >
              Start
            </div>
            <div className={`mt-1 font-bold ${textClass}`} style={bodyShadow}>
              {meet.startApparatus || "—"}
            </div>
          </div>
        </div>
        {meet.rotationOrder?.length > 0 && (
          <div
            className={`flex items-center gap-2 flex-wrap mb-4 ${textClass}`}
            style={bodyShadow}
          >
            <span className="opacity-70">Rotation:</span>
            {meet.rotationOrder.map((app: string, idx: number) => (
              <React.Fragment key={idx}>
                <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                  {app}
                </span>
                {idx < meet.rotationOrder.length - 1 && (
                  <span className="opacity-50">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        {meet.notes && (
          <p className={`text-sm opacity-80 ${textClass}`} style={bodyShadow}>
            {meet.notes}
          </p>
        )}
        {meet.scoresLink && (
          <a
            href={meet.scoresLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ExternalLink size={16} />
            <span>View Live Scores</span>
          </a>
        )}
      </section>
    );
  };

  // Render practice section
  const renderPracticeSection = () => {
    const practice = advancedSections?.practice;
    if (!practice?.blocks?.length) return null;

    return (
      <section
        id="practice"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Practice Schedule
        </h2>
        <div className="space-y-4">
          {practice.blocks.map((block: any, idx: number) => (
            <div
              key={idx}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-semibold ${textClass}`}
                  style={bodyShadow}
                >
                  {block.day}
                </span>
                <span className={`text-sm opacity-70 ${textClass}`}>
                  {block.time}
                </span>
              </div>
              <div className={`text-sm ${textClass}`} style={bodyShadow}>
                <span className="opacity-70">Focus:</span>{" "}
                {block.focus?.join(", ") || "General"}
              </div>
              {block.goals && (
                <p className={`text-sm opacity-70 mt-2 ${textClass}`}>
                  {block.goals}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  // Render logistics section
  const renderLogisticsSection = () => {
    const logistics = advancedSections?.logistics;
    if (!logistics) return null;

    const hasContent =
      logistics.transport ||
      logistics.hotel ||
      logistics.meals ||
      logistics.forms?.length;
    if (!hasContent) return null;

    return (
      <section
        id="logistics"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Logistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {logistics.transport && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bus size={18} className={accentClass} />
                <span
                  className={`font-semibold ${textClass}`}
                  style={bodyShadow}
                >
                  Transportation
                </span>
              </div>
              <p className={`text-sm opacity-80 ${textClass}`}>
                {logistics.transport}
              </p>
              {logistics.callTime && (
                <p className={`text-sm mt-2 ${textClass}`}>
                  <span className="opacity-70">Call time:</span>{" "}
                  {logistics.callTime}
                </p>
              )}
            </div>
          )}
          {logistics.hotel && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hotel size={18} className={accentClass} />
                <span
                  className={`font-semibold ${textClass}`}
                  style={bodyShadow}
                >
                  Hotel
                </span>
              </div>
              <p className={`text-sm opacity-80 ${textClass}`}>
                {logistics.hotel}
              </p>
            </div>
          )}
          {logistics.meals && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`font-semibold ${textClass}`}
                  style={bodyShadow}
                >
                  🍽️ Meals
                </span>
              </div>
              <p className={`text-sm opacity-80 ${textClass}`}>
                {logistics.meals}
              </p>
            </div>
          )}
          {logistics.forms?.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={18} className={accentClass} />
                <span
                  className={`font-semibold ${textClass}`}
                  style={bodyShadow}
                >
                  Required Forms
                </span>
              </div>
              <ul className="space-y-1">
                {logistics.forms.map((form: any, idx: number) => (
                  <li key={idx}>
                    {form.url ? (
                      <a
                        href={form.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm underline ${accentClass}`}
                      >
                        {form.name}
                      </a>
                    ) : (
                      <span className={`text-sm opacity-80 ${textClass}`}>
                        {form.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    );
  };

  // Render gear section
  const renderGearSection = () => {
    const gear = advancedSections?.gear;
    if (!gear?.items?.length) return null;

    return (
      <section
        id="gear"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Gear & Uniform Checklist
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {gear.items.map((item: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3"
            >
              <CheckSquare size={18} className={accentClass} />
              <span className={`${textClass}`} style={bodyShadow}>
                {item.name || item}
              </span>
            </div>
          ))}
        </div>
        {gear.notes && (
          <p
            className={`text-sm opacity-70 mt-4 ${textClass}`}
            style={bodyShadow}
          >
            {gear.notes}
          </p>
        )}
      </section>
    );
  };

  // Render volunteers section
  const renderVolunteersSection = () => {
    const volunteers = advancedSections?.volunteers;
    if (!volunteers?.slots?.length && !volunteers?.carpools?.length)
      return null;

    return (
      <section
        id="volunteers"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Volunteers & Carpool
        </h2>
        {volunteers.slots?.length > 0 && (
          <div className="mb-6">
            <h3
              className={`text-lg font-semibold mb-3 ${textClass}`}
              style={bodyShadow}
            >
              Volunteer Slots
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {volunteers.slots.map((slot: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3"
                >
                  <div>
                    <div
                      className={`font-medium ${textClass}`}
                      style={bodyShadow}
                    >
                      {slot.role}
                    </div>
                    {slot.assignee && (
                      <div className={`text-sm opacity-70 ${textClass}`}>
                        {slot.assignee}
                      </div>
                    )}
                  </div>
                  {slot.assignee ? (
                    <Check size={18} className="text-green-400" />
                  ) : (
                    <span
                      className={`text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded`}
                    >
                      Open
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {volunteers.carpools?.length > 0 && (
          <div>
            <h3
              className={`text-lg font-semibold mb-3 ${textClass}`}
              style={bodyShadow}
            >
              Carpool
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {volunteers.carpools.map((carpool: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3"
                >
                  <Car size={18} className={accentClass} />
                  <div>
                    <div
                      className={`font-medium ${textClass}`}
                      style={bodyShadow}
                    >
                      {carpool.driver}
                    </div>
                    <div className={`text-sm opacity-70 ${textClass}`}>
                      {carpool.seats} seats • {carpool.direction || "Both ways"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  };

  // Render announcements section
  const renderAnnouncementsSection = () => {
    const announcements = advancedSections?.announcements;
    if (!announcements?.items?.length) return null;

    return (
      <section
        id="announcements"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Announcements
        </h2>
        <div className="space-y-4">
          {announcements.items.map((item: any, idx: number) => (
            <div
              key={idx}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <Megaphone size={20} className={accentClass} />
                <div>
                  {item.title && (
                    <div
                      className={`font-semibold mb-1 ${textClass}`}
                      style={bodyShadow}
                    >
                      {item.title}
                    </div>
                  )}
                  <p
                    className={`text-sm opacity-90 ${textClass}`}
                    style={bodyShadow}
                  >
                    {item.message}
                  </p>
                  {item.date && (
                    <p className={`text-xs opacity-50 mt-2 ${textClass}`}>
                      {item.date}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  // Info line for header
  const infoLine = (
    <div
      className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-base font-medium opacity-90 ${textClass}`}
      style={bodyShadow}
    >
      {date && <span>{formatDate(date)}</span>}
      {date && time && (
        <span className="hidden md:inline-block w-1 h-1 rounded-full bg-current opacity-50"></span>
      )}
      {time && <span>{formatTime(time)}</span>}
      {headerLocation && (
        <>
          <span className="hidden md:inline-block w-1 h-1 rounded-full bg-current opacity-50"></span>
          <span className="md:truncate">{headerLocation}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#f0f2f5] flex justify-center py-4 md:py-8">
      <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px]">
        <div
          className={`min-h-[780px] w-full shadow-2xl md:rounded-xl overflow-hidden flex flex-col ${theme.bg} ${textClass} transition-all duration-500 relative z-0`}
        >
          <div className="relative z-10">
            {/* Header */}
            <div
              className={`relative p-6 md:p-8 border-b border-white/10 ${textClass}`}
            >
              {/* Actions - White background bar with Edit/Delete/Share/Email */}
              {!isReadOnly && (
                <div className="absolute top-3 right-3 z-40">
                  <div className="flex items-center gap-1 text-sm font-medium bg-white/95 backdrop-blur rounded-lg px-2 py-1.5 shadow-lg border border-white/20">
                    {isOwner && (
                      <>
                        <EventEditModal
                          eventId={eventId}
                          eventData={eventData}
                          eventTitle={eventTitle}
                        />
                        <EventDeleteModal
                          eventId={eventId}
                          eventTitle={eventTitle}
                        />
                      </>
                    )}
                    <EventActions
                      shareUrl={shareUrl}
                      event={eventData}
                      historyId={eventId}
                      className=""
                      variant="compact"
                      tone="default"
                    />
                  </div>
                </div>
              )}
              <div className="pr-32">
                <h1
                  className={`text-3xl md:text-5xl font-serif mb-2 leading-tight ${textClass}`}
                  style={{
                    fontFamily: "var(--font-playfair)",
                    ...(headingShadow || {}),
                    ...(titleColor || {}),
                  }}
                >
                  {eventTitle}
                </h1>
                {infoLine}
                {/* Address line (if different from header location) */}
                {address && (
                  <div
                    className={`mt-2 text-sm opacity-80 flex items-center gap-2 ${textClass}`}
                    style={bodyShadow}
                  >
                    <MapPin size={14} />
                    <span>{address}</span>
                  </div>
                )}
                {navItems.length > 1 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {navItems.map((item) => {
                      const isActive = activeSection === item.id;
                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const el = document.getElementById(item.id);
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth" });
                              window.history.replaceState(
                                null,
                                "",
                                `#${item.id}`
                              );
                              setActiveSection(item.id);
                            }
                          }}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold transition border ${
                            isActive
                              ? "bg-white/80 text-[#1b1540] border-white/90 shadow"
                              : "bg-white/10 text-inherit border-white/20 hover:bg-white/20"
                          }`}
                        >
                          {item.label}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative w-full h-64 md:h-96">
              {heroImage ? (
                heroImage.startsWith("http") ? (
                  <Image
                    src={heroImage}
                    alt="Hero"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 1000px"
                  />
                ) : (
                  <img
                    src={heroImage}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full bg-white/5" />
              )}
            </div>

            {/* Details Section */}
            <section
              id="details"
              className="py-10 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
            >
              <h2
                className={`text-2xl mb-3 ${accentClass}`}
                style={{ ...headingShadow, ...(titleColor || {}) }}
              >
                Details
              </h2>
              {description ? (
                <p
                  className={`text-base leading-relaxed opacity-90 whitespace-pre-wrap ${textClass}`}
                  style={bodyShadow}
                >
                  {description}
                </p>
              ) : (
                <p
                  className={`text-sm opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  No description provided.
                </p>
              )}

              {/* Custom Fields Grid */}
              {detailFields.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {detailFields.map((field: any) => {
                    const val = customFields[field.key];
                    if (!val) return null;
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
                          {val}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Advanced Sections */}
            {renderRosterSection()}
            {renderMeetSection()}
            {renderPracticeSection()}
            {renderLogisticsSection()}
            {renderGearSection()}
            {renderVolunteersSection()}
            {renderAnnouncementsSection()}

            {/* RSVP Section */}
            {rsvpEnabled && (
              <section
                id="rsvp"
                className="max-w-2xl mx-auto text-center p-6 md:p-10 scroll-mt-24"
              >
                <h2
                  className={`text-2xl mb-6 ${accentClass}`}
                  style={{ ...headingShadow, ...(titleColor || {}) }}
                >
                  {rsvpCopy.editorTitle || "RSVP"}
                </h2>
                <div className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-xl text-left">
                  {!rsvpSubmitted ? (
                    <div className="space-y-6">
                      <div className="text-center mb-4">
                        <p className="opacity-80">
                          {rsvpDeadline
                            ? `Kindly respond by ${new Date(
                                rsvpDeadline
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
                              onChange={() => setRsvpAttending("yes")}
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
                                  I'll be there.
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
                              onChange={() => setRsvpAttending("no")}
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
                        onClick={() => setRsvpSubmitted(true)}
                        className="w-full py-4 mt-2 bg-white text-slate-900 font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-slate-200 transition-colors shadow-lg"
                      >
                        Send RSVP
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🎉</div>
                      <h3 className="text-2xl font-serif mb-2">Thank you!</h3>
                      <p className="opacity-70">Your RSVP has been sent.</p>
                      <button
                        onClick={() => {
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

            {/* Calendar buttons */}
            <section className="py-6 px-6 md:px-10 border-t border-white/10">
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Share2 size={16} />
                  Share
                </button>
                <button
                  onClick={handleGoogleCalendar}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <CalendarIcon size={16} />
                  Google Calendar
                </button>
                <button
                  onClick={handleAppleCalendar}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Apple size={16} />
                  Apple Calendar
                </button>
                <button
                  onClick={handleOutlookCalendar}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <CalendarIcon size={16} />
                  Outlook
                </button>
              </div>
            </section>

            {/* Footer */}
            <footer
              className={`text-center py-8 border-t border-white/10 mt-1 ${textClass}`}
            >
              <a
                href="https://envitefy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="space-y-1 inline-block no-underline"
              >
                <p className="text-sm opacity-60" style={bodyShadow}>
                  Powered By Envitefy. Create. Share. Enjoy.
                </p>
                <p className="text-xs opacity-50" style={bodyShadow}>
                  Create yours now.
                </p>
              </a>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
