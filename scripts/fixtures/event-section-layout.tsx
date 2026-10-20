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

const sections: GymMeetDiscoverySection[] = [
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
  const [layout, setLayout] = useState<EventSectionLayout>();
  const [composition, setComposition] = useState<EventPageComposition | undefined>({
    version: 1,
    sections: [],
    ...(selected === "template" ? {} : { layout: selected as EventPageComposition["layout"] }),
  });
  const design = search.get("design") === "citrus-springboard" ? "citrus-springboard"
    : search.get("design") === "desert-dismount" ? "desert-dismount" : "airborne-atlas";
  const presentation = GYMNASTICS_PRESENTATIONS[design];
  const program = (
    <GymnasticsProgram
      sections={sections}
      presentation={presentation}
      sectionLayout={layout}
      renderBlock={(block) => block.type === "text" ? <p>{block.text}</p> : null}
    />
  );
  return (
    <article
      data-layout-fixture
      className={programStyles.design}
      data-gym-design={design}
      data-layout={presentation.layout}
      data-surface={presentation.surface}
      data-navigation={presentation.navigation}
      style={{
        width: `min(${Number(search.get("width")) || 1240}px, calc(100% - 32px))`,
        margin: "24px auto",
        container: "gym / inline-size",
        "--gym-ink": "#1c3041",
        "--gym-paper": "#f6f0e5",
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
