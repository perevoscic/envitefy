"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Gift,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
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

const RSVP_ACTION_OPTIONS = [
  { label: "Yes", accentClassName: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { label: "No", accentClassName: "border-rose-200 bg-rose-50 text-rose-700" },
  { label: "Maybe", accentClassName: "border-amber-200 bg-amber-50 text-amber-700" },
] as const;

function extractEmail(value: string) {
  return value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
}

function extractPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return "";
  return `${value.trim().startsWith("+") ? "+" : ""}${digits}`;
}

function getRsvpContactMetadata(contact: string) {
  const email = extractEmail(contact);
  if (email) {
    return {
      kind: "email" as const,
      icon: Mail,
      actionLabel: "Opens email",
      directHref: `mailto:${email}`,
      value: email,
    };
  }

  const phone = extractPhone(contact);
  if (phone) {
    return {
      kind: "sms" as const,
      icon: Phone,
      actionLabel: "Opens text messages",
      directHref: `sms:${phone}`,
      value: phone,
    };
  }

  return {
    kind: "none" as const,
    icon: null,
    actionLabel: "",
    directHref: "",
    value: contact,
  };
}

function buildRsvpResponseHref(contact: string, eventTitle: string, responseLabel: string) {
  const metadata = getRsvpContactMetadata(contact);
  const subject = encodeURIComponent(`RSVP for ${eventTitle}`);
  const body = encodeURIComponent(`Hi! My RSVP for ${eventTitle}: ${responseLabel}.`);

  if (metadata.kind === "email") {
    return `mailto:${metadata.value}?subject=${subject}&body=${body}`;
  }

  if (metadata.kind === "sms") {
    return `sms:${metadata.value}?body=${body}`;
  }

  return "";
}

export default function SharedStudioCardPage(props: SharedStudioCardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("none");
  const [copySuccess, setCopySuccess] = useState(false);
  const invitationData = props.invitationData || null;
  const details = invitationData?.eventDetails || null;
  const safeAreaStyle = {
    paddingTop: "env(safe-area-inset-top)",
    paddingRight: "max(env(safe-area-inset-right), 1rem)",
    paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
    paddingLeft: "max(env(safe-area-inset-left), 1rem)",
  };
  const buttonRailStyle = {
    paddingBottom: "calc(env(safe-area-inset-bottom) + 1.35rem)",
  };
  const rsvpContact = readString(details?.rsvpContact);
  const rsvpContactMetadata = getRsvpContactMetadata(rsvpContact);
  const buttonConfigs = useMemo(
    () =>
      [
        {
          key: "rsvp",
          label: "RSVP",
          icon: MessageSquare,
          visible: Boolean(readString(details?.rsvpName) || readString(details?.rsvpContact)),
          onClick: () => setActiveTab(activeTab === "rsvp" ? "none" : "rsvp"),
        },
        {
          key: "details",
          label: "Details",
          icon: ClipboardList,
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
          icon: CalendarDays,
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
          icon: Gift,
          visible: Boolean(readString(details?.registryLink)),
          onClick: () => setActiveTab(activeTab === "registry" ? "none" : "registry"),
        },
      ] as const,
    [activeTab, copySuccess, details, invitationData, props.shareUrl, props.title],
  );

  return (
    <div className="min-h-screen min-h-[100svh] min-h-[100dvh] w-full bg-neutral-950">
      <main className="relative h-screen h-[100svh] h-[100dvh] w-full overflow-hidden bg-neutral-950">
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

      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
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
                        {activeTab === "calendar" ? <CalendarDays className="h-5 w-5" /> : null}
                        {activeTab === "registry" ? <Gift className="h-5 w-5" /> : null}
                        {activeTab === "rsvp" ? <MessageSquare className="h-5 w-5" /> : null}
                        {activeTab === "details" ? <ClipboardList className="h-5 w-5" /> : null}
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
                              {rsvpContactMetadata.directHref ? (
                                <a
                                  href={rsvpContactMetadata.directHref}
                                  className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 transition hover:text-neutral-700"
                                >
                                  {rsvpContactMetadata.icon ? (
                                    <rsvpContactMetadata.icon className="h-4 w-4 text-neutral-500" />
                                  ) : null}
                                  {readString(details?.rsvpContact)}
                                </a>
                              ) : (
                                <p className="text-sm text-neutral-700">
                                  {readString(details?.rsvpContact)}
                                </p>
                              )}
                              {rsvpContactMetadata.actionLabel ? (
                                <p className="mt-2 text-[11px] font-medium text-neutral-500">
                                  {rsvpContactMetadata.actionLabel}
                                </p>
                              ) : null}
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
                        {rsvpContactMetadata.kind !== "none" ? (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                              Quick Reply
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {RSVP_ACTION_OPTIONS.map((option) => (
                                <a
                                  key={option.label}
                                  href={buildRsvpResponseHref(rsvpContact, props.title, option.label)}
                                  className={`flex items-center justify-center rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-[0.18em] transition hover:-translate-y-0.5 ${option.accentClassName}`}
                                >
                                  {option.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : null}
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
                            <CalendarDays className="h-3 w-3" />
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

              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-center gap-3 px-2 pt-16 sm:gap-4 sm:px-4"
                style={buttonRailStyle}
              >
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
                            className={`rounded-full border border-white/30 bg-white/20 p-2.5 shadow-xl backdrop-blur-md transition-all group-hover:bg-white/40 sm:p-3 ${
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
                              className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${
                                button.key === "share" && copySuccess
                                  ? "text-green-400"
                                  : "text-white"
                              }`}
                            />
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-white drop-shadow-md sm:text-[9px]">
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

      <div className="border-t border-white/10 bg-neutral-950 px-4 py-3 text-center">
        <Link
          href="/studio"
          className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/55 transition hover:text-white/80"
        >
          Created by Envitefy Studio
        </Link>
      </div>
    </div>
  );
}
