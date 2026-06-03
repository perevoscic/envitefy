import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { getServerSession } from "next-auth";
import { cache } from "react";
import EventActions from "@/components/EventActions";
import SignupViewer from "@/components/smart-signup-form/SignupViewer";
import { absoluteUrl } from "@/lib/absolute-url";
import { authOptions } from "@/lib/auth";
import {
  getEventHistoryPublicRenderBySlugOrId,
  getUserIdByEmail,
  isEventSharedWithUser,
  type EventHistoryPublicRow,
} from "@/lib/db";
import { isIndexablePublicSmartSignupData } from "@/lib/smart-signup-indexing";
import { combineVenueAndLocation } from "@/lib/mappers";
import type { SignupForm } from "@/types/signup";
import { buildEventSlugSegment } from "@/utils/event-url";
import { sanitizeSignupForm } from "@/utils/signup";

export const dynamic = "force-dynamic";

const getCachedSignupEventBySlugOrId = cache(async (value: string, userId?: string | null) =>
  getEventHistoryPublicRenderBySlugOrId({
    value,
    userId: userId || undefined,
  }),
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readText(value: unknown, maxLength = 220): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed || trimmed.startsWith("data:")) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength).trim() : trimmed;
}

function readFirstText(values: unknown[], maxLength = 220): string | null {
  for (const value of values) {
    const text = readText(value, maxLength);
    if (text) return text;
  }
  return null;
}

function readDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) || !Number.isNaN(parsed.getTime())
    ? trimmed
    : null;
}

function resolveSignupForm(row: EventHistoryPublicRow): SignupForm | null {
  const data = isRecord(row.data) ? row.data : {};
  const rawForm = isRecord(data.signupForm) ? data.signupForm : null;
  if (!rawForm) return null;
  return sanitizeSignupForm({
    ...(rawForm as SignupForm),
    enabled: true,
  });
}

function resolveSignupTitle(row: EventHistoryPublicRow, signupForm: SignupForm): string {
  return readFirstText([signupForm.title, row.title], 120) || "Smart sign-up";
}

function resolveSignupDescription(
  row: EventHistoryPublicRow,
  signupForm: SignupForm,
  indexable: boolean,
): string {
  if (!indexable) return "View this private Envitefy smart sign-up form.";
  const data = isRecord(row.data) ? row.data : {};
  const title = resolveSignupTitle(row, signupForm);
  const sectionCount = signupForm.sections.length;
  const slotCount = signupForm.sections.reduce((sum, section) => sum + section.slots.length, 0);
  const venue = readFirstText([signupForm.venue, data.venue], 100);
  const location = readFirstText([signupForm.location, data.location], 140);
  const place = combineVenueAndLocation(venue, location) || venue || location;
  const slotCopy =
    slotCount > 0
      ? `${slotCount} sign-up ${slotCount === 1 ? "slot" : "slots"}`
      : `${sectionCount || 1} sign-up ${sectionCount === 1 ? "section" : "sections"}`;
  return place
    ? `View ${title}, an Envitefy smart sign-up form at ${place} with ${slotCopy}, event details, and guest actions.`
    : `View ${title}, an Envitefy smart sign-up form with ${slotCopy}, event details, and guest actions.`;
}

async function resolveSignupHeaderImageUrl(
  row: EventHistoryPublicRow,
  signupForm: SignupForm,
): Promise<string | null> {
  const image = signupForm.header?.backgroundImage;
  if (!image?.dataUrl) return null;
  if (row.media.signupHeaderInline) {
    const params = new URLSearchParams();
    params.set("variant", "signup-header");
    if (row.media.signupHeaderSig) params.set("v", row.media.signupHeaderSig);
    return absoluteUrl(`/api/events/${row.id}/thumbnail?${params.toString()}`);
  }
  if (/^https?:\/\//i.test(image.dataUrl) || image.dataUrl.startsWith("/")) {
    return absoluteUrl(image.dataUrl);
  }
  return null;
}

function compactJsonLd(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => {
      if (value === null || typeof value === "undefined") return false;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    }),
  );
}

function buildSmartSignupJsonLd(params: {
  row: EventHistoryPublicRow;
  signupForm: SignupForm;
  url: string;
  imageUrl?: string | null;
}): Record<string, unknown> | null {
  if (!isIndexablePublicSmartSignupData(params.row.data) || !params.signupForm.enabled) {
    return null;
  }
  const data = isRecord(params.row.data) ? params.row.data : {};
  const title = resolveSignupTitle(params.row, params.signupForm);
  const description = resolveSignupDescription(params.row, params.signupForm, true);
  const venue = readFirstText([params.signupForm.venue, data.venue], 100);
  const location = readFirstText([params.signupForm.location, data.location], 140);
  const startDate =
    readDate(data.startISO) ||
    readDate(data.startAt) ||
    readDate(data.start) ||
    readDate(params.signupForm.start);
  const endDate =
    readDate(data.endISO) || readDate(data.endAt) || readDate(data.end) || readDate(params.signupForm.end);
  const itemListElement = params.signupForm.sections.map((section, index) =>
    compactJsonLd({
      "@type": "ListItem",
      position: index + 1,
      name: section.title,
      description: section.description || undefined,
      item: {
        "@type": "ItemList",
        name: section.title,
        numberOfItems: section.slots.length,
      },
    }),
  );

  return {
    "@context": "https://schema.org",
    "@graph": [
      compactJsonLd({
        "@type": "WebPage",
        "@id": `${params.url}#webpage`,
        url: params.url,
        name: `${title} — Envitefy`,
        description,
        image: params.imageUrl || undefined,
        isPartOf: {
          "@type": "WebSite",
          name: "Envitefy",
          url: "https://envitefy.com",
        },
        mainEntity: { "@id": `${params.url}#event` },
      }),
      compactJsonLd({
        "@type": "Event",
        "@id": `${params.url}#event`,
        name: title,
        url: params.url,
        description,
        image: params.imageUrl ? [params.imageUrl] : undefined,
        startDate,
        endDate,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location:
          venue || location
            ? compactJsonLd({
                "@type": "Place",
                name: venue || location,
                address: location,
              })
            : undefined,
        potentialAction: {
          "@type": "RegisterAction",
          target: params.url,
          name: "View smart sign-up form",
        },
      }),
      compactJsonLd({
        "@type": "ItemList",
        "@id": `${params.url}#signup-sections`,
        name: `${title} sign-up sections`,
        itemListElement,
      }),
    ],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const awaitedParams = await params;
  const row = await getCachedSignupEventBySlugOrId(awaitedParams.id, null);
  if (!row) {
    return {
      title: "Smart sign-up — Envitefy",
      description: "View an Envitefy smart sign-up form.",
      robots: { index: false, follow: false },
    };
  }

  const signupForm = resolveSignupForm(row);
  if (!signupForm) {
    return {
      title: `${row.title || "Smart sign-up"} — Envitefy`,
      description: "View an Envitefy smart sign-up form.",
      robots: { index: false, follow: false },
    };
  }

  const canonicalSegment = buildEventSlugSegment(row.id, row.title, row.public_slug);
  const url = await absoluteUrl(`/smart-signup-form/${canonicalSegment}`);
  const indexable = isIndexablePublicSmartSignupData(row.data) && signupForm.enabled;
  const title = resolveSignupTitle(row, signupForm);
  const description = resolveSignupDescription(row, signupForm, indexable);
  const imageUrl = await resolveSignupHeaderImageUrl(row, signupForm);

  return {
    title: `${title} — Envitefy`,
    description,
    ...(!indexable ? { robots: { index: false, follow: false } } : {}),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} — Envitefy`,
      description,
      url,
      siteName: "Envitefy",
      images: imageUrl ? [{ url: imageUrl, alt: `${title} smart sign-up form` }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Envitefy`,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const awaitedParams = await params;
  const session: any = await getServerSession(authOptions as any);
  const sessionEmail = (session?.user?.email as string | undefined) || null;
  const userId = sessionEmail ? await getUserIdByEmail(sessionEmail) : null;
  const row = await getCachedSignupEventBySlugOrId(awaitedParams.id, userId);
  if (!row) return notFound();
  const canonicalSegment = buildEventSlugSegment(row.id, row.title, row.public_slug);
  if (awaitedParams.id !== canonicalSegment) {
    redirect(`/smart-signup-form/${canonicalSegment}`);
  }
  const data = (row.data as any) || {};
  const signupForm = resolveSignupForm(row);
  if (!signupForm) return notFound();
  const isPublicSignupPage = isIndexablePublicSmartSignupData(data) && signupForm.enabled;
  const canonicalUrl = await absoluteUrl(`/smart-signup-form/${canonicalSegment}`);
  const signupHeaderImageUrl = await resolveSignupHeaderImageUrl(row, signupForm);
  const smartSignupStructuredData = buildSmartSignupJsonLd({
    row,
    signupForm,
    url: canonicalUrl,
    imageUrl: signupHeaderImageUrl,
  });
  const signupHeaderSig = row.media.signupHeaderSig || null;
  if (
    row.media.signupHeaderInline &&
    signupForm.header?.backgroundImage &&
    typeof signupForm.header.backgroundImage === "object"
  ) {
    const params = new URLSearchParams();
    params.set("variant", "signup-header");
    if (signupHeaderSig) params.set("v", signupHeaderSig);
    signupForm.header.backgroundImage = {
      ...signupForm.header.backgroundImage,
      dataUrl: `/api/events/${row.id}/thumbnail?${params.toString()}`,
    };
  }

  const isOwner = Boolean(userId && row.user_id && userId === row.user_id);
  const recipientAccepted = userId ? (await isEventSharedWithUser(row.id, userId)) === true : false;
  const viewerKind: "owner" | "guest" | "readonly" = isOwner
    ? "owner"
    : sessionEmail && recipientAccepted
      ? "guest"
      : "readonly";

  const header = signupForm.header || null;
  const combinedLocation = combineVenueAndLocation(
    (data?.venue as string | undefined) || null,
    (data?.location as string | undefined) || null,
  );
  const pageBgStyle = {
    backgroundColor: header?.backgroundColor || undefined,
    backgroundImage: header?.backgroundCss || undefined,
    backgroundSize: header?.backgroundCss ? "cover" : undefined,
    backgroundPosition: header?.backgroundCss ? "center" : undefined,
  } as React.CSSProperties;

  const formatRangeLabel = (
    startInput?: string | null,
    endInput?: string | null,
    options?: { timeZone?: string | null; allDay?: boolean | null },
  ): string | null => {
    const timeZone = options?.timeZone || undefined;
    const allDay = Boolean(options?.allDay);
    try {
      if (!startInput) return null;
      const start = new Date(startInput);
      const end = endInput ? new Date(endInput) : null;
      if (Number.isNaN(start.getTime())) return null;
      const sameDay =
        !!end &&
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();
      if (allDay) {
        const dateFmt = new Intl.DateTimeFormat(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone,
        });
        const label =
          end && !sameDay
            ? `${dateFmt.format(start)} – ${dateFmt.format(end)}`
            : dateFmt.format(start);
        return `${label} (all day)`;
      }
      const dateFmt = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone,
      });
      if (end) {
        if (sameDay) {
          return `${dateFmt.format(start)}`;
        }
        return `${dateFmt.format(start)} – ${dateFmt.format(end)}`;
      }
      return dateFmt.format(start);
    } catch {
      return startInput || null;
    }
  };

  const authHref = `/api/auth/signin?callbackUrl=${encodeURIComponent(
    `/smart-signup-form/${row.id}`,
  )}`;

  if (!sessionEmail && !isPublicSignupPage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <main className="mx-auto w-full max-w-2xl px-5 py-14 space-y-4">
          <h1 className="text-3xl font-bold text-neutral-900 text-center">Sign in to respond</h1>
          <p className="text-center text-neutral-700">
            Only invitees can view and submit this sign-up form. Use the same email or phone number
            the organizer used to invite you.
          </p>
          <div className="flex justify-center">
            <a
              href={authHref}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors"
            >
              Sign in / Sign up
            </a>
          </div>
        </main>
      </div>
    );
  }

  if (!isOwner && !recipientAccepted && !isPublicSignupPage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <main className="mx-auto w-full max-w-2xl px-5 py-14 space-y-4">
          <h1 className="text-3xl font-bold text-neutral-900 text-center">
            Access limited to invitees
          </h1>
          <p className="text-center text-neutral-700">
            This sign-up is restricted to contacts the organizer invited. Please ask them to share
            access with your account before you continue.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={pageBgStyle}>
      {smartSignupStructuredData ? (
        <Script id="ld-smart-signup-form" type="application/ld+json">
          {JSON.stringify(smartSignupStructuredData)}
        </Script>
      ) : null}
      <main className="mx-auto w-full max-w-3xl px-4 py-6 space-y-4">
        <section
          className="rounded-xl overflow-hidden border"
          style={{
            backgroundColor: header?.backgroundColor || undefined,
            backgroundImage: header?.backgroundCss || undefined,
            backgroundSize: header?.backgroundCss ? "cover" : undefined,
            backgroundPosition: header?.backgroundCss ? "center" : undefined,
          }}
        >
          <div className="px-5 py-6">
            <div className="grid gap-4 md:grid-cols-[325px_1fr] items-start">
              <div>
                {header?.backgroundImage?.dataUrl ? (
                  <img
                    src={header.backgroundImage.dataUrl}
                    alt="header"
                    className="w-full max-w-[325px] max-h-[325px] rounded-xl border border-border object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                {header?.groupName ? (
                  <div
                    className="text-[0.9rem] sm:text-sm font-semibold opacity-85"
                    style={{ color: header?.textColor1 || undefined }}
                  >
                    {header.groupName}
                  </div>
                ) : null}
                <h1
                  className="text-2xl sm:text-[1.6rem] font-semibold"
                  style={{ color: header?.textColor2 || undefined }}
                >
                  {signupForm.title || row.title || "Smart sign-up"}
                </h1>
                {(session?.user?.name as string | undefined) && (
                  <div
                    className="flex items-start gap-2 text-[0.95rem] opacity-85"
                    style={{ color: header?.textColor1 || undefined }}
                  >
                    <span
                      className="inline-grid place-items-center h-7 w-7 rounded-full"
                      style={{
                        background: header?.buttonColor || "#44AD3C",
                        color: header?.buttonTextColor || "#FFF4C7",
                      }}
                    >
                      {(() => {
                        const name = (session?.user?.name as string) || "";
                        return (
                          name
                            .trim()
                            .split(/\s+/)
                            .map((w) => (w ? w[0].toUpperCase() : ""))
                            .slice(0, 2)
                            .join("") || "?"
                        );
                      })()}
                    </span>
                    <span className="leading-tight">
                      <div>Created by {(session?.user?.name as string) || ""}</div>
                      <div className="opacity-90">
                        {(() => {
                          const label = formatRangeLabel(
                            (data?.startISO as string | null) ||
                              (data?.start as string | null) ||
                              signupForm.start ||
                              null,
                            (data?.endISO as string | null) ||
                              (data?.end as string | null) ||
                              signupForm.end ||
                              null,
                            {
                              timeZone:
                                (data?.timezone as string | null) ||
                                (signupForm.timezone as string | null) ||
                                undefined,
                              allDay:
                                (data?.allDay as boolean | null) ||
                                (signupForm.allDay as boolean | null) ||
                                null,
                            },
                          );
                          return label || "";
                        })()}
                      </div>
                    </span>
                  </div>
                )}
                {(() => {
                  const text = combinedLocation || signupForm.location || "";
                  if (!text) return null;
                  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    text,
                  )}`;
                  return (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.95rem] underline text-foreground/70"
                    >
                      {signupForm.venue ? signupForm.venue : ""}
                      {signupForm.venue && (signupForm.location || combinedLocation) ? ", " : ""}
                      {signupForm.location || combinedLocation}
                    </a>
                  );
                })()}
              </div>
            </div>
            {signupForm.description && (
              <div className="mt-3">
                <p
                  className="leading-relaxed text-sm"
                  style={{ color: header?.textColor1 || undefined }}
                >
                  {signupForm.description}
                </p>
              </div>
            )}
            {/* Guest share actions inside header footer */}
            <div className="mt-4 pt-3 border-t border-border/60">
              <EventActions
                shareUrl={`/smart-signup-form/${canonicalSegment}`}
                historyId={row.id}
                event={
                  {
                    title: (row.title as string) || (signupForm.title as string) || "Event",
                    start:
                      (data?.startISO as string | null) || (data?.start as string | null) || null,
                    end: (data?.endISO as string | null) || (data?.end as string | null) || null,
                    location: (data?.location as string | null) || null,
                    venue: (data?.venue as string | null) || null,
                    description: (data?.description as string | null) || null,
                    timezone: (data?.timezone as string | null) || null,
                    rsvp: (data?.rsvp as string | null) || null,
                  } as any
                }
              />
            </div>
          </div>
        </section>

        <section>
          <SignupViewer
            eventId={row.id}
            initialForm={signupForm}
            viewerKind={viewerKind}
            viewerId={userId}
            viewerName={(session?.user?.name as string | undefined) || null}
            viewerEmail={sessionEmail}
            ownerEventTitle={(row.title as string) || "Smart sign-up"}
            ownerEventData={data}
          />
        </section>
      </main>
    </div>
  );
}
