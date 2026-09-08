"use client";

import GymMeetTemplateRenderer from "./GymMeetTemplateRenderer";
import { normalizeGymMeetEventData } from "./normalizeGymMeetEventData";
import type { GymMeetPageTemplateMeta, GymMeetRsvpProps } from "./types";

const ignoreAction = () => {};
const previewRsvp: GymMeetRsvpProps = {
  enabled: false, submitted: false, attending: "", setAttending: ignoreAction,
  rosterAthletes: [], selectedAthleteId: "", setSelectedAthleteId: ignoreAction,
  nameInput: "", setNameInput: ignoreAction, guestEmailInput: "", setGuestEmailInput: ignoreAction,
  guestPhoneInput: "", setGuestPhoneInput: ignoreAction, isSignedIn: false,
  allowGuestAttendanceRsvp: false, submitting: false, onSubmit: ignoreAction, onReset: ignoreAction,
};

export default function GymnasticsPreview({ design }: { design: GymMeetPageTemplateMeta }) {
  const model = normalizeGymMeetEventData({
      eventTitle: design.previewTitle,
      eventData: {
        pageTemplateId: design.id, title: design.previewTitle,
        date: "2028-09-21", time: "09:00", timezone: "America/Chicago",
        hostGym: design.sampleHost, venue: design.sampleVenue, location: design.sampleLocation,
        details: design.sampleNote, rsvpEnabled: false,
      },
      navItems: [{ id: "overview", label: "Meet details" }, { id: "schedule", label: "Schedule" }],
      rosterAthletes: [], headerLocation: design.sampleLocation,
    });
  // Preview a sample meet program without starting maps or other live embeds for every card.
  model.discovery = { sections: [{
    id: "overview", label: "Meet details", kind: "meet_overview", priority: 0, hasContent: true,
    blocks: [
      { id: "welcome", type: "text", title: "A day of great gymnastics", text: design.sampleNote },
      { id: "program", type: "card-grid", columns: 3, cards: [
        { key: "warmup", label: "Warmup", value: "9:00 AM", body: "Get ready with your team" },
        { key: "competition", label: "Competition", value: "10:00 AM", body: "Let your hard work shine" },
        { key: "awards", label: "Awards", value: "After each session", body: "Celebrate every achievement" },
      ] },
    ],
  }] };
  return <GymMeetTemplateRenderer model={model}
    rsvpProps={previewRsvp} isOwner={false} isReadOnly hideOwnerActions suppressActionStrip
    onShare={ignoreAction} onCalendar={ignoreAction} onGoogleCalendar={ignoreAction}
    onAppleCalendar={ignoreAction} onOutlookCalendar={ignoreAction}
  />;
}
