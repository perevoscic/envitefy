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
  return <GymMeetTemplateRenderer
    model={normalizeGymMeetEventData({
      eventTitle: design.previewTitle,
      eventData: {
        pageTemplateId: design.id, title: design.previewTitle,
        date: "2028-09-21", time: "09:00", timezone: "America/Chicago",
        hostGym: design.sampleHost, venue: design.sampleVenue, location: design.sampleLocation,
        details: design.sampleNote, rsvpEnabled: false,
      },
      navItems: [{ id: "overview", label: "Meet details" }, { id: "schedule", label: "Schedule" }],
      rosterAthletes: [], headerLocation: design.sampleLocation,
    })}
    rsvpProps={previewRsvp} isOwner={false} isReadOnly hideOwnerActions suppressActionStrip
    onShare={ignoreAction} onCalendar={ignoreAction} onGoogleCalendar={ignoreAction}
    onAppleCalendar={ignoreAction} onOutlookCalendar={ignoreAction}
  />;
}
