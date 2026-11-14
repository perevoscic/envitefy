import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import EventPreviewViewport from "../../src/components/EventPreviewViewport";
import { applyAppearance } from "../../src/lib/appearance";
import { Pencil, Share2, UsersRound, Link2, Trash2 } from "lucide-react";
import toolbarStyles from "../../src/components/event-preview-toolbar.module.css";
import GymMeetTemplateRenderer from "../../src/components/gym-meet-templates/GymMeetTemplateRenderer";
import type { GymMeetRsvpProps } from "../../src/components/gym-meet-templates/types";
import { normalizeGymMeetEventData } from "../../src/components/gym-meet-templates/normalizeGymMeetEventData";
import { EventPageCompositionProvider } from "../../src/components/events/EventPageCompositionContext";
import { DEFAULT_EVENT_HERO_LAYOUT } from "../../src/lib/event-hero-layout";
import { createImportedEventTheme } from "../../src/lib/imported-event-theme";
import { resolveEventPageBackgroundColor } from "../../src/lib/theme-color";

const meetArtwork = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024"><rect width="1536" height="1024" fill="#798cb4"/><path d="M0 720L760 180 1536 720V1024H0Z" fill="#bdc9df"/></svg>');
const generatedTheme = createImportedEventTheme({ title: "Harbor Invitational", sport: "gymnastics", seed: "cold-owner-view",
  branding: { version: 1, origin: "pdf", tone: "dark", colors: ["#111b3a", "#ff78b7", "#b787ff"] },
});
const savedMeet = { category: "sport_gymnastics", pageTemplateId: "airborne-atlas", importedTheme: generatedTheme };
const meetModel = normalizeGymMeetEventData({ eventTitle: "Harbor Invitational", eventData: {
  title: "Harbor Invitational", pageTemplateId: "airborne-atlas", date: "2027-01-15", hostGym: "Harbor Gymnastics", venue: "Harbor Convention Center", heroImage: meetArtwork,
}, navItems: [], rosterAthletes: [] });
const ignoreAction = () => {};
const previewRsvp: GymMeetRsvpProps = {
  enabled: false, submitted: false, attending: "", setAttending: ignoreAction,
  rosterAthletes: [], selectedAthleteId: "", setSelectedAthleteId: ignoreAction,
  nameInput: "", setNameInput: ignoreAction, guestEmailInput: "", setGuestEmailInput: ignoreAction,
  guestPhoneInput: "", setGuestPhoneInput: ignoreAction, isSignedIn: false,
  allowGuestAttendanceRsvp: false, submitting: false, onSubmit: ignoreAction, onReset: ignoreAction,
};

applyAppearance(new URLSearchParams(location.search).has("dark") ? "dark" : "light", false);

function MeetContent() {
  const original = new URLSearchParams(location.search).has("original");
  return <EventPageCompositionProvider value={original ? undefined : { version: 1, sections: [], hero: DEFAULT_EVENT_HERO_LAYOUT }}>
    <GymMeetTemplateRenderer model={meetModel} rsvpProps={previewRsvp} isOwner={false} isReadOnly hideOwnerActions mobileEditHref="/event/meet?edit=meet&editor=menu" onShare={ignoreAction} />
  </EventPageCompositionProvider>;
}

function Fixture() {
  const [closed, setClosed] = useState(false);
  const [lastAction, setLastAction] = useState("");
  const owner = new URLSearchParams(location.search).has("owner");
  const remote = new URLSearchParams(location.search).has("remote");
  const gymnastics = new URLSearchParams(location.search).has("gymnastics");
  const generated = new URLSearchParams(location.search).has("generated");
  return closed ? <output>Preview closed</output> : <div style={{ height: "100dvh" }}>
    <EventPreviewViewport
      title="Harbor Invitational"
      initialDevice={new URLSearchParams(location.search).has("desktop") ? "desktop" : undefined}
      preserveNavigation={owner}
      initialBackground={generated ? { backgroundColor: resolveEventPageBackgroundColor(savedMeet) } : undefined}
      src={remote ? "/event-fixture" : undefined}
      onClose={owner ? undefined : () => setClosed(true)}
      actions={owner ? <div role="group" aria-label="Event actions" className="flex flex-col lg:flex-row">
        {([
          ["Edit event", "Edit", Pencil], ["Share event", "Share", Share2],
          ["Manage access", "Manage access", UsersRound], ["Custom URL", "Custom URL", Link2], ["Delete event", "Delete", Trash2],
        ] as const).map(([label, text, Icon]) => <button key={label} type="button" aria-label={label} className={`${toolbarStyles.control} ${toolbarStyles.ownerControl} inline-flex`} onClick={() => setLastAction(label)}>
          <Icon size={21} aria-hidden="true" /><span>{text}</span>
        </button>)}
        <output data-preview-action className="sr-only">{lastAction}</output>
      </div> : undefined}
    >
      {gymnastics ? <MeetContent /> : <article style={{ minHeight: "100vh", background: "#111b3a", color: "white", padding: 24 }}>
        <div style={{ height: 180, borderRadius: 12, background: "linear-gradient(145deg,#646baf,#db85ab 55%,#d0b98e)" }} />
        <p style={{ marginTop: 24, letterSpacing: 3, fontSize: 12 }}>GYMNASTICS MEET</p>
        <h1 style={{ font: "48px/1.1 Georgia,serif", margin: "20px 0" }}>Harbor Invitational</h1>
        <p>January 15–17, 2027</p>
        <label>Guest name <input aria-label="Guest name" style={{ color: "#111b3a", background: "white" }} /></label>
        <div style={{ height: 1000, paddingTop: 40 }}><h2>Meet details</h2><p>The full event scrolls inside the device screen.</p></div>
        <button type="button" onClick={(event) => { event.currentTarget.textContent = "Response retained"; }}>End of event</button>
      </article>}
    </EventPreviewViewport>
  </div>;
}

if (new URLSearchParams(location.search).has("serverMarkup")) {
  // Exercise server HTML without hydrating or measuring a viewport afterward.
  document.getElementById("root")!.innerHTML = renderToStaticMarkup(new URLSearchParams(location.search).has("serverMeet") ? <MeetContent /> : <Fixture />);
} else {
  createRoot(document.getElementById("root")!).render(<Fixture />);
}
