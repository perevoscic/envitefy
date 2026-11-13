import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import ImportedThemeControls from "../../src/components/event-create/ImportedThemeControls";
import Renderer from "../../src/components/gym-meet-templates/GymMeetTemplateRenderer";
import { GYM_MEET_TEMPLATE_LIBRARY, getGymMeetTemplateMeta } from "../../src/components/gym-meet-templates/registry";
import { normalizeGymMeetEventData } from "../../src/components/gym-meet-templates/normalizeGymMeetEventData";
import { createImportedEventTheme, templateAccentColorCombinations, type ImportedEventTheme } from "../../src/lib/imported-event-theme";
import { EventPageReadOnlyProvider } from "../../src/components/events/EventPageReadOnlyContext";

const noop = () => {};
const rsvpProps = {
  enabled: true, submitted: false, attending: "yes", setAttending: noop, rosterAthletes: [], selectedAthleteId: "", setSelectedAthleteId: noop,
  nameInput: "Taylor", setNameInput: noop, guestEmailInput: "", setGuestEmailInput: noop, guestPhoneInput: "", setGuestPhoneInput: noop,
  isSignedIn: true, allowGuestAttendanceRsvp: false, submitting: false, onSubmit: noop, onReset: noop,
};
type Case = { id: string; variant: number; editing: boolean };
let openCase: (value: Case) => void;
function CaseView({ id, variant, editing }: Case) {
  const design = getGymMeetTemplateMeta(id);
  const [theme, setTheme] = useState<ImportedEventTheme>(() => ({
    ...createImportedEventTheme({ title: "Tampa Bay Turners Invitational 2027", sport: "gymnastics", seed: id,
      branding: { version: 1, origin: "pdf", tone: "dark", colors: ["#111b3a", "#ff78b7", "#b787ff"] },
    }), artworkUrl: "/media/event-media/retained.png",
    ...(variant === 1 ? { preserveTemplateStyle: true as const } : {}),
    ...(variant === 2 ? { enabled: false } : {}),
    ...(variant === 3 ? { templateColorCombination: { templateId: id, index: 4 } } : {}),
  }));
  const model = normalizeGymMeetEventData({ eventTitle: "Tampa Bay Turners Invitational 2027", eventData: {
    title: "Tampa Bay Turners Invitational 2027", pageTemplateId: id, importedTheme: theme, date: "2027-01-15", time: "09:00",
    timezone: "America/New_York", venue: "Bradenton Area Convention Center", address: "One Haben Blvd., Palmetto, FL 34221",
  }, navItems: [], rosterAthletes: [] });
  model.discovery.sections = [{ id: "overview", label: "Meet Details", kind: "meet_overview", hasContent: true, priority: 0, blocks: [
    { id: "welcome", type: "text", title: "Welcome", text: "Doors open at 8 AM. Bring a water bottle." },
    { id: "guide", type: "link-list", links: [{ label: "Visitor guide", url: "https://example.test/visitor-guide" }] },
    { id: "hotels", type: "card-grid", cards: [{ key: "hotel", label: "River Hotel", body: "Five minutes from the venue." }] },
  ] }];
  return <>
    <aside data-audit-controls><ImportedThemeControls templatePalette={design} value={theme} onChange={setTheme} /></aside>
    <EventPageReadOnlyProvider readOnly={!editing}>
      <div data-audit-canvas data-appearance-scope="authored"><Renderer model={model} rsvpProps={rsvpProps} isOwner={false} isReadOnly onShare={noop}
        onPageTextChange={editing ? noop : undefined} /></div>
    </EventPageReadOnlyProvider>
  </>;
}
function App() {
  const [value, setValue] = useState<Case>({ id: "airborne-atlas", variant: 0, editing: true });
  openCase = setValue;
  return <CaseView key={`${value.id}/${value.variant}/${value.editing}`} {...value} />;
}
flushSync(() => createRoot(document.getElementById("root")!).render(<App />));
(window as any).themeAudit = {
  designs: GYM_MEET_TEMPLATE_LIBRARY.map(design => ({ ...design, combinations: templateAccentColorCombinations(design),
    generatedCombinations: templateAccentColorCombinations({ ...design, background: "#111b3a", foreground: "#fff8f4", accent: "#ff78b7" }),
  })),
  open: (value: Case) => flushSync(() => openCase(value)),
};
