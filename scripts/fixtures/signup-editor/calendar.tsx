export default function CalendarAction({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <button type="button" className={className} aria-label="Add to calendar">{children || "Add to calendar"}</button>;
}
