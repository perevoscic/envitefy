import { getEventGuestPlanningNotes, type EventGuestPlanning } from "@/lib/event-guest-planning";
import styles from "./guest-actions.module.css";

export default function EventGuestPlanningNotes({
  value,
  inverse = false,
  themed = false,
}: {
  value?: EventGuestPlanning;
  inverse?: boolean;
  themed?: boolean;
}) {
  const notes = getEventGuestPlanningNotes(value);
  if (!notes.length) return null;
  return (
    <section
      aria-label="Before you arrive"
      className={`mx-auto w-full max-w-5xl px-5 py-7 text-left normal-case tracking-normal ${themed ? "" : inverse ? "text-white" : "text-slate-800"}`}
    >
      <h2 className="mb-4 text-xl font-semibold">Before you arrive</h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        {notes.map(({ key, label, value: note }) => (
          <div
            key={key}
            className={`p-5 ${themed ? styles.note : `rounded-2xl border ${inverse ? "border-white/20 bg-black/40" : "border-slate-200 bg-white/95"}`}`}
          >
            <dt className="text-sm font-bold">{label}</dt>
            <dd className="mt-2 whitespace-pre-line break-words text-sm leading-6">{note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
