import { ActionGroup } from "../renderer/ActionRenderer";
import type { EventAction, EventSection } from "../schemas/eventBlueprint.schema";
import { readItemText } from "./section-utils";

export function HeroSection({
  section,
  actions,
}: {
  section: EventSection;
  actions: EventAction[];
}) {
  const details = (section.items || []).slice(0, 4);
  const image = section.media?.[0];
  return (
    <section id="top" className="relative overflow-hidden bg-[var(--event-page-bg-soft)]">
      <div className="mx-auto grid min-h-[72vh] max-w-6xl gap-8 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="relative z-10">
          {section.eyebrow ? (
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--event-page-primary)]">
              {section.eyebrow}
            </p>
          ) : null}
          <h1 className="mt-4 max-w-3xl font-[var(--event-page-heading-font)] text-5xl font-black leading-[0.95] tracking-normal text-[var(--event-page-text)] sm:text-6xl">
            {section.title || "Event"}
          </h1>
          {section.body ? (
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--event-page-muted)]">
              {section.body}
            </p>
          ) : null}
          <div className="mt-7">
            <ActionGroup actions={[...(section.actions || []), ...actions]} />
          </div>
          {details.length ? (
            <dl className="mt-8 grid gap-3 sm:grid-cols-2">
              {details.map((item, index) => {
                const label = readItemText(item, ["label", "title", "name"]);
                const value = readItemText(item, ["value", "body", "description"]);
                if (!label && !value) return null;
                return (
                  <div
                    key={`${label}-${index}`}
                    className="rounded-[calc(var(--event-page-radius)*0.75)] border border-[var(--event-page-border)] bg-white/70 p-4"
                  >
                    {label ? <dt className="text-xs font-black uppercase tracking-[0.16em] text-[var(--event-page-primary)]">{label}</dt> : null}
                    {value ? <dd className="mt-1 text-base font-bold text-[var(--event-page-text)]">{value}</dd> : null}
                  </div>
                );
              })}
            </dl>
          ) : null}
        </div>
        <div className="relative min-h-64 overflow-hidden rounded-[var(--event-page-radius)] border border-white/70 bg-[var(--event-page-surface)] shadow-[0_28px_80px_rgba(31,34,51,0.18)]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt={image.alt || ""} className="h-full min-h-72 w-full object-cover" />
          ) : (
            <div className="flex min-h-72 items-center justify-center bg-[linear-gradient(135deg,var(--event-page-primary),var(--event-page-secondary))] p-8 text-center text-white">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] opacity-80">Envitefy</p>
                <p className="mt-4 font-[var(--event-page-heading-font)] text-4xl font-black leading-tight">
                  {section.title || "Event page"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
