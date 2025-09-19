import { notFound } from "next/navigation";
import Link from "next/link";
import EventActions from "@/components/EventActions";
import ThumbnailModal from "@/components/ThumbnailModal";
import EventEditModal from "@/components/EventEditModal";
import EventDeleteModal from "@/components/EventDeleteModal";
import {
  listSharesByOwnerForEvents,
  isEventSharedWithUser,
  isEventSharePendingForUser,
} from "@/lib/db";
import { getEventHistoryBySlugOrId, getUserIdByEmail } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { extractFirstPhoneNumber } from "@/utils/phone";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const awaitedParams = await params;
  const acceptRaw = String(((searchParams as any)?.accept ?? "") as string)
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
  const isShared = Boolean((row.data as any)?.shared);
  const isSharedOut = Boolean((row.data as any)?.sharedOut);
  if (!isOwner) {
    if (!userId) return notFound();
    const access = await isEventSharedWithUser(row.id, userId);
    if (access === true) {
      // ok
    } else if (access === false) {
      const pending = await isEventSharePendingForUser(row.id, userId);
      if (!pending) return notFound();
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
    } else if (access === null) {
      // No shares table → require shared marker
      if (!isShared) return notFound();
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
  const aggregateContactText = `${(data?.rsvp as string | undefined) || ""} ${
    (data?.description as string | undefined) || ""
  } ${(data?.location as string | undefined) || ""}`.trim();
  const rsvpPhone = extractFirstPhoneNumber(aggregateContactText);
  const userName = ((session as any)?.user?.name as string | undefined) || "";
  const smsIntroParts = [
    "Hi, there,",
    userName ? ` this is ${userName},` : "",
    " RSVP-ing for ",
    title || "the event",
  ];
  const smsBody = `${smsIntroParts.join("").trim()}${
    shareUrl ? `\n${shareUrl}` : ""
  }`;
  const smsHref = rsvpPhone
    ? `sms:${encodeURIComponent(rsvpPhone)}?&body=${encodeURIComponent(
        smsBody
      )}`
    : null;
  const telHref = rsvpPhone ? `tel:${encodeURIComponent(rsvpPhone)}` : null;

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
      <div className="space-y-2">
        <h1 className="text-2xl font-bold inline-flex items-center gap-2">
          {title}
          {(isShared || isSharedOut) && (
            <svg
              viewBox="0 0 25.274 25.274"
              fill="currentColor"
              className="h-5 w-5 opacity-80"
              aria-hidden="true"
              aria-label="Shared event"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M24.989,15.893c-0.731-0.943-3.229-3.73-4.34-4.96c0.603-0.77,0.967-1.733,0.967-2.787c0-2.503-2.03-4.534-4.533-4.534 c-2.507,0-4.534,2.031-4.534,4.534c0,1.175,0.455,2.24,1.183,3.045l-1.384,1.748c-0.687-0.772-1.354-1.513-1.792-2.006 c0.601-0.77,0.966-1.733,0.966-2.787c-0.001-2.504-2.03-4.535-4.536-4.535c-2.507,0-4.536,2.031-4.536,4.534 c0,1.175,0.454,2.24,1.188,3.045L0.18,15.553c0,0-0.406,1.084,0,1.424c0.36,0.3,0.887,0.81,1.878,0.258 c-0.107,0.974-0.054,2.214,0.693,2.924c0,0,0.749,1.213,2.65,1.456c0,0,2.1,0.244,4.543-0.367c0,0,1.691-0.312,2.431-1.794 c0.113,0.263,0.266,0.505,0.474,0.705c0,0,0.751,1.213,2.649,1.456c0,0,2.103,0.244,4.54-0.367c0,0,2.102-0.38,2.65-2.339 c0.297-0.004,0.663-0.097,1.149-0.374C24.244,18.198,25.937,17.111,24.989,15.893z M13.671,8.145c0-1.883,1.527-3.409,3.409-3.409 c1.884,0,3.414,1.526,3.414,3.409c0,1.884-1.53,3.411-3.414,3.411C15.198,11.556,13.671,10.029,13.671,8.145z M13.376,12.348 l0.216,0.516c0,0-0.155,0.466-0.363,1.069c-0.194-0.217-0.388-0.437-0.585-0.661L13.376,12.348z M3.576,8.145 c0-1.883,1.525-3.409,3.41-3.409c1.881,0,3.408,1.526,3.408,3.409c0,1.884-1.527,3.411-3.408,3.411 C5.102,11.556,3.576,10.029,3.576,8.145z M2.186,16.398c-0.033,0.07-0.065,0.133-0.091,0.177c-0.801,0.605-1.188,0.216-1.449,0 c-0.259-0.216,0-0.906,0-0.906l2.636-3.321l0.212,0.516c0,0-0.227,0.682-0.503,1.47l-0.665,1.49 C2.325,15.824,2.257,16.049,2.186,16.398z M9.299,20.361c-2.022,0.507-3.758,0.304-3.758,0.304 c-1.574-0.201-2.196-1.204-2.196-1.204c-1.121-1.066-0.348-3.585-0.348-3.585l1.699-3.823c0.671,0.396,1.451,0.627,2.29,0.627 c0.584,0,1.141-0.114,1.656-0.316l2.954,5.417C11.482,19.968,9.299,20.361,9.299,20.361z M9.792,12.758l0.885-0.66 c0,0,2.562,2.827,3.181,3.623c0.617,0.794-0.49,1.501-0.75,1.723c-0.259,0.147-0.464,0.206-0.635,0.226L9.792,12.758z M19.394,20.361c-2.018,0.507-3.758,0.304-3.758,0.304c-1.569-0.201-2.191-1.204-2.191-1.204c-0.182-0.175-0.311-0.389-0.403-0.624 c0.201-0.055,0.433-0.15,0.698-0.301c0.405-0.337,2.102-1.424,1.154-2.643c-0.24-0.308-0.678-0.821-1.184-1.405l1.08-2.435 c0.674,0.396,1.457,0.627,2.293,0.627c0.585,0,1.144-0.114,1.654-0.316l2.955,5.417C21.582,19.968,19.394,20.361,19.394,20.361z M23.201,17.444c-0.255,0.147-0.461,0.206-0.63,0.226l-2.68-4.912l0.879-0.66c0,0,2.562,2.827,3.181,3.623 C24.57,16.516,23.466,17.223,23.201,17.444z"></path>
            </svg>
          )}
        </h1>
        {createdAt && (
          <p className="text-sm text-foreground/70">
            Created {new Date(createdAt).toLocaleString()}
          </p>
        )}
      </div>

      <section className="mt-6 space-y-3">
        <div>
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-foreground/80">
              Details
            </h2>
            <div className="flex items-center gap-2">
              {isOwner && (
                <EventEditModal
                  eventId={row.id}
                  eventData={data}
                  eventTitle={title}
                />
              )}
              {isOwner ? (
                <EventDeleteModal eventId={row.id} eventTitle={title} />
              ) : null}
            </div>
          </div>
          <div
            className={`mt-2 rounded border border-border p-3 bg-surface relative${detailsExtraPaddingRight}`}
          >
            {data?.thumbnail && (
              <ThumbnailModal
                src={data.thumbnail as string}
                alt={`${title} flyer`}
              />
            )}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-foreground/70">Start</dt>
                <dd className="font-medium break-all">{data?.start || "—"}</dd>
              </div>
              <div>
                <dt className="text-foreground/70">End</dt>
                <dd className="font-medium break-all">{data?.end || "—"}</dd>
              </div>
              {!isFutureEvent && (
                <div>
                  <dt className="text-foreground/70">Timezone</dt>
                  <dd className="font-medium">{data?.timezone || "—"}</dd>
                </div>
              )}
              <div>
                <dt className="text-foreground/70">Location</dt>
                <dd className="font-medium">{data?.location || "—"}</dd>
              </div>
              <div>
                <dt className="text-foreground/70">Category</dt>
                <dd className="font-medium">{data?.category || "—"}</dd>
              </div>
              <div>
                <dt className="text-foreground/70">RSVP</dt>
                <dd className="font-medium">
                  {rsvpPhone ? (
                    <div className="flex flex-wrap items-center gap-3">
                      {smsHref && (
                        <a
                          href={smsHref}
                          className="underline hover:no-underline"
                        >
                          Text {rsvpPhone}
                        </a>
                      )}
                      {telHref && (
                        <a
                          href={telHref}
                          className="underline hover:no-underline"
                        >
                          Call
                        </a>
                      )}
                    </div>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
            {data?.description && (
              <div className="mt-3">
                <dt className="text-foreground/70 text-sm">Description</dt>
                <p className="whitespace-pre-wrap text-sm">
                  {data.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-3">
        {isOwner && (
          <section className="rounded border border-border p-3 bg-surface">
            <h3 className="text-sm font-semibold text-foreground/80">
              Share with
            </h3>
            <div className="mt-2 text-sm text-foreground/80 flex flex-wrap items-center gap-3">
              <span>
                {(shareStats?.accepted_count || 0) +
                  (shareStats?.pending_count || 0)}{" "}
                total
                {shareStats
                  ? ` · ${shareStats.accepted_count} accepted · ${shareStats.pending_count} pending`
                  : ""}
              </span>
              <span className="text-xs text-foreground/70">
                Use the “Share event” button below to add or remove recipients.
              </span>
            </div>
          </section>
        )}
        <EventActions
          shareUrl={shareUrl}
          event={data as any}
          className=""
          historyId={row.id}
        />
        {isOwner ? null : (
          <div className="flex items-center gap-3">
            {isShared ? (
              <form
                action={async () => {
                  "use server";
                  try {
                    await fetch(`/api/events/share/remove`, {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ eventId: row.id }),
                    });
                  } catch {}
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-red-500 rounded border border-red-500/40 bg-red-500/10 px-3 py-1 hover:bg-red-500/20"
                  title="Remove this shared event from my calendar"
                >
                  Remove from my calendar
                </button>
              </form>
            ) : (
              <form
                action={async () => {
                  "use server";
                  try {
                    await fetch(`/api/events/share/accept`, {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ eventId: row.id }),
                    });
                  } catch {}
                }}
              >
                <button
                  type="submit"
                  className="text-sm rounded border border-border bg-surface px-3 py-1 hover:bg-foreground/5"
                >
                  Add to my calendar
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
