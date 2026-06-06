import type { EventSection } from "../schemas/eventBlueprint.schema";
import { readItemText, SectionFrame } from "./section-utils";

export function QuickDetailsSection({ section }: { section: EventSection }) {
  const items = section.items || [];
  return (
    <SectionFrame section={section} id="details">
      <dl className="grid gap-[var(--event-page-card-gap)] sm:grid-cols-2">
        {items.map((item, index) => {
          const label = readItemText(item, ["label", "title", "name"]);
          const value = readItemText(item, ["value", "body", "description"]);
          if (!label && !value) return null;
          return (
            <div key={`${label}-${index}`} className="rounded-[calc(var(--event-page-radius)*0.7)] bg-[var(--event-page-bg-soft)] p-4">
              {label ? <dt className="text-xs font-black uppercase tracking-[0.16em] text-[var(--event-page-primary)]">{label}</dt> : null}
              {value ? <dd className="mt-1 text-base font-bold">{value}</dd> : null}
            </div>
          );
        })}
      </dl>
    </SectionFrame>
  );
}
