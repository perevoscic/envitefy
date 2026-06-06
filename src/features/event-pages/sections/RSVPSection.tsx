import EventRsvpPrompt from "@/components/EventRsvpPrompt";
import type { EventSection } from "../schemas/eventBlueprint.schema";
import { GenericListSection } from "./GenericListSection";

export function RSVPSection({
  section,
  eventId,
  eventTitle,
  shareUrl,
}: {
  section: EventSection;
  eventId: string;
  eventTitle: string;
  shareUrl?: string | null;
}) {
  const metadata = section.metadata || {};
  return (
    <div>
      <GenericListSection section={section} />
      <div className="mx-auto mt-4 max-w-6xl px-4 sm:px-6">
        <EventRsvpPrompt
          eventId={eventId}
          eventTitle={eventTitle}
          eventCategory="Event"
          shareUrl={shareUrl || undefined}
          allowDirectRsvp={Boolean(metadata.directRsvpEnabled)}
          rsvpName={typeof metadata.rsvpName === "string" ? metadata.rsvpName : undefined}
          rsvpPhone={typeof metadata.rsvpPhone === "string" ? metadata.rsvpPhone : undefined}
          rsvpEmail={typeof metadata.rsvpEmail === "string" ? metadata.rsvpEmail : undefined}
          rsvpUrl={typeof metadata.rsvpUrl === "string" ? metadata.rsvpUrl : undefined}
        />
      </div>
    </div>
  );
}
