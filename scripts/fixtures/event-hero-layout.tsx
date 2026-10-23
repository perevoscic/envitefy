import { useState } from "react";
import { createRoot } from "react-dom/client";
import EventPageHero from "../../src/components/events/EventPageHero";
import EventPageLayoutPicker from "../../src/components/events/EventPageLayoutPicker";
import EventPageSections from "../../src/components/events/EventPageSections";
import { EventEditorSection } from "../../src/components/events/EventEditorFields";
import { EventPageCompositionProvider } from "../../src/components/events/EventPageCompositionContext";
import type { EventPageComposition } from "../../src/lib/event-page-composition";

const image = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="#677966"/><circle cx="400" cy="250" r="160" fill="#e6c886"/></svg>');

function App() {
  const params = new URLSearchParams(location.search);
  const [composition, setComposition] = useState<EventPageComposition | undefined>(() => {
    const saved = localStorage.getItem("hero-layout");
    return saved ? JSON.parse(saved) : undefined;
  });
  const copy = <div><h1>Community picnic</h1><p>Meadow Park · November 3, 2026</p></div>;
  const artwork = <div><img src={image} alt="Picnic artwork" /></div>;
  return <main style={{ width: `min(${Number(params.get("width")) || 1180}px, calc(100% - 32px))`, margin: "16px auto" }}>
    <article aria-label="Event page">
      <EventPageCompositionProvider value={composition} onChange={setComposition}>
        <EventPageHero artwork={artwork} copy={copy}>
          <header data-original-hero>{artwork}{copy}</header>
        </EventPageHero>
        <div data-fixture-body>
          <EventPageSections>
            <section id="arrival"><h2>Arrival</h2><p>Use the east entrance.</p></section>
            <section id="schedule"><h2>Schedule</h2><p>Meet beside the pavilion at noon.</p></section>
            <section id="bring"><h2>What to bring</h2><p>Bring water and a picnic blanket.</p></section>
          </EventPageSections>
        </div>
      </EventPageCompositionProvider>
    </article>
    <aside aria-label="Layout controls" style={{ maxWidth: 350, margin: "32px auto" }}>
      <EventEditorSection title="Layout" onBack={() => {}} action={composition?.hero && <button type="button" data-section-reset onClick={() => setComposition({ ...composition, hero: undefined })}>Reset</button>}>
        <EventPageLayoutPicker value={composition} onChange={setComposition} artwork={image} title={params.has("placeholder") ? undefined : "Community picnic"} />
      </EventEditorSection>
      <button onClick={() => { localStorage.setItem("hero-layout", JSON.stringify(composition)); }}>Save draft</button>
    </aside>
  </main>;
}

createRoot(document.getElementById("root")!).render(<App />);
