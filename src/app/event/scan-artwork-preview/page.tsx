import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import EventActions from "@/components/EventActions";
import EventDeleteModal from "@/components/EventDeleteModal";
import GenericEventSkin from "@/components/GenericEventSkin";
import EventSidebarRoute from "@/components/navigation/EventSidebarRoute";
import ScanArtworkProvider from "@/components/ScanArtworkProvider";
import { absoluteUrl } from "@/lib/absolute-url";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventHistoryPublicRenderBySlugOrId } from "@/lib/db";
import { buildOcrFacts, mergeOcrFacts, normalizeOcrFacts } from "@/lib/ocr/facts";
import { buildEventPath } from "@/utils/event-url";

export default async function ScanArtworkPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  const userId = await resolveSessionUserId(await getServerSession(authOptions));
  if (!userId) notFound();
  const row = await getEventHistoryPublicRenderBySlugOrId({
    value:
      "emerald-ent-estab-pt-appointment-at-249-mack-bayou-loop-ste-301-santa-rosa-beach-fl-32459-7194",
    userId,
  });
  if (!row || row.user_id !== userId) notFound();
  const title = "Lara ENT appointment";
  const eventHref = buildEventPath(row.id, row.title, undefined, row.public_slug);
  const shareUrl = await absoluteUrl(eventHref);
  // Read the owner's saved facts rather than committing patient identifiers in this fixture.
  const facts = mergeOcrFacts(
    normalizeOcrFacts(row.data?.ocrFacts),
    buildOcrFacts([{ label: "Host", value: row.data?.hostName }]),
  );
  return (
    <ScanArtworkProvider
      eventId="preview"
      canManage={false}
      originalPlacement="before-footer"
      policy={{ sourceKind: "paperwork", heroMode: "generated", medical: true }}
      original={{ name: String(row.data.attachment?.name || "Original appointment document"), viewUrl: `/api/events/${row.id}/original`, downloadUrl: `/api/events/${row.id}/original?download=1`, ownerOnly: true }}
      initialArtwork={{
        version: 1,
        status: "ready",
        imageUrl: "/examples/scan-artwork/pediatric-ent.webp",
        heroImageUrl: "/examples/scan-artwork/pediatric-ent-hero.webp",
      }}
    >
      <EventSidebarRoute eventHref={eventHref} />
      <GenericEventSkin
        title={title}
        categoryLabel="Medical Appointments"
        dateLabel="Monday, November 2"
        timeLabel="8:10 AM"
        location="249 Mack Bayou Loop, Suite 301, Santa Rosa Beach, FL 32459-7194"
        imageUrl={null}
        ocrFacts={facts}
        actions={
          <div className="flex min-h-11 items-center gap-2 text-sm font-medium sm:gap-3" role="group" aria-label="Event actions">
            <EventActions
              shareUrl={shareUrl}
              event={null}
              calendarTitle={title}
              historyId={row.id}
              variant="compact"
              showCalendar={false}
              showEmail={false}
            />
            <EventDeleteModal
              eventId={row.id}
              eventTitle={title}
              buttonClassName="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white/90 px-3 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              labelClassName="hidden sm:inline"
              ariaLabel={`Delete ${title}`}
            />
          </div>
        }
      />
    </ScanArtworkProvider>
  );
}
