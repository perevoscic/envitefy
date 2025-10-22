import Image from "next/image";
import Link from "next/link";

const points = [
  "Make plans simple again. With Snap My Date, you can create and share an event in under a minute.",
  "Instant event page: Add your title, time, and location — no login required for guests.",
  "Smart directions: Your guests get dynamic maps that update automatically.",
  'RSVP by email or text: Guests reply "Yes" or "No" directly — no forms, no confusion.',
  "Always up to date: If you change the time, place, or details, your shared link updates instantly.",
  "One link, zero stress: Perfect for birthdays, meetups, practices, and parties.",
];

const calendarTargets = [
  { label: "Apple", className: "text-xs font-semibold" },
  { label: "G", className: "text-sm font-semibold" },
  { label: "O", className: "text-sm font-semibold" },
];

const rsvpStatuses = [
  { label: "Yes", icon: "\u{2705}" },
  { label: "No", icon: "\u{274C}" },
  { label: "Maybe", icon: "\u{1F914}" },
];

const registries = [
  {
    label: "Amazon",
    badge: "A",
    badgeClass: "bg-foreground/10 text-sm font-bold",
  },
  {
    label: "Target",
    badge: "T",
    badgeClass: "bg-primary/10 text-sm font-bold text-primary",
  },
  {
    label: "Walmart",
    badge: "W",
    badgeClass: "bg-blue-100 text-sm font-bold text-blue-700",
  },
];

const footerActions = [
  { label: "Share", icon: "\u{1F517}" },
  { label: "Email", icon: "\u2709" },
  { label: "RSVP", icon: "\u{1F4E9}" },
];

const footerSecondaryAction = { label: "Directions", icon: "\u{1F9ED}" };

export default function CreateShare() {
  return (
    <section
      aria-labelledby="create-share"
      className="w-full bg-surface/50 border-y border-border/60"
    >
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2
            id="create-share"
            className="text-2xl sm:text-3xl font-bold tracking-tight"
          >
            Create &amp; Share Events in Seconds — One Link Does It All
          </h2>
          <ul className="mt-6 space-y-4 text-foreground/75 text-base sm:text-lg">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary/80" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/snap"
            className="mt-8 inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold bg-primary text-on-primary hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition"
          >
            Create your first event →
          </Link>
        </div>
        <div className="mx-auto w-full max-w-2xl">
          <p className="text-center text-sm font-medium text-primary">
            Event preview
          </p>
          <div className="mt-4 rounded-3xl border border-border/70 bg-surface/95 shadow-md text-left">
            <div className="bg-gradient-to-r from-rose-100 via-amber-100 to-orange-50 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                    Birthdays
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">
                    Dominic&apos;s 7th Birthday Party
                  </h3>
                  <p className="mt-1 text-sm text-foreground/70">
                    Hosted by Ruslan Josan
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-2xl shadow-sm">
                  {"\u{1F382}"}
                </div>
              </div>
            </div>
            <div className="px-6 py-6 space-y-6">
              <dl className="grid gap-5 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    When
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-foreground">
                    Apr 10, 2026 {"\u00B7"} 10:15 PM {"\u2013"} 11:15 PM
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    Venue
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-foreground">
                    US Gold Gymnastics
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    Address
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-foreground">
                    12432 Emerald Coast Pkwy, Miramar Beach, FL 32550
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    Add to calendar
                  </dt>
                  <dd className="mt-1">
                    <div className="flex items-center gap-3">
                      {calendarTargets.map((target) => (
                        <span
                          key={target.label}
                          className={`flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 text-foreground ${target.className}`}
                        >
                          {target.label}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    RSVP
                  </dt>
                  <dd className="mt-2 flex items-center gap-2">
                    {rsvpStatuses.map((status) => (
                      <span
                        key={status.label}
                        className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900"
                      >
                        <span className="text-base" aria-hidden="true">
                          {status.icon}
                        </span>
                        {status.label}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Dominic&apos;s Birthday Party at US Gold Gymnastics.
                </h4>
                <p className="mt-1 text-sm text-foreground/70">
                  Guests can see updates instantly and RSVP in one tap.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                  Registries
                </h4>
                <div className="mt-3 flex items-center gap-3">
                  {registries.map((registry) => (
                    <span
                      key={registry.label}
                      className="flex items-center gap-2 rounded-xl border border-border bg-background/90 px-3 py-1.5 text-sm font-semibold text-foreground"
                    >
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${registry.badgeClass}`}
                      >
                        {registry.badge}
                      </span>
                      {registry.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
                  <Image
                    src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 80' shape-rendering='crispEdges'><rect width='120' height='80' fill='%23f8fafc'/><rect x='8' y='10' width='104' height='24' rx='4' fill='%23f472b6'/><rect x='14' y='18' width='52' height='8' rx='2' fill='%23ffffff'/><rect x='14' y='46' width='72' height='10' rx='2' fill='%23a855f7'/><rect x='14' y='60' width='92' height='6' rx='2' fill='%236564f1'/></svg>"
                    alt="Birthday invite thumbnail"
                    width={120}
                    height={80}
                    className="h-28 w-44 rounded-xl border border-border/60 object-cover"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border/60 px-6 py-4 text-sm font-medium text-foreground/80">
              <div className="flex items-center gap-6">
                {footerActions.map((action) => (
                  <span key={action.label} className="flex items-center gap-2">
                    <span aria-hidden="true">{action.icon}</span>
                    {action.label}
                  </span>
                ))}
              </div>
              <span className="flex items-center gap-2">
                <span aria-hidden="true">{footerSecondaryAction.icon}</span>
                {footerSecondaryAction.label}
              </span>
            </div>
          </div>
          <p className="mt-6 text-xs text-center text-foreground/50">
            Share one link. Guests stay up to date automatically.
          </p>
        </div>
      </div>
    </section>
  );
}
