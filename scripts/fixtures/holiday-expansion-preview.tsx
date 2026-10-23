import { useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import HolidayPageBackground from "@/components/events/HolidayPageBackground";
import TemplateBodyLayout from "@/components/templates/TemplateBodyLayout";
import ThemedEventHeader from "@/components/templates/ThemedEventHeader";
import { HOLIDAY_COLLECTIONS } from "@/lib/holiday-collections";
import { getGeneralEventBodyPresentation, getGeneralEventPageDesign } from "@/lib/general-event-presentation";
import { getHolidayBackground } from "@/lib/holiday-backgrounds";

type PreviewConfig = { occasion: string; artwork: string[] };
declare global {
  interface Window {
    holidayExpansionPreviewConfig: PreviewConfig;
    showHolidayExpansionDirection: (index: number) => void;
  }
}

// Only the isolated browser fixture enables planned recipes. Its trusted config
// contains installed artwork paths, so reviewing a structure never requests a
// pending image or changes production availability.
function Fixture() {
  const [index, setIndex] = useState(10);
  const config = window.holidayExpansionPreviewConfig;
  const collection = HOLIDAY_COLLECTIONS.find(item => item.id === config.occasion)!;
  const scene = collection.designs[index];
  const id = `holidays--${collection.id}--${scene.slug}`;
  const original = getGeneralEventPageDesign(id)!;
  const background = getHolidayBackground(id)!;
  const artwork = config.artwork[(index - 10) % config.artwork.length];
  const design = { ...original, artwork, background: background.page, ink: background.ink, accent: background.accent };
  window.showHolidayExpansionDirection = next => {
    if (!Number.isInteger(next) || next < 10 || next >= collection.designs.length) throw new Error("Invalid expanded preview slot");
    setIndex(next);
  };
  return <>
    <p className="previewNote">Structure preview {index + 1} of {collection.designs.length}. Installed review photography is paired with this planned layout for inspection.</p>
    <HolidayPageBackground background={background} className="fixturePage" style={{ fontFamily: design.font }}>
      <ThemedEventHeader design={design}>
        <div className="fixtureArtwork"><img src={artwork} alt="Installed holiday review artwork" /></div>
        <div><p className="eyebrow">{collection.name}</p><h1>{scene.name}</h1><p>A place to gather with your community.</p></div>
      </ThemedEventHeader>
      <TemplateBodyLayout presentation={getGeneralEventBodyPresentation(id)} style={{ "--body-tint": background.surface } as CSSProperties}
        sections={[
          { id: "details", content: <section><h2>Event details</h2><p>Your time, place and plans appear here.</p></section> },
          { id: "schedule", content: <section><h2>Schedule</h2><p>Keep the day’s useful information together.</p></section> },
          { id: "hosts", content: <section><h2>Your hosts</h2><p>Introduce the people bringing this occasion together.</p></section> },
          { id: "rsvp", content: <section><h2>Join us</h2><button type="button">Send a response</button></section> },
        ]} />
      <footer>Envitefy</footer>
    </HolidayPageBackground>
  </>;
}

createRoot(document.getElementById("root")!).render(<Fixture />);
