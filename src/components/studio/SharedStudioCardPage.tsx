"use client";

import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  Info,
  MapPin,
  Share2,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type ActiveTab = "none" | "location" | "calendar" | "registry" | "share" | "details" | "rsvp";

type ButtonPosition = {
  x: number;
  y: number;
};

type EventDetails = {
  category?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  venueName?: string;
  location?: string;
  rsvpName?: string;
  rsvpContact?: string;
  rsvpDeadline?: string;
  message?: string;
  registryLink?: string;
  [key: string]: unknown;
};

type InvitationData = {
  title?: string;
  description?: string;
  theme?: {
    themeStyle?: string;
  };
  interactiveMetadata?: {
    rsvpMessage?: string;
    funFacts?: string[];
    ctaLabel?: string;
    shareNote?: string;
  };
  eventDetails?: EventDetails;
};

type SharedStudioCardProps = {
  title: string;
  imageUrl: string;
  invitationData?: InvitationData | null;
  positions?: Record<string, ButtonPosition> | null;
  shareUrl?: string | null;
};

const EMPTY_POSITIONS = {
  rsvp: { x: 0, y: 0 },
  location: { x: 0, y: 0 },
  share: { x: 0, y: 0 },
  calendar: { x: 0, y: 0 },
  registry: { x: 0, y: 0 },
  details: { x: 0, y: 0 },
};

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatDate(dateStr: string) {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [year, month, day] = dateStr.split("-");
  return `${month}.${day}.${year}`;
}

function getRegistryText(details: EventDetails | null | undefined) {
  const link = readString(details?.registryLink);
  if (!link) return "Registry details will be shared by the host.";
  try {
    const url = new URL(link.startsWith("http") ? link : `https://${link}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
}

function buildGoogleCalendarUrl(title: string, invitationData?: InvitationData | null) {
  const details = invitationData?.eventDetails;
  const eventDate = readString(details?.eventDate).replace(/-/g, "");
  if (!eventDate) return "";
  const location = encodeURIComponent(readString(details?.location));
  const description = encodeURIComponent(readString(invitationData?.description));
  const encodedTitle = encodeURIComponent(title);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&details=${description}&location=${location}&dates=${eventDate}/${eventDate}`;
}

export default function SharedStudioCardPage(props: SharedStudioCardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("none");
  const [copySuccess, setCopySuccess] = useState(false);
  const invitationData = props.invitationData || null;
  const details = invitationData?.eventDetails || null;
  const safeAreaStyle = {
    paddingTop: "max(env(safe-area-inset-top), 1rem)",
    paddingRight: "max(env(safe-area-inset-right), 1rem)",
    paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
    paddingLeft: "max(env(safe-area-inset-left), 1rem)",
  };

  const buttonConfigs = useMemo(
    () =>
      [
        {
          key: "rsvp",
          label: "RSVP",
          icon: User,
          visible: Boolean(readString(details?.rsvpName) || readString(details?.rsvpContact)),
          onClick: () => setActiveTab(activeTab === "rsvp" ? "none" : "rsvp"),
        },
        {
          key: "details",
          label: "Details",
          icon: Info,
          visible: Boolean(invitationData),
          onClick: () => setActiveTab(activeTab === "details" ? "none" : "details"),
        },
        {
          key: "location",
          label: "Location",
          icon: MapPin,
          visible: Boolean(readString(details?.location) || readString(details?.venueName)),
          onClick: () => setActiveTab(activeTab === "location" ? "none" : "location"),
        },
        {
          key: "calendar",
          label: "Calendar",
          icon: Calendar,
          visible: Boolean(readString(details?.eventDate)),
          onClick: () => setActiveTab(activeTab === "calendar" ? "none" : "calendar"),
        },
        {
          key: "share",
          label: copySuccess ? "Copied!" : "Share",
          icon: copySuccess ? CheckCircle2 : Share2,
          visible: true,
          onClick: async () => {
            const shareUrl =
              props.shareUrl || (typeof window !== "undefined" ? window.location.href : "");
            const shareData = {
              title: props.title,
              text:
                readString(invitationData?.interactiveMetadata?.shareNote) ||
                readString(invitationData?.description) ||
                "Check out this invitation!",
              url: shareUrl,
            };

            try {
              if (typeof navigator !== "undefined" && navigator.share) {
                await navigator.share(shareData);
              } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(shareUrl);
              } else if (typeof window !== "undefined") {
                window.prompt("Copy your share link:", shareUrl);
              }
              setCopySuccess(true);
              window.setTimeout(() => setCopySuccess(false), 1800);
            } catch (error) {
              if (error instanceof DOMException && error.name === "AbortError") return;
            }
          },
        },
        {
          key: "registry",
          label: "Registry",
          icon: Sparkles,
          visible: Boolean(readString(details?.registryLink)),
          onClick: () => setActiveTab(activeTab === "registry" ? "none" : "registry"),
        },
      ] as const,
    [activeTab, copySuccess, details, invitationData, props.shareUrl, props.title],
  );

  return (
    <main className="relative min-h-screen min-h-[100svh] min-h-[100dvh] w-full overflow-hidden bg-neutral-950">
      <div className="absolute inset-0">
        <img
          src={props.imageUrl}
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-110 object-cover opacity-35 blur-3xl"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_rgba(10,10,10,0.24)_30%,_rgba(10,10,10,0.82)_100%)]" />
      </div>

      <div className="relative flex h-screen h-[100svh] h-[100dvh] w-full items-center justify-center overflow-hidden">
        <div className="relative h-full w-full overflow-hidden bg-neutral-900 shadow-2xl shadow-black/30">
          <img
            src={props.imageUrl}
            alt={props.title}
            className="absolute inset-0 h-full w-full object-contain"
            referrerPolicy="no-referrer"
          />

          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

          <div className="absolute inset-0 flex flex-col pointer-events-none" style={safeAreaStyle}>
            <div className="flex h-full flex-col justify-end">
              {activeTab !== "none" && activeTab !== "share" ? (
                <div className="pointer-events-auto absolute bottom-28 left-4 right-4 z-50 rounded-3xl border border-neutral-200 bg-white/92 p-6 shadow-2xl backdrop-blur-2xl sm:bottom-32 sm:left-8 sm:right-8 lg:left-1/2 lg:right-auto lg:w-[min(42rem,calc(100%-4rem))] lg:-translate-x-1/2">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-neutral-100 p-2 text-neutral-900">
                        {activeTab === "location" ? <MapPin className="h-5 w-5" /> : null}
                        {activeTab === "calendar" ? <Calendar className="h-5 w-5" /> : null}
                        {activeTab === "registry" ? <Sparkles className="h-5 w-5" /> : null}
                        {activeTab === "rsvp" ? <User className="h-5 w-5" /> : null}
                        {activeTab === "details" ? <Info className="h-5 w-5" /> : null}
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                        {activeTab === "location" ? "Event Location" : null}
                        {activeTab === "calendar" ? "Add to Calendar" : null}
                        {activeTab === "registry" ? "Gift Registry" : null}
                        {activeTab === "rsvp" ? "RSVP Info" : null}
                        {activeTab === "details" ? "Event Details" : null}
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab("none")}
                      className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {activeTab === "rsvp" ? (
                      <div className="space-y-4">
                        <p className="text-sm font-bold uppercase tracking-widest text-green-600">
                          RSVP Details
                        </p>
                        <p className="text-sm leading-6 text-neutral-700">
                          {readString(invitationData?.interactiveMetadata?.rsvpMessage) ||
                            "Reply to let the host know you're coming."}
                        </p>
                        <div className="space-y-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                              Host / RSVP Contact
                            </p>
                            <p className="text-sm font-medium text-neutral-900">
                              {readString(details?.rsvpName) || "Host"}
                            </p>
                          </div>
                          {readString(details?.rsvpContact) ? (
                            <div>
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                Contact Info
                              </p>
                              <p className="text-sm text-neutral-700">
                                {readString(details?.rsvpContact)}
                              </p>
                            </div>
                          ) : null}
                          {readString(details?.rsvpDeadline) ? (
                            <div>
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                RSVP Deadline
                              </p>
                              <p className="text-sm text-red-600">
                                {formatDate(readString(details?.rsvpDeadline))}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {activeTab === "details" ? (
                      <div className="max-h-[300px] space-y-4 overflow-y-auto pr-2">
                        <p className="text-sm font-bold uppercase tracking-widest text-purple-600">
                          {readString(details?.category) || "Event"} Information
                        </p>
                        {readString(invitationData?.theme?.themeStyle) ? (
                          <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                              Theme Style
                            </p>
                            <p className="mt-1 text-sm font-medium text-neutral-900">
                              {readString(invitationData?.theme?.themeStyle)}
                            </p>
                          </div>
                        ) : null}
                        {Array.isArray(invitationData?.interactiveMetadata?.funFacts) &&
                        invitationData.interactiveMetadata.funFacts.length > 0 ? (
                          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                              Fun Facts
                            </p>
                            <ul className="mt-3 space-y-2 text-sm text-amber-950">
                              {invitationData.interactiveMetadata.funFacts.map((fact) => (
                                <li key={fact}>{fact}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {readString(invitationData?.description) ? (
                          <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                              Description
                            </p>
                            <p className="mt-1 text-sm text-neutral-900">
                              {readString(invitationData?.description)}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {activeTab === "location" ? (
                      <>
                        <p className="text-sm font-medium text-neutral-900">
                          {readString(details?.venueName) || readString(details?.location)}
                        </p>
                        <p className="text-xs text-neutral-500">{readString(details?.location)}</p>
                        <p className="mt-2 text-xs text-neutral-500">
                          {readString(details?.eventDate)
                            ? formatDate(readString(details?.eventDate))
                            : "Date TBD"}
                          {readString(details?.startTime)
                            ? ` at ${readString(details?.startTime)}`
                            : ""}
                        </p>
                        {readString(details?.location) ? (
                          <button
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(readString(details?.location))}`,
                                "_blank",
                              )
                            }
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2 text-xs font-bold text-white"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open in Maps
                          </button>
                        ) : null}
                      </>
                    ) : null}

                    {activeTab === "calendar" ? (
                      <>
                        <p className="text-sm font-medium text-neutral-900">Save the Date</p>
                        <p className="text-xs text-neutral-500">
                          {readString(details?.eventDate)
                            ? formatDate(readString(details?.eventDate))
                            : "Date TBD"}
                          {readString(details?.startTime)
                            ? ` at ${readString(details?.startTime)}`
                            : ""}
                        </p>
                        {buildGoogleCalendarUrl(props.title, invitationData) ? (
                          <button
                            onClick={() =>
                              window.open(
                                buildGoogleCalendarUrl(props.title, invitationData),
                                "_blank",
                              )
                            }
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white"
                          >
                            <Calendar className="h-3 w-3" />
                            Add to Google Calendar
                          </button>
                        ) : null}
                      </>
                    ) : null}

                    {activeTab === "registry" ? (
                      <>
                        <p className="text-sm font-medium text-neutral-900">Gift Registry</p>
                        <p className="text-xs text-neutral-500">{getRegistryText(details)}</p>
                        {readString(details?.registryLink) ? (
                          <button
                            onClick={() => window.open(readString(details?.registryLink), "_blank")}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 py-2 text-xs font-bold text-white"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visit Registry
                          </button>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="pointer-events-none flex items-end justify-center gap-3 px-2 pb-4 sm:gap-4 sm:px-4 sm:pb-8">
                {buttonConfigs
                  .filter((button) => button.visible)
                  .map((button) => {
                    const Icon = button.icon;
                    const position = props.positions?.[button.key] || EMPTY_POSITIONS[button.key];
                    return (
                      <div
                        key={button.key}
                        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
                        className="pointer-events-auto"
                      >
                        <button
                          onClick={button.onClick}
                          className="group flex flex-col items-center gap-2"
                        >
                          <div
                            className={`rounded-full border border-white/30 bg-white/20 p-3 shadow-xl backdrop-blur-md transition-all group-hover:bg-white/40 ${
                              (button.key === "rsvp" && activeTab === "rsvp") ||
                              (button.key === "details" && activeTab === "details") ||
                              (button.key === "location" && activeTab === "location") ||
                              (button.key === "calendar" && activeTab === "calendar") ||
                              (button.key === "registry" && activeTab === "registry")
                                ? "border-white/50 bg-white/40"
                                : ""
                            }`}
                          >
                            <Icon
                              className={`h-5 w-5 ${
                                button.key === "share" && copySuccess
                                  ? "text-green-400"
                                  : "text-white"
                              }`}
                            />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white drop-shadow-md">
                            {button.label}
                          </span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
