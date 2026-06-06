import type { EventSection } from "../schemas/eventBlueprint.schema";
import type { ReactNode } from "react";

export function readItemText(
  item: Record<string, string | boolean | number | null>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "Yes" : "No";
  }
  return "";
}

export function formatScheduleTime(value: string | null | undefined, timezone?: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  try {
    return new Intl.DateTimeFormat("en-US", timezone ? { ...options, timeZone: timezone } : options).format(parsed);
  } catch {
    return new Intl.DateTimeFormat("en-US", options).format(parsed);
  }
}

export function SectionFrame({
  section,
  children,
  id,
}: {
  section: EventSection;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id || section.type} className="scroll-mt-24">
      <div className="rounded-[var(--event-page-radius)] border border-[var(--event-page-border)] bg-[var(--event-page-surface)] p-5 shadow-[0_18px_60px_rgba(31,34,51,0.08)] sm:p-6">
        {section.eyebrow ? (
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--event-page-primary)]">
            {section.eyebrow}
          </p>
        ) : null}
        {section.title ? (
          <h2 className="mt-1 font-[var(--event-page-heading-font)] text-2xl font-black text-[var(--event-page-text)]">
            {section.title}
          </h2>
        ) : null}
        {section.body ? (
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--event-page-muted)]">
            {section.body}
          </p>
        ) : null}
        <div className={section.title || section.body ? "mt-5" : ""}>{children}</div>
      </div>
    </section>
  );
}
