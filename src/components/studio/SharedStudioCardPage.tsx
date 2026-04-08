"use client";

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
import Link from "next/link";
import { useMemo, useState } from "react";
import { buildLiveCardDetailsWelcomeMessage } from "@/lib/live-card-event-details";
import {
  buildLiveCardRsvpOutboundHref,
  LIVE_CARD_RSVP_CHOICES,
  type LiveCardRsvpChoice,
  parseLiveCardRsvpContact,
  shouldShowLiveCardDescriptionSection,
} from "@/lib/live-card-rsvp";

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
  detailsDescription?: string;
  guestImageUrls?: string[];
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

function accentClassForRsvpChoice(choice: LiveCardRsvpChoice["key"]) {
  if (choice === "yes") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (choice === "no") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function SharedStudioCardPage(props: SharedStudioCardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("none");
  const [copySuccess, setCopySuccess] = useState(false);
  const invitationData = props.invitationData || null;
  const details = invitationData?.eventDetails || null;
  const rsvpContact = readString(details?.rsvpContact);
  const rsvpParsed = parseLiveCardRsvpContact(rsvpContact);
  const effectiveShareUrl =
    readString(props.shareUrl) || (typeof window !== "undefined" ? window.location.href : "");
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

  const rsvpOutboundHint =
    rsvpParsed.kind === "email"
      ? "Tap a response to open your email with a draft message."
      : rsvpParsed.kind === "sms"
        ? "Tap a response to open your messages app with a draft text."
        : "Add a phone number or email as the RSVP contact to send a reply from here.";

  const detailsWelcome = useMemo(
    () => buildLiveCardDetailsWelcomeMessage(details ?? undefined, props.title),
    [details, props.title],
  );

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-neutral-950">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <img
          src={props.imageUrl}
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-110 object-cover opacity-35 blur-3xl"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_rgba(10,10,10,0.24)_30%,_rgba(10,10,10,0.82)_100%)]" />
      </div>

      <main className="relative z-0 flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-2 max-md:justify-start max-md:pt-[max(0.25rem,env(safe-area-inset-top))] md:py-6">
          <div className="relative mx-auto w-full max-w-md max-h-[calc(100dvh-5.5rem)] aspect-[9/16] overflow-hidden rounded-[3rem] border border-white/10 bg-neutral-900 shadow-2xl shadow-purple-500/20">
            <img
              src={props.imageUrl}
              alt={props.title}
              className="absolute inset-0 h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />

            <div className="pointer-events-none absolute inset-0 flex flex-col pt-8 pb-1 px-3 max-md:px-1 max-md:pt-6 max-md:pb-0 sm:px-4 md:p-8 md:pb-2">
              <div className="flex h-full min-h-0 flex-col justify-end">
                {activeTab !== "none" && activeTab !== "share" ? (
                  <div className="pointer-events-auto absolute bottom-32 left-3 right-3 z-50 rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-2xl backdrop-blur-2xl max-sm:left-2 max-sm:right-2 sm:left-5 sm:right-5 md:left-6 md:right-6">
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
                          {activeTab === "rsvp" ? "RSVP" : null}
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
                        <div className="flex flex-col space-y-4">
                          <div className="space-y-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                            <p className="text-sm font-medium text-neutral-900">
                              {readString(details?.rsvpName) || "Host"}
                            </p>
                            {readString(details?.rsvpContact) ? (
                              <div>
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                  RSVP contact
                                </p>
                                <p className="inline-flex items-center gap-2 text-sm text-neutral-800">
                                  {rsvpParsed.kind === "email" ? (
                                    <Mail className="h-4 w-4 shrink-0 text-neutral-500" />
                                  ) : rsvpParsed.kind === "sms" ? (
                                    <Phone className="h-4 w-4 shrink-0 text-neutral-500" />
                                  ) : null}
                                  {readString(details?.rsvpContact)}
                                </p>
                              </div>
                            ) : null}
                            {readString(details?.rsvpDeadline) ? (
                              <div>
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                  RSVP deadline
                                </p>
                                <p className="text-sm text-red-600">
                                  {formatDate(readString(details?.rsvpDeadline))}
                                </p>
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-auto grid grid-cols-3 gap-2 border-t border-neutral-100 pt-4">
                            {LIVE_CARD_RSVP_CHOICES.map((choice) => {
                              const href = buildLiveCardRsvpOutboundHref({
                                rsvpContact,
                                eventTitle: props.title,
                                responseLabel: choice.label,
                                shareUrl: effectiveShareUrl,
                              });
                              const accent = accentClassForRsvpChoice(choice.key);
                              if (!href) {
                                return (
                                  <button
                                    key={choice.key}
                                    type="button"
                                    disabled
                                    aria-disabled="true"
                                    title={rsvpOutboundHint}
                                    className={`flex cursor-not-allowed items-center justify-center rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-[0.18em] opacity-45 ${accent}`}
                                  >
                                    {choice.label}
                                  </button>
                                );
                              }
                              return (
                                <a
                                  key={choice.key}
                                  href={href}
                                  className={`flex items-center justify-center rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-[0.18em] transition hover:-translate-y-0.5 ${accent}`}
                                >
                                  {choice.label}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {activeTab === "details" ? (
                        <div className="max-h-[300px] space-y-4 overflow-y-auto pr-2">
                          {detailsWelcome ? (
                            <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700">
                                Welcome
                              </p>
                              <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-900">
                                {detailsWelcome}
                              </p>
                            </div>
                          ) : null}
                          {readString(details?.detailsDescription) ? (
                            <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                Event details
                              </p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-900">
                                {readString(details?.detailsDescription)}
                              </p>
                            </div>
                          ) : null}
                          {shouldShowLiveCardDescriptionSection(readString(details?.message)) &&
                          (readString(invitationData?.description) ||
                            readString(details?.message)) ? (
                            <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                Description
                              </p>
                              <p className="mt-1 text-sm text-neutral-900">
                                {readString(invitationData?.description) ||
                                  readString(details?.message)}
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
                          <p className="text-xs text-neutral-500">
                            {readString(details?.location)}
                          </p>
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
                              onClick={() =>
                                window.open(readString(details?.registryLink), "_blank")
                              }
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

                {/* Push controls toward the bottom edge so they clear typical caption / RSVP copy in the artwork */}
                <div
                  className="pointer-events-none max-md:min-h-[min(18svh,5.5rem)] min-h-[min(10svh,3rem)] shrink-0 md:min-h-[min(8svh,2.5rem)]"
                  aria-hidden
                />

                <div className="pointer-events-none z-20 flex w-full min-w-0 flex-nowrap items-end justify-center gap-2 overflow-x-auto pb-[max(0.35rem,calc(env(safe-area-inset-bottom)+0.15rem))] [scrollbar-width:none] [-ms-overflow-style:none] max-sm:justify-between max-sm:gap-0.5 max-sm:px-0 px-1 md:gap-4 md:px-2 [&::-webkit-scrollbar]:hidden">
                  {buttonConfigs
                    .filter((button) => button.visible)
                    .map((button) => {
                      const Icon = button.icon;
                      const position = props.positions?.[button.key] || EMPTY_POSITIONS[button.key];
                      return (
                        <div
                          key={button.key}
                          style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
                          className="pointer-events-auto max-sm:min-w-0 max-sm:flex-1 max-sm:max-w-[20%] sm:flex-none sm:max-w-none"
                        >
                          <button
                            onClick={button.onClick}
                            className="group flex w-full flex-col items-center gap-1 md:gap-2"
                          >
                            <div
                              className={`rounded-full border border-white/30 bg-white/20 p-2 shadow-xl backdrop-blur-md transition-all group-hover:bg-white/40 md:p-3 ${
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
                                className={`h-4 w-4 md:h-5 md:w-5 ${
                                  button.key === "share" && copySuccess
                                    ? "text-green-400"
                                    : "text-white"
                                }`}
                              />
                            </div>
                            <span className="max-w-full truncate text-center text-[7px] font-bold uppercase tracking-tight text-white drop-shadow-md sm:text-[8px] sm:tracking-wider md:text-[9px] md:tracking-widest">
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

      <footer className="shrink-0 border-t border-white/10 bg-neutral-950 px-4 py-3 text-center">
        <Link
          href="/studio"
          className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/55 transition hover:text-white/80"
        >
          Created by Envitefy Studio
        </Link>
      </footer>
    </div>
  );
}
