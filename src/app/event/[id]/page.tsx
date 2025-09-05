import { notFound } from "next/navigation";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";
import { getEventHistoryById } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const awaitedParams = await params;
  const row = await getEventHistoryById(awaitedParams.id);
  if (!row) return notFound();
  const session: any = await getServerSession(authOptions as any);
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
  const sessionUserId: string | undefined = (session?.user as any)?.id;
  const ownerId = row.user_id || sessionUserId || null;
  const shareUrl = ownerId
    ? `${base}/${ownerId}/event/${encodeURIComponent(slug)}`
    : `${base}/event/${awaitedParams.id}`;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        {createdAt && (
          <p className="text-sm text-foreground/70">
            Created {new Date(createdAt).toLocaleString()}
          </p>
        )}
        <div className="flex gap-2 pt-2">
          <CopyButton
            text={shareUrl}
            className="px-3 py-1.5 rounded border border-border bg-surface hover:bg-surface/80"
          >
            Copy share link
          </CopyButton>
          <Link
            href={`/api/ics?title=${encodeURIComponent(
              data?.title || title
            )}&start=${encodeURIComponent(
              data?.start || ""
            )}&end=${encodeURIComponent(
              data?.end || ""
            )}&location=${encodeURIComponent(
              data?.location || ""
            )}&description=${encodeURIComponent(
              data?.description || ""
            )}&timezone=${encodeURIComponent(
              data?.timezone || "America/Chicago"
            )}`}
            className="px-3 py-1.5 rounded border border-border bg-surface hover:bg-surface/80"
          >
            Download ICS
          </Link>
        </div>
      </div>

      <section className="mt-6 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground/80">Details</h2>
          <div className="mt-2 rounded border border-border p-3 bg-surface">
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
    </main>
  );
}
