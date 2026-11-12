import { useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import {
  EventSectionBuilderProvider,
} from "../../src/components/events/EventSectionBuilder";
import { EventPageCompositionProvider } from "../../src/components/events/EventPageCompositionContext";
import GymnasticsProgram from "../../src/components/gym-meet-templates/GymnasticsProgram";
import { GYMNASTICS_PRESENTATIONS } from "../../src/components/gym-meet-templates/gymnasticsPresentations";
import type { GymMeetDiscoverySection } from "../../src/components/gym-meet-templates/types";
import type { EventPageComposition } from "../../src/lib/event-page-composition";
import type { EventSectionLayout } from "../../src/lib/event-section-layout";
import programStyles from "../../src/components/gym-meet-templates/gymnastics-program.module.css";
import EventPlaceCard, { placeCardGridStyle } from "../../src/components/event-create/EventPlaceCard";
import placeStyles from "../../src/components/event-create/event-place-card.module.css";

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
  const selected = search.get("layout") || "template";
  const editing = search.has("editing");
  // Geometry checks exercise multiple rows within one tab; the tabs case uses real section identities.
  const sections = sourceSections.map(section => search.has("tabs") ? section : {
    ...section, id: section.id === "schedule" ? "timing" : section.id === "parking" ? "arrival" : section.id,
  });
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
  const [layout, setLayout] = useState<EventSectionLayout | undefined>(initialLayout);
  const [composition, setComposition] = useState<EventPageComposition | undefined>({
    version: 1,
    sections: [],
    ...(selected === "template" ? {} : { layout: selected as EventPageComposition["layout"] }),
  });
  const design = search.get("design") === "citrus-springboard" ? "citrus-springboard"
    : search.get("design") === "desert-dismount" ? "desert-dismount"
      : search.get("design") === "moonbeam-balance" ? "moonbeam-balance"
        : "airborne-atlas";
  const presentation = GYMNASTICS_PRESENTATIONS[design];
  const program = (
    <GymnasticsProgram
      sections={sections}
      presentation={presentation}
      sectionLayout={layout}
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
          {editing ? (
            <EventSectionBuilderProvider
              layout={layout}
              onChange={setLayout}
              catalog={sections.map(({ id, label }) => ({ id, label }))}
              renderEditor={() => <p>Edit section details.</p>}
            >
              {program}
            </EventSectionBuilderProvider>
          ) : program}
        </EventPageCompositionProvider>
      </div>
    </article>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
