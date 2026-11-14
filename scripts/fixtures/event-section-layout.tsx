import React, { useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import {
  EventSectionBuilderProvider,
  EventSectionPalette,
  EventSectionCanvas,
} from "../../src/components/events/EventSectionBuilder";
import { EventPageCompositionProvider } from "../../src/components/events/EventPageCompositionContext";
import GymnasticsProgram from "../../src/components/gym-meet-templates/GymnasticsProgram";
import GymMeetDiscoveryContent from "../../src/components/gym-meet-templates/GymMeetDiscoveryContent";
import { GYMNASTICS_PRESENTATIONS } from "../../src/components/gym-meet-templates/gymnasticsPresentations";
import type { GymMeetDiscoverySection } from "../../src/components/gym-meet-templates/types";
import type { EventPageComposition } from "../../src/lib/event-page-composition";
import type { EventSectionLayout } from "../../src/lib/event-section-layout";
import type { GymnasticsPageText, GymnasticsPageTextChange } from "../../src/lib/gymnastics-page-text";
import programStyles from "../../src/components/gym-meet-templates/gymnastics-program.module.css";
import EventPlaceCard, { placeCardGridStyle } from "../../src/components/event-create/EventPlaceCard";
import placeStyles from "../../src/components/event-create/event-place-card.module.css";
import EventGuestPlanningNotes from "../../src/components/event-templates/EventGuestPlanningNotes";
import { scheduleSection, type ScheduleInfo } from "../../src/components/event-templates/GymnasticsTemplate";
import GymnasticsSchedule from "../../src/components/gym-meet-templates/GymnasticsSchedule";
import { useEventLocationTimezone } from "../../src/components/events/useEventLocationTimezone";
import { EventEditorSection } from "../../src/components/events/EventEditorFields";
import { verifyVenuePhotoPermission } from "../../src/lib/venue-photo-permission";

function TimezoneFixture() {
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem("location-timezone-fixture") || "null") || { date: "2027-01-15", time: "08:00", address: "One Haben Blvd., Palmetto, FL 34221", timezone: "America/Chicago" });
  const timezone = useEventLocationTimezone({ data, setData });
  return <main style={{ padding: 24, maxWidth: 640 }}>
    <h1>Event location time zone</h1>
    <label>Event address<input aria-label="Event address" value={data.address} onChange={event => setData((previous: any) => ({ ...previous, address: event.target.value }))} /></label>
    <output data-zone-state>{timezone.status}</output>
    <output data-zone>{data.timezone}</output>
    <button onClick={() => localStorage.setItem("location-timezone-fixture", JSON.stringify(data))}>Save time zone</button>
  </main>;
}

const sourceSections: GymMeetDiscoverySection[] = [
  ["details", "Meet Details", "Arrive at Tampa Convention Center by 8 AM. Check in with your coach before warming up."],
  ["schedule", "Competition Schedule", "Doors open at 7:30 AM. The first session begins at 9 AM, followed by awards."],
  ["parking", "Parking and Arrival", "Use the convention center parking garage. Allow extra time to walk to the main entrance."],
].map(([id, label, text], priority): GymMeetDiscoverySection => ({
  id, label, kind: "custom", priority, hasContent: true,
  blocks: [{ id: `${id}-body`, type: "text", text }],
}));

function App() {
  const search = new URLSearchParams(location.search);
  if (search.has("auto-import")) return <article className={programStyles.design} data-gym-design="moonbeam-balance" data-layout="orbit" style={{ maxWidth: 1200, margin: "auto", padding: 16,
    "--gym-paper": search.has("dark") ? "#111b3a" : "#f6fbfd", "--gym-ink": search.has("dark") ? "#eef5ff" : "#142733", "--gym-accent": "#149bc0", "--gym-font": "Arial, sans-serif",
  } as CSSProperties}>
    <GymMeetDiscoveryContent presentation={GYMNASTICS_PRESENTATIONS["moonbeam-balance"]}
      variant={{ sectionClass: "", summaryCardClass: "", secondaryButtonClass: "" }}
      model={{ importedPageLayout: { version: 1, navigation: "related" }, venue: "Georgia International Convention Center", address: "2000 Convention Center Concourse",
        importedTheme: { context: { venue: "Georgia International Convention Center", address: "2000 Convention Center Concourse" } },
        importedThemeArtwork: { themeId: "venue-fixture", status: "ready", venueReference: { venue: "Georgia International Convention Center", sourceUrl: "https://venue.example.test/media", imageUrl: "https://venue.example.test/exterior.jpg",
          permission: search.has("no-photo-permission") ? undefined : verifyVenuePhotoPermission("<p>Image use terms: Photos may be used in promotional event materials.</p>", "https://venue.example.test/media", "https://venue.example.test/exterior.jpg") } }, discovery: { sections: [
        { id: "meet-details", label: "Meet details", kind: "meet_overview", priority: 1, hasContent: true, blocks: [{ id: "overview", type: "text", text: "Verified meet details" }] },
        { id: "schedule", label: "Schedule", kind: "schedule", priority: 2, hasContent: true, blocks: [{ id: "schedule-status", type: "text", text: "Sessions to be announced" }] },
        { id: "admission", label: "Admission", kind: "admission", priority: 3, hasContent: true, blocks: [{ id: "admission-cards", type: "card-grid", cards: Array.from({ length: 6 }, (_, index) => ({ key: String(index), label: `Admission group ${index + 1}`, value: "$20", body: "Cash only" })) }] },
        { id: "venue-details", label: "Venue Details", kind: "venue", priority: 4, hasContent: true, blocks: [
          { id: "venue-guidance-cards", type: "card-grid", cards: [{ key: "venue-guidance", presentation: "guidance", icon: "info", label: "Venue guidance", meta: "Getting oriented", body: "Georgia International Convention Center, 2000 Convention Center Concourse. Use the main convention center entrance." }] },
          { id: "venue-map", type: "map", title: "Arrival Map", address: "Georgia International Convention Center, 2000 Convention Center Concourse" },
        ] },
        { id: "traffic-parking", label: "Parking", kind: "traffic_parking", priority: 5, hasContent: true, blocks: [
          { id: "authored-parking", type: "text", title: "Parking & arrival", text: search.has("long-parking") ? "Use the convention center parking garage. Keep the entrance accessible for drop-off and allow extra time for parking. ".repeat(8) : "On-site parking costs $15.00." },
          { id: "authored-traffic", type: "text", title: "Traffic & travel", text: "Allow extra arrival time near the venue and use posted traffic directions on arrival." },
        ] },
        { id: "participating-clubs", label: "Participating clubs", kind: "participating_clubs", priority: 6, hasContent: true, blocks: [{ id: "clubs", type: "club-list", year: 2027, clubs: Array.from({ length: 45 }, (_, index) => ({ name: `Gymnastics club ${index + 1}`, location: "Atlanta, GA", sourceUrl: "https://meet.test/teams" })) }] },
        { id: "hotels", label: "Hotels", kind: "hotels", priority: 7, hasContent: true, blocks: [{ id: "hotel-cards", type: "card-grid", cards: Array.from({ length: 4 }, (_, index) => ({ key: String(index), presentation: "hotel", label: `Host hotel ${index + 1}`, body: "Group rooms available", highlights: [{ label: "Nightly rate", value: "$190 + tax" }] })) }] },
        { id: "attractions", label: "Things to do", kind: "attractions", priority: 8, hasContent: true, blocks: [{ id: "attraction-cards", type: "card-grid", cards: Array.from({ length: 4 }, (_, index) => ({ key: String(index), label: `Attraction ${index + 1}`, body: "Local activities" })) }] },
      ] } }} />
  </article>;
  const selected = search.get("layout") || "template";
  const editing = search.has("editing");
  const [previewing, setPreviewing] = useState(false);
  const storageKey = "gymnastics-tab-sync";
  const restored = search.has("saved-tabs") ? JSON.parse(localStorage.getItem(storageKey) || "null") : null;
  // Geometry checks exercise multiple rows within one tab; the tabs case uses real section identities.
  const sections = sourceSections.map(section => search.has("tabs") ? section : {
    ...section, id: section.id === "schedule" ? "timing" : section.id === "parking" ? "arrival" : section.id,
  });
  if (search.has("documents") || search.has("schedule-editor")) sections.splice(0, sections.length, {
    ...sourceSections[0], id: "meet-details",
  });
  if (search.has("planning")) {
    if (search.has("planning-only")) sections.splice(0, sections.length);
    else sections[0] = { ...sections[0], id: "meet-details" };
  }
  const hotelNames = search.get("hotels") === "short"
    ? ["River Hotel", "Park Inn", "Garden Suites", "Bay Hotel", "The Lodge"]
    : ["Embassy Suites Lake Buena Vista", "Embassy Suites Orlando I–Drive Convention Center", "Fairfield by Marriott Inn & Suites Orlando I–Drive/Convention Center", "Hilton Grand Vacations Club Tuscany Village", "Hyatt House Orlando/International Drive"];
  if (search.has("hotels")) sections.push({
    id: "hotels", label: "Hotels & Travel", kind: "hotels", priority: 40, hasContent: true,
    blocks: [{ id: "hotel-cards", type: "card-grid", cards: hotelNames.map((label, index) => ({
      key: String(index), label, presentation: "hotel", highlights: [{ label: "Nightly rate", value: search.get("hotels") === "short" ? "$190 + tax" : "1-Bedroom Suite: $224.00 + tax (per night); 2-Bedroom Suite: $299.00 + tax (per night)" }],
      details: [
        { label: "Parking", value: "$10 per night" },
        { label: "Breakfast", value: "Complimentary Hot Breakfast" },
        { label: "Book by", value: "December 24, 2026" },
        { label: "Phone", value: "(800) 233-1234" },
      ], action: { label: "Book hotel", url: "https://hotel.example.test/booking?group=meet" },
    })) }],
  });
  const initialLayout: EventSectionLayout | undefined = search.get("explicit") === "split"
    ? {
        version: 1,
        order: sections.map(({ id }) => id),
        hidden: [],
        added: [],
        widths: { details: 6, [sections[1].id]: 6 },
        pairs: [["details", sections[1].id]],
      }
    : undefined;
  const [layout, setLayout] = useState<EventSectionLayout | undefined>(restored?.layout || initialLayout);
  const [schedule, setSchedule] = useState<ScheduleInfo>(restored?.schedule || { enabled: true, venueLabel: "", supportEmail: "", notes: [], days: [] });
  const [showSections, setShowSections] = useState(false);
  const [pageText, setPageText] = useState<GymnasticsPageText>(restored?.pageText || {});
  const updatePageText: GymnasticsPageTextChange = (key, value) => setPageText(previous => ({ ...previous, [key]: value }));
  const [composition, setComposition] = useState<EventPageComposition | undefined>(restored?.composition || {
    version: 1,
    sections: [],
    ...(selected === "template" ? {} : { layout: selected as EventPageComposition["layout"] }),
  });
  const design = search.get("design") === "citrus-springboard" ? "citrus-springboard"
    : search.get("design") === "desert-dismount" ? "desert-dismount"
      : search.get("design") === "moonbeam-balance" ? "moonbeam-balance"
        : "airborne-atlas";
  const presentation = GYMNASTICS_PRESENTATIONS[design];
  if (search.has("schedule-settings")) return (
    <EventEditorSection title="Schedule" showBack={false}>
      {scheduleSection.renderEditor({ state: schedule, setState: setSchedule, inputClass: "", textareaClass: "" })}
    </EventEditorSection>
  );
  const program = search.has("shared") ? <EventSectionCanvas className={search.has("geometry") ? programStyles.chapters : undefined} layout={layout} sections={sections.map(section => ({ id: section.id, label: section.label, content: <section className={search.has("geometry") ? programStyles.chapter : undefined}><h2>{section.label}</h2><p>Section content</p></section> }))} /> : (
    <GymnasticsProgram
      sections={sections}
      presentation={presentation}
      sectionLayout={search.has("context-layout") && !previewing ? undefined : layout}
      pageTextOverrides={pageText}
      onPageTextChange={editing && !previewing ? updatePageText : undefined}
      additionalSections={[...(search.has("planning") ? [{
        id: "meet-details", label: "Meet Details", editorId: "meet",
        content: <EventGuestPlanningNotes value={{ arrival: "Arrive 30 minutes before your session.", preparation: "Bring your grips and water bottle." }} />,
      }] : []), ...(search.has("schedule-editor") && schedule.days.length && schedule.enabled !== false ? [{ id: "schedule", label: "Schedule", editorId: "schedule", content: <GymnasticsSchedule schedule={schedule} /> }] : [])]}
      renderBlock={(block) => block.type === "text" ? <p>{block.text}</p> : block.type === "card-grid" ? (
        <div data-program-cards="hotels" className={placeStyles.grid} style={placeCardGridStyle((block.cards || []).map(card => ({ name: card.label || "", values: card.highlights?.map(item => item.value) })))}>
          {block.cards?.map(card => <EventPlaceCard key={card.key} name={card.label || ""} eyebrow="Host hotel"
            highlights={card.highlights?.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
            details={card.details?.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
            action={<a href={card.action?.url}>Book hotel</a>} />)}
        </div>
      ) : null}
    />
  );
  return (
    <article
      data-layout-fixture
      data-generated-event={search.has("generated") || undefined}
      className={programStyles.design}
      data-gym-design={design}
      data-layout={presentation.layout}
      data-surface={presentation.surface}
      data-navigation={presentation.navigation}
      style={{
        width: `min(${Number(search.get("width")) || 1240}px, calc(100% - 32px))`,
        margin: "24px auto",
        container: "gym / inline-size",
        "--gym-ink": search.has("dark") ? "#fff8f4" : "#1c3041",
        "--gym-paper": search.has("dark") ? "#111a3a" : "#f6f0e5",
        "--gym-accent": "#a16e44",
        "--gym-font": "Georgia, serif",
      } as CSSProperties}
    >
      <header style={{ padding: "20px 0", borderBottom: "1px solid #1c304133" }}>
        <h1 style={{ margin: 0, font: "500 32px Georgia, serif" }}>Tampa Gymnastics Invitational</h1>
      </header>
      <div data-fixture-body style={{ paddingTop: 24 }}>
        <EventPageCompositionProvider value={composition} onChange={editing ? setComposition : undefined}>
          {search.has("saved-tabs") && <>
            <button onClick={() => localStorage.setItem(storageKey, JSON.stringify({ layout, pageText, composition, schedule }))}>Save fixture</button>
            <button onClick={() => setPreviewing(value => !value)}>{previewing ? "Close preview" : "Preview page"}</button>
          </>}
          {editing && !previewing ? (
            <EventSectionBuilderProvider
              layout={layout}
              onChange={setLayout}
              catalog={[
                ...sections.map(({ id, label }) => ({ id, label })),
                ...(search.has("schedule-editor") ? [{ id: "schedule", label: "Schedule", editorId: "schedule" }] : []),
                ...(search.has("documents") ? [{ id: "documents", label: "Documents & links", editorId: "logistics" }, { id: "traffic-parking", label: "Parking", editorId: "travel" }] : []),
              ]}
              customSectionLabel={search.has("schedule-editor") ? "Custom" : undefined}
              renderEditor={id => {
                if (!id.startsWith("schedule") || !search.has("schedule-editor")) return <p>Edit section details.</p>;
                const [, action, target = ""] = id.split(":");
                const [targetDay, targetSession] = target.split("/").map(value => decodeURIComponent(value));
                return <React.Fragment key={id}>{scheduleSection.renderEditor({
                  state: schedule, setState: setSchedule, setActiveView: () => {}, inputClass: "", textareaClass: "",
                  initialView: action === "remove" ? "remove-period" : action || "overview",
                  initialDayId: targetDay || null, initialSessionId: targetSession || null,
                  initialPeriodId: action === "remove" ? targetDay : null,
                })}</React.Fragment>;
              }}
              renderSectionLabelEditor={section => section.id.startsWith("info:") || (section.editorId || section.id).startsWith("schedule") ? null : <label>Title<input value={pageText[`section:${section.id}:label`] ?? section.label} onChange={event => updatePageText(`section:${section.id}:label`, event.target.value)} /></label>}
            >
              <button type="button" onClick={() => setShowSections(value => !value)}>Page sections</button>
              {showSections && <EventSectionPalette />}
              {program}
            </EventSectionBuilderProvider>
          ) : program}
        </EventPageCompositionProvider>
      </div>
    </article>
  );
}

createRoot(document.getElementById("root")!).render(new URLSearchParams(location.search).has("timezone") ? <TimezoneFixture /> : <App />);
