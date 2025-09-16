import { notFound } from "next/navigation";
import Link from "next/link";
import EventActions from "@/components/EventActions";
import ThumbnailModal from "@/components/ThumbnailModal";
import EventEditModal from "@/components/EventEditModal";
import EventDeleteModal from "@/components/EventDeleteModal";
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
              <EventEditModal
                eventId={row.id}
                eventData={data}
                eventTitle={title}
              />
              <EventDeleteModal eventId={row.id} eventTitle={title} />
            </div>
          </div>
          <div className="mt-2 rounded border border-border p-3 bg-surface relative">
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
              <div>
                <dt className="text-foreground/70">Timezone</dt>
                <dd className="font-medium">{data?.timezone || "—"}</dd>
              </div>
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

      <EventActions shareUrl={shareUrl} event={data as any} className="mt-6" />
    </main>
  );
}
