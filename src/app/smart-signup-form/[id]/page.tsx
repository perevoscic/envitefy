import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getEventHistoryBySlugOrId,
  getUserIdByEmail,
  isEventSharedWithUser,
} from "@/lib/db";
import SignupViewer from "@/components/smart-signup-form/SignupViewer";
import type { SignupForm } from "@/types/signup";
import { sanitizeSignupForm } from "@/utils/signup";
import { combineVenueAndLocation } from "@/lib/mappers";
import EventActions from "@/components/EventActions";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const awaitedParams = await params;
  const session: any = await getServerSession(authOptions as any);
  const sessionEmail = (session?.user?.email as string | undefined) || null;
  const userId = sessionEmail ? await getUserIdByEmail(sessionEmail) : null;
  const row = await getEventHistoryBySlugOrId({
    value: awaitedParams.id,
    userId,
  });
  if (!row) return notFound();
  const data = (row.data as any) || {};
  const rawForm = data?.signupForm;
  if (!rawForm || typeof rawForm !== "object") return notFound();
  const signupForm: SignupForm = sanitizeSignupForm({
    ...(rawForm as SignupForm),
    enabled: true,
  });

  const isOwner = Boolean(userId && row.user_id && userId === row.user_id);
  const recipientAccepted = userId
    ? (await isEventSharedWithUser(row.id, userId)) === true
    : false;
  const viewerKind: "owner" | "guest" = isOwner ? "owner" : "guest";

  const header = signupForm.header || null;
  const combinedLocation = combineVenueAndLocation(
    (data?.venue as string | undefined) || null,
    (data?.location as string | undefined) || null
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
    options?: { timeZone?: string | null; allDay?: boolean | null }
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
    `/smart-signup-form/${row.id}`
  )}`;

  if (!sessionEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <main className="mx-auto w-full max-w-2xl px-5 py-14 space-y-4">
          <h1 className="text-3xl font-bold text-neutral-900 text-center">
            Sign in to respond
          </h1>
          <p className="text-center text-neutral-700">
            Only invitees can view and submit this sign-up form. Use the same
            email or phone number the organizer used to invite you.
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

  if (!isOwner && !recipientAccepted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <main className="mx-auto w-full max-w-2xl px-5 py-14 space-y-4">
          <h1 className="text-3xl font-bold text-neutral-900 text-center">
            Access limited to invitees
          </h1>
          <p className="text-center text-neutral-700">
            This sign-up is restricted to contacts the organizer invited.
            Please ask them to share access with your account before you
            continue.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={pageBgStyle}>
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
                      <div>
                        Created by {(session?.user?.name as string) || ""}
                      </div>
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
                            }
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
                    text
                  )}`;
                  return (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.95rem] underline text-foreground/70"
                    >
                      {signupForm.venue ? signupForm.venue : ""}
                      {signupForm.venue &&
                      (signupForm.location || combinedLocation)
                        ? ", "
                        : ""}
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
                shareUrl={`/smart-signup-form/${row.id}`}
                historyId={row.id}
                event={
                  {
                    title:
                      (row.title as string) ||
                      (signupForm.title as string) ||
                      "Event",
                    start:
                      (data?.startISO as string | null) ||
                      (data?.start as string | null) ||
                      null,
                    end:
                      (data?.endISO as string | null) ||
                      (data?.end as string | null) ||
                      null,
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
