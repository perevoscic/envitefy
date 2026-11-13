import { type EventGuestPlanning, getEventGuestPlanningNotes } from "@/lib/event-guest-planning";
import styles from "./guest-actions.module.css";

export default function EventGuestPlanningNotes({
  value,
  id,
  inverse = false,
  themed = false,
  fullWidth = false,
}: {
  value?: EventGuestPlanning;
  id?: string;
  inverse?: boolean;
  themed?: boolean;
  fullWidth?: boolean;
}) {
  const notes = getEventGuestPlanningNotes(value);
  if (!notes.length) return null;
  return (
    <section
      id={id}
      aria-label="Before you arrive"
      data-section-focus-label={notes[0]?.label}
      className={`w-full py-7 text-left normal-case tracking-normal ${fullWidth ? "" : "mx-auto max-w-5xl px-5"} ${themed ? "" : inverse ? "text-white" : "text-inherit"}`}
    >
      <h2 className="mb-4 text-xl font-semibold">Before you arrive</h2>
      <dl className="grid grid-cols-1 items-start gap-3">
        {notes.map(({ key, label, value: note }) => (
          <div
            data-celebration-card
            data-section-focus-label={label}
            key={key}
            className={`min-w-0 p-5 ${themed ? styles.note : `rounded-2xl border ${inverse ? "border-white/20 bg-black/40" : "border-slate-200 bg-white/95 text-slate-800"}`}`}
          >
            <dt className="text-sm font-bold">{label}</dt>
            <dd className="mt-2 whitespace-pre-line break-words text-sm leading-6">{note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
