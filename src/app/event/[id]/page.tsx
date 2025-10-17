import { notFound } from "next/navigation";
import EventActions from "@/components/EventActions";
import ThumbnailModal from "@/components/ThumbnailModal";
import EventEditModal from "@/components/EventEditModal";
import EventDeleteModal from "@/components/EventDeleteModal";
import EventRsvpPrompt from "@/components/EventRsvpPrompt";
import ReadOnlyBanner from "./ReadOnlyBanner";
import {
  listSharesByOwnerForEvents,
  isEventSharedWithUser,
  isEventSharePendingForUser,
  listShareRecipientsForEvent,
  revokeShareByOwner,
  acceptEventShare,
  revokeEventShare,
} from "@/lib/db";
import {
  getEventHistoryBySlugOrId,
  getUserIdByEmail,
  getUserById,
} from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { extractFirstPhoneNumber } from "@/utils/phone";
import { getEventTheme } from "@/lib/event-theme";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const awaitedParams = await params;
  const awaitedSearchParams = await (searchParams as any);
  const acceptRaw = String(
    ((awaitedSearchParams as any)?.accept ?? "") as string
  )
    .trim()
    .toLowerCase();
  const autoAccept = acceptRaw === "1" || acceptRaw === "true";
  // Try to resolve by slug, slug-id, or id; prefer user context for slug-only matches
  const session: any = await getServerSession(authOptions as any);
  const sessionEmail = (session?.user?.email as string | undefined) || null;
  const userId = sessionEmail ? await getUserIdByEmail(sessionEmail) : null;
  const row = await getEventHistoryBySlugOrId({
    value: awaitedParams.id,
    userId,
  });
  if (!row) return notFound();
  const isOwner = Boolean(userId && row.user_id && userId === row.user_id);
  const ownerUser =
    !isOwner && row.user_id ? await getUserById(row.user_id) : null;
  const ownerDisplayName = (() => {
    if (!ownerUser) return "Unknown";
    const full = [ownerUser.first_name || "", ownerUser.last_name || ""]
      .join(" ")
      .trim();
    return full || ownerUser.email || "Unknown";
  })();
  let recipientAccepted = false;
  let recipientPending = false;
  let isReadOnly = false; // Read-only mode for non-authenticated users
  const isShared = Boolean((row.data as any)?.shared);
  const isSharedOut = Boolean((row.data as any)?.sharedOut);
  if (!isOwner) {
    if (!userId) {
      // Allow viewing in read-only mode for non-authenticated users
      isReadOnly = true;
    } else {
      const access = await isEventSharedWithUser(row.id, userId);
      if (access === true) {
        // ok
        recipientAccepted = true;
      } else if (access === false) {
        const pending = await isEventSharePendingForUser(row.id, userId);
        if (pending) {
          recipientPending = true;
          if (autoAccept) {
            try {
              await fetch(`/api/events/share/accept`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ eventId: row.id }),
                cache: "no-store",
              });
            } catch {}
          }
        } else {
          // Not shared with this user, allow read-only access
          isReadOnly = true;
        }
      } else if (access === null) {
        // No shares table → allow read-only access
        isReadOnly = true;
      }
    }
  }
  let shareStats: { accepted_count: number; pending_count: number } | null =
    null;
  if (isOwner) {
    try {
      const stats = await listSharesByOwnerForEvents(userId!, [row.id]);
      const s = stats.find((x) => x.event_id === row.id);
      if (s)
        shareStats = {
          accepted_count: s.accepted_count,
          pending_count: s.pending_count,
        };
    } catch {}
  }
  const title = row.title as string;
  const createdAt = row.created_at as string | undefined;
  const data = row.data as any;
  const slugify = (t: string) =>
    (t || "event")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const slug = slugify(title);
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const canonical = `/event/${slug}-${row.id}`;
  const shareUrl = `${base}${canonical}`;

  // Redirect to canonical slug-id URL if needed
  if (awaitedParams.id !== `${slug}-${row.id}`) {
    redirect(canonical);
  }
  if (autoAccept) {
    redirect(canonical);
  }

  // Detect RSVP phone and build SMS/Call links
  // First try the rsvp field, then fall back to searching description/location
  const rsvpField = (data?.rsvp as string | undefined) || "";
  const aggregateContactText = `${rsvpField} ${
    (data?.description as string | undefined) || ""
  } ${(data?.location as string | undefined) || ""}`.trim();
  const rsvpPhone = extractFirstPhoneNumber(aggregateContactText);

  // Extract just the name from RSVP field (remove "RSVP:" prefix and phone number)
  const rsvpName = rsvpField
    ? rsvpField
        .replace(/^RSVP:?\s*/i, "") // Remove "RSVP:" or "RSVP" prefix
        .replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, "") // Remove phone number
        .replace(/\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/g, "") // Remove (555) 123-4567 format
        .trim()
    : "";
  const userName = ((session as any)?.user?.name as string | undefined) || "";
  const smsIntroParts = [
    "Hi, there,",
    userName ? ` this is ${userName},` : "",
    " RSVP-ing for ",
    title || "the event",
  ];
  const isSignedIn = Boolean(sessionEmail);
  const eventTheme = getEventTheme(
    (data?.category as string | undefined) || null
  );
  const categoryLabel = eventTheme.categoryLabel;
  const themeStyleVars = {
    "--event-header-gradient-light": eventTheme.headerLight,
    "--event-header-gradient-dark": eventTheme.headerDark,
    "--event-card-bg-light": eventTheme.cardLight,
    "--event-card-bg-dark": eventTheme.cardDark,
    "--event-border-light": eventTheme.borderLight,
    "--event-border-dark": eventTheme.borderDark,
    "--event-chip-light": eventTheme.chipLight,
    "--event-chip-dark": eventTheme.chipDark,
    "--event-text-light": eventTheme.textLight,
    "--event-text-dark": eventTheme.textDark,
  } satisfies Record<string, string>;

  // Determine whether the event is in the future for conditional rendering
  const isFutureEvent = (() => {
    try {
      const startIso = (data?.startISO as string | undefined) || null;
      const rawStart = (data?.start as string | undefined) || null;
      const parsed = startIso
        ? new Date(startIso)
        : rawStart
        ? new Date(rawStart)
        : null;
      return parsed ? parsed.getTime() > Date.now() : false;
    } catch {
      return false;
    }
  })();

  // Compute a right padding to avoid text flowing under the thumbnail overlay
  const detailsExtraPaddingRight = data?.thumbnail ? " pr-32 sm:pr-40" : "";

  return (
    <main className="max-w-3xl mx-auto px-10 py-14 ipad-gutters pl-[calc(2rem+env(safe-area-inset-left))] pr-[calc(2rem+env(safe-area-inset-right))] pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
      {isReadOnly && (
        <div className="mb-6 flex justify-center">
          <img
            src="/SnapMyDateSnapItSaveitDone_Black_vertical.png"
            alt="Snap My Date tag line"
            className="block h-24 w-auto dark:hidden"
          />
          <img
            src="/SnapMyDateSnapItSaveitDone_White_vertical.png"
            alt="Snap My Date tag line"
            className="hidden h-24 w-auto dark:block"
          />
        </div>
      )}
      <div
        className="event-theme-scope space-y-6"
        style={themeStyleVars as CSSProperties}
      >
        <section className="event-theme-header relative overflow-hidden rounded-2xl border shadow-lg px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="event-theme-chip flex h-14 w-14 items-center justify-center rounded-full text-3xl shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                  <span aria-hidden="true">{eventTheme.icon}</span>
                  <span className="sr-only">{categoryLabel} icon</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                  {categoryLabel}
                </p>
              </div>
              {!isReadOnly && isOwner && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <EventEditModal
                    eventId={row.id}
                    eventData={data}
                    eventTitle={title}
                  />
                  <EventDeleteModal eventId={row.id} eventTitle={title} />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold leading-tight sm:text-2xl">
                {title}
              </h1>
              {(isShared || isSharedOut) && (
                <svg
                  viewBox="0 0 25.274 25.274"
                  fill="currentColor"
                  className="h-6 w-6 opacity-70"
                  aria-hidden="true"
                  aria-label="Shared event"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M24.989,15.893c-0.731-0.943-3.229-3.73-4.34-4.96c0.603-0.77,0.967-1.733,0.967-2.787c0-2.503-2.03-4.534-4.533-4.534 c-2.507,0-4.534,2.031-4.534,4.534c0,1.175,0.455,2.24,1.183,3.045l-1.384,1.748c-0.687-0.772-1.354-1.513-1.792-2.006 c0.601-0.77,0.966-1.733,0.966-2.787c-0.001-2.504-2.03-4.535-4.536-4.535c-2.507,0-4.536,2.031-4.536,4.534 c0,1.175,0.454,2.24,1.188,3.045L0.18,15.553c0,0-0.406,1.084,0,1.424c0.36,0.3,0.887,0.81,1.878,0.258 c-0.107,0.974-0.054,2.214,0.693,2.924c0,0,0.749,1.213,2.65,1.456c0,0,2.1,0.244,4.543-0.367c0,0,1.691-0.312,2.431-1.794 c0.113,0.263,0.266,0.505,0.474,0.705c0,0,0.751,1.213,2.649,1.456c0,0,2.103,0.244,4.54-0.367c0,0,2.102-0.38,2.65-2.339 c0.297-0.004,0.663-0.097,1.149-0.374C24.244,18.198,25.937,17.111,24.989,15.893z M13.671,8.145c0-1.883,1.527-3.409,3.409-3.409 c1.884,0,3.414,1.526,3.414,3.409c0,1.884-1.53,3.411-3.414,3.411C15.198,11.556,13.671,10.029,13.671,8.145z M13.376,12.348 l0.216,0.516c0,0-0.155,0.466-0.363,1.069c-0.194-0.217-0.388-0.437-0.585-0.661L13.376,12.348z M3.576,8.145 c0-1.883,1.525-3.409,3.41-3.409c1.881,0,3.408,1.526,3.408,3.409c0,1.884-1.527,3.411-3.408,3.411 C5.102,11.556,3.576,10.029,3.576,8.145z M2.186,16.398c-0.033,0.07-0.065,0.133-0.091,0.177c-0.801,0.605-1.188,0.216-1.449,0 c-0.259-0.216,0-0.906,0-0.906l2.636-3.321l0.212,0.516c0,0-0.227,0.682-0.503,1.47l-0.665,1.49 C2.325,15.824,2.257,16.049,2.186,16.398z M9.299,20.361c-2.022,0.507-3.758,0.304-3.758,0.304 c-1.574-0.201-2.196-1.204-2.196-1.204c-1.121-1.066-0.348-3.585-0.348-3.585l1.699-3.823c0.671,0.396,1.451,0.627,2.29,0.627 c0.584,0,1.141-0.114,1.656-0.316l2.954,5.417C11.482,19.968,9.299,20.361,9.299,20.361z M9.792,12.758l0.885-0.66 c0,0,2.562,2.827,3.181,3.623c0.617,0.794-0.49,1.501-0.75,1.723c-0.259,0.147-0.464,0.206-0.635,0.226L9.792,12.758z M19.394,20.361c-2.018,0.507-3.758,0.304-3.758,0.304c-1.569-0.201-2.191-1.204-2.191-1.204c-0.182-0.175-0.311-0.389-0.403-0.624 c0.201-0.055,0.433-0.15,0.698-0.301c0.405-0.337,2.102-1.424,1.154-2.643c-0.24-0.308-0.678-0.821-1.184-1.405l1.08-2.435 c0.674,0.396,1.457,0.627,2.293,0.627c0.585,0,1.144-0.114,1.654-0.316l2.955,5.417C21.582,19.968,19.394,20.361,19.394,20.361z M23.201,17.444c-0.255,0.147-0.461,0.206-0.63,0.226l-2.68-4.912l0.879-0.66c0,0,2.562,2.827,3.181,3.623 C24.57,16.516,23.466,17.223,23.201,17.444z"></path>
                </svg>
              )}
            </div>
            {createdAt && isSignedIn && (
              <p className="text-sm opacity-80">
                Created {new Date(createdAt).toLocaleString()}
              </p>
            )}
            {!isOwner && ownerDisplayName && (
              <p className="text-sm opacity-80">Hosted by {ownerDisplayName}</p>
            )}
          </div>
        </section>

        <section
          className={`event-theme-card rounded-2xl border px-6 py-6 shadow-sm`}
        >
          <dl className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
            {data?.allDay && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  When
                </dt>
                <dd className="mt-1 text-base font-semibold">All day event</dd>
              </div>
            )}
            {data?.start && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  Start
                </dt>
                <dd className="mt-1 break-all text-base font-semibold">
                  {data.start}
                </dd>
              </div>
            )}
            {data?.end && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  End
                </dt>
                <dd className="mt-1 break-all text-base font-semibold">
                  {data.end}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Location
              </dt>
              <dd className="mt-1 text-base font-semibold">
                {data?.location || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Category
              </dt>
              <dd className="mt-1 text-base font-semibold">
                {data?.category || categoryLabel || "—"}
              </dd>
            </div>
            {(rsvpName || rsvpPhone) && (
              <div className="sm:col-span-2 space-y-2">
                <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  RSVP
                </dt>
                <dd className="space-y-2">
                  {rsvpName && (
                    <p className="text-sm font-medium">{rsvpName}</p>
                  )}
                  <EventRsvpPrompt
                    rsvpName={rsvpName}
                    rsvpPhone={rsvpPhone}
                    eventTitle={title}
                    shareUrl={shareUrl}
                  />
                </dd>
              </div>
            )}
          </dl>
          {data?.description && (
            <div className="mt-6 border-t border-black/10 pt-4 text-sm leading-relaxed dark:border-white/15">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Description
              </p>
              <p className="mt-2 whitespace-pre-wrap">{data.description}</p>
            </div>
          )}

          {data?.thumbnail && (
            <div className="mt-6 flex justify-center">
              <ThumbnailModal
                src={data.thumbnail as string}
                alt={`${title} flyer`}
                className="relative rounded border border-border bg-surface px-2 py-2 shadow"
              />
            </div>
          )}

          <EventActions
            shareUrl={shareUrl}
            event={data as any}
            className="mt-6 w-full"
            historyId={!isReadOnly ? row.id : undefined}
          />
        </section>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {!isReadOnly && isOwner && (
          <section className="rounded border border-border p-3 bg-surface">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground/80">
                Guests invited:
              </h3>
            </div>
            {/* Recipient list (server-rendered) */}
            {(() => {
              const List = () => null; // noop placeholder for JSX lints
              return null;
            })()}
            {shareStats ? (
              <div className="mt-2">
                {/* Detailed list with remove buttons */}
                <ul className="space-y-1">
                  {(
                    await (async () => {
                      try {
                        return await listShareRecipientsForEvent(
                          userId!,
                          row.id
                        );
                      } catch {
                        return [] as any[];
                      }
                    })()
                  ).map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate">
                        {r.name} —{" "}
                        {r.status === "accepted" ? "Accepted" : "Pending"}
                      </span>
                      <form
                        action={async () => {
                          "use server";
                          try {
                            await revokeShareByOwner(r.id, userId!);
                          } catch {}
                          try {
                            revalidatePath(canonical);
                          } catch {}
                          redirect(canonical);
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors rounded-md"
                          title="Remove access"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <polyline points="3,6 5,6 21,6" />
                            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </form>
                    </li>
                  ))}
                  <li className="pt-1">
                    <span className="text-xs text-foreground/70">
                      Use the "Invite" button below to add more participants.
                    </span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="mt-2 text-xs text-foreground/70">
                No guests invited yet.
                <br />
                Use the "Invite" button below to add guests.
              </div>
            )}
          </section>
        )}
        {/* +Add has been moved to the Shared with box header */}
        {!isReadOnly && !isOwner ? (
          <section className="rounded border border-border p-3 bg-surface">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground/80">
                Shared by:
              </h3>
              {(isShared || recipientAccepted) && (
                <form
                  action={async () => {
                    "use server";
                    try {
                      await revokeEventShare({
                        eventId: row.id,
                        byUserId: userId!,
                      });
                    } catch {}
                    try {
                      revalidatePath(canonical);
                    } catch {}
                    redirect(canonical);
                  }}
                >
                  <button
                    type="submit"
                    className="inline-flex items-center gap-3 rounded-lg px-3 py-2 text-red-500 hover:bg-red-500/10"
                    title="Remove this shared event from my calendar"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </form>
              )}
            </div>
            <ul className="mt-2 space-y-1">
              <li className="flex items-center justify-between text-sm">
                <span className="truncate">
                  {ownerDisplayName} —{" "}
                  {recipientPending ? "Pending" : "Accepted"}
                </span>
                {recipientPending && (
                  <form
                    action={async () => {
                      "use server";
                      try {
                        await acceptEventShare({
                          eventId: row.id,
                          recipientUserId: userId!,
                        });
                      } catch {}
                      try {
                        revalidatePath(canonical);
                      } catch {}
                      redirect(canonical);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-xs rounded border border-border bg-surface px-3 py-1 hover:bg-foreground/5"
                      title="Accept and add to my calendar"
                    >
                      Accept
                    </button>
                  </form>
                )}
              </li>
            </ul>
          </section>
        ) : null}
      </div>
      {isReadOnly && (
        <div className="mt-6">
          <ReadOnlyBanner />
        </div>
      )}
    </main>
  );
}
