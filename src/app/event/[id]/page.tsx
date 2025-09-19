import { notFound } from "next/navigation";
import Link from "next/link";
import EventActions from "@/components/EventActions";
import ThumbnailModal from "@/components/ThumbnailModal";
import EventEditModal from "@/components/EventEditModal";
import EventDeleteModal from "@/components/EventDeleteModal";
import { listSharesByOwnerForEvents, isEventSharedWithUser } from "@/lib/db";
import { getEventHistoryBySlugOrId, getUserIdByEmail } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { extractFirstPhoneNumber } from "@/utils/phone";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const awaitedParams = await params;
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
  if (!isOwner) {
    if (!userId) return notFound();
    const access = await isEventSharedWithUser(row.id, userId);
    // access === true → allow; false → deny; null (no shares table) → allow only if link owner emailed and category says Shared events
    if (access === false) return notFound();
    if (access === null && !isShared) return notFound();
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
        <h1 className="text-2xl font-bold">{title}</h1>
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
