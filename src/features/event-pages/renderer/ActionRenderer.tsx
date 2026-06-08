import { CalendarDays, ExternalLink, MapPin, Reply, Share2 } from "lucide-react";
import type { EventAction } from "../schemas/eventBlueprint.schema";

const ICON_BY_ACTION = {
  save_to_calendar: CalendarDays,
  get_directions: MapPin,
  rsvp: Reply,
  share_page: Share2,
  open_registry: ExternalLink,
  view_schedule: CalendarDays,
  contact_host: Reply,
  open_form: ExternalLink,
} as const;

function actionClassName(priority: EventAction["priority"]) {
  if (priority === "primary") {
    return "border-[var(--event-page-primary)] bg-[var(--event-page-primary)] text-white shadow-[0_16px_36px_rgba(31,34,51,0.18)] hover:brightness-95";
  }
  if (priority === "tertiary") {
    return "border-transparent bg-transparent text-[var(--event-page-primary)] hover:bg-black/5";
  }
  return "border-[var(--event-page-border)] bg-[var(--event-page-surface)] text-[var(--event-page-text)] hover:border-[var(--event-page-primary)]";
}

export function ActionRenderer({ action }: { action: EventAction }) {
  const Icon = ICON_BY_ACTION[action.type] || ExternalLink;
  const href = action.href || (action.type === "rsvp" ? "#rsvp" : "");
  if (!href) return null;
  const isExternal = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      target={action.target || (isExternal ? "_blank" : "_self")}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[calc(var(--event-page-radius)*0.8)] border px-4 py-2.5 text-sm font-black transition ${actionClassName(
        action.priority,
      )}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{action.label}</span>
    </a>
  );
}

export function ActionGroup({ actions }: { actions: EventAction[] }) {
  const seen = new Set<string>();
  const visible = actions
    .filter((action) => action.href || action.type === "rsvp")
    .filter((action) => {
      const key =
        action.type === "rsvp" || action.type === "share_page"
          ? action.type
          : [action.type, action.href || "", action.label || ""].join(":");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
  if (!visible.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((action, index) => (
        <ActionRenderer key={`${action.id}-${index}`} action={action} />
      ))}
    </div>
  );
}
