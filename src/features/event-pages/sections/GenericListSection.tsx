import { ActionGroup } from "../renderer/ActionRenderer";
import type { EventSection } from "../schemas/eventBlueprint.schema";
import { readItemText, SectionFrame } from "./section-utils";

export function GenericListSection({ section, id }: { section: EventSection; id?: string }) {
  const items = section.items || [];
  return (
    <SectionFrame section={section} id={id}>
      {items.length ? (
        <div className="grid gap-[var(--event-page-card-gap)] sm:grid-cols-2">
          {items.map((item, index) => {
            const label = readItemText(item, ["label", "title", "name"]);
            const value = readItemText(item, ["value", "body", "description", "notes"]);
            if (!label && !value) return null;
            return (
              <article key={`${label}-${index}`} className="rounded-[calc(var(--event-page-radius)*0.75)] bg-[var(--event-page-bg-soft)] p-4">
                {label ? <h3 className="text-base font-black">{label}</h3> : null}
                {value ? <p className="mt-1 text-sm leading-6 text-[var(--event-page-muted)]">{value}</p> : null}
              </article>
            );
          })}
        </div>
      ) : null}
      <div className={items.length && section.actions?.length ? "mt-5" : ""}>
        <ActionGroup actions={section.actions || []} />
      </div>
    </SectionFrame>
  );
}
