import type { EventPageBlueprint } from "../schemas/eventBlueprint.schema";
import { buildThemeFromBlueprint } from "../themes/buildThemeFromBlueprint";
import { EventThemeProvider } from "./EventThemeProvider";
import { SectionRenderer } from "./SectionRenderer";

export function EventPageRenderer({
  blueprint,
  eventId,
  title,
  shareUrl,
}: {
  blueprint: EventPageBlueprint;
  eventId: string;
  title?: string | null;
  shareUrl?: string | null;
}) {
  const theme = buildThemeFromBlueprint(blueprint);
  const nonHeroSections = blueprint.sections.filter((section) => section.type !== "hero");
  const hero = blueprint.sections.find((section) => section.type === "hero") || blueprint.sections[0];
  const context = {
    eventId,
    title: title || hero?.title || "Event",
    shareUrl,
    actions: blueprint.actions,
  };

  return (
    <EventThemeProvider theme={theme}>
      {hero ? <SectionRenderer section={hero} context={context} /> : null}
      <main className="mx-auto grid max-w-6xl gap-[var(--event-page-section-gap)] px-4 py-[var(--event-page-section-gap)] sm:px-6">
        {nonHeroSections.map((section) => (
          <SectionRenderer key={section.id} section={section} context={context} />
        ))}
      </main>
    </EventThemeProvider>
  );
}
