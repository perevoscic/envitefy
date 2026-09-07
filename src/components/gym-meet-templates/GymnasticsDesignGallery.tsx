"use client";

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
  return (
    <EventDesignGallery
      title="Gymnastics"
      description="First, find your meet’s style. Then upload a packet, paste a meet link, or add your details by hand. We’ll bring it all together in your chosen design."
      designs={designs}
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
