"use client";

import { Upload } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import EventDesignGallery from "@/components/events/EventDesignGallery";
import GymMeetTemplateRenderer from "./GymMeetTemplateRenderer";
import { normalizeGymMeetEventData } from "./normalizeGymMeetEventData";
import { GYM_MEET_TEMPLATE_LIBRARY } from "./registry";
import type { GymMeetRsvpProps } from "./types";

const ignoreAction = () => {};
const previewRsvp: GymMeetRsvpProps = {
  enabled: false, submitted: false, attending: "", setAttending: ignoreAction,
  rosterAthletes: [], selectedAthleteId: "", setSelectedAthleteId: ignoreAction,
  nameInput: "", setNameInput: ignoreAction, guestEmailInput: "", setGuestEmailInput: ignoreAction,
  guestPhoneInput: "", setGuestPhoneInput: ignoreAction, isSignedIn: false,
  allowGuestAttendanceRsvp: false, submitting: false, onSubmit: ignoreAction, onReset: ignoreAction,
};

// Match the available collection in the editor's template selector.
const designs = GYM_MEET_TEMPLATE_LIBRARY.filter((design) => design.id !== "elite-athlete");

export default function GymnasticsDesignGallery() {
  const search = useSearchParams();
  const date = search?.get("d");
  const importParams = new URLSearchParams({ mode: "import" });
  if (date) importParams.set("d", date);
  return (
    <EventDesignGallery
      title="Gymnastics"
      description="Give your meet a home. Choose a design, then bring your schedule, team details, and meet-day plans together in one link."
      designs={designs}
      action={
        <Link href={`/event/gymnastics?${importParams.toString()}`} className="inline-flex items-center gap-2 rounded-full border border-[#dcd0dc] bg-white px-5 py-3 text-sm font-semibold text-[#59405c] hover:bg-[#f2eaf2]">
          <Upload className="h-4 w-4" aria-hidden="true" /> Import a meet packet or link
        </Link>
      }
      getHref={(design) => {
        const params = new URLSearchParams({ templateId: design.id });
        if (date) params.set("d", date);
        if (search?.get("demo") === "1") params.set("demo", "1");
        return `/event/gymnastics/customize?${params.toString()}`;
      }}
      renderPreview={(design) => (
        <GymMeetTemplateRenderer
          model={normalizeGymMeetEventData({
            eventTitle: design.previewTitle,
            eventData: {
              pageTemplateId: design.id,
              title: design.previewTitle,
              date: "2028-09-21", time: "09:00", timezone: "America/Chicago",
              hostGym: "Summit Gymnastics", venue: "Riverfront Arena", city: "Chicago", state: "IL",
              details: "A weekend of big moments. Find your session, plan your arrival, and cheer on the team.",
              rsvpEnabled: false,
            },
            navItems: [{ id: "overview", label: "Meet details" }, { id: "schedule", label: "Schedule" }],
            rosterAthletes: [], headerLocation: "Chicago, IL",
          })}
          rsvpProps={previewRsvp}
          isOwner={false} isReadOnly hideOwnerActions suppressActionStrip
          onShare={ignoreAction} onCalendar={ignoreAction} onGoogleCalendar={ignoreAction}
          onAppleCalendar={ignoreAction} onOutlookCalendar={ignoreAction}
        />
      )}
    />
  );
}
