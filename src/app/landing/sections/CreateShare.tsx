import Image from "next/image";
import CreateShareCta from "./CreateShareCta";

const points = [
  "Create and share events in seconds from any flyer or a blank template.",
  "Guests add the event to Google, Apple, or Outlook in one tap.",
  "Smart sign-up forms keep snack duty, volunteers, and carpools organized.",
  "Send one link by text or email—no accounts required for grandparents or teammates.",
  "Smart updates keep everyone in sync the moment you change time, place, or details.",
  "Collect RSVPs by email or text and get notified instantly.",
  "Attach packing lists, allergy info, or carpool instructions so parents know what to bring.",
  "Drop in multiple registries or wish lists straight from Amazon, Target, Walmart, and more.",
  "Built-in maps serve up live directions for families on the go.",
  "Need a download? Save a polished ICS invite for teachers, coaches, or printouts.",
];

const calendarTargets = [
  {
    alt: "Apple",
    light: "/brands/apple-black.svg",
    dark: "/brands/apple-white.svg",
  },
  {
    alt: "Google",
    light: "/brands/google.svg",
    dark: "/brands/google.svg",
  },
  {
    alt: "Microsoft",
    light: "/brands/microsoft.svg",
    dark: "/brands/microsoft.svg",
  },
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
    <section aria-labelledby="create-share" className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2
            id="create-share"
            className="text-2xl sm:text-3xl font-bold tracking-tight"
          >
            Create &amp; Share Events in Seconds.
            <br />
            Envitefy keeps everyone in sync.
          </h2>
          <ul className="mt-6 space-y-4 pb-10 text-foreground/75 text-base sm:text-lg">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary/80" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <CreateShareCta />
        </div>
        <div className="mx-auto w-full max-w-2xl">
          <p className="text-center text-sm font-medium text-primary">
            Event preview
          </p>
          <div className="mt-4 rounded-3xl border border-border/70 bg-surface/95 shadow-md text-left">
            <div className="bg-gradient-to-r from-rose-100 via-amber-100 to-orange-50 dark:bg-gradient-to-r dark:from-rose-900/40 dark:via-amber-900/30 dark:to-orange-900/40 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                    Birthdays
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">
                    Dominic&apos;s 7th Birthday Party
                  </h3>
                  <p className="mt-1 text-sm text-foreground/70">
                    Hosted by Russell Jason
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                      145 Main St, Atlanta, GA 30301
                    </dd>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                      Add to calendar
                    </dt>
                    <dd className="mt-1">
                      <div className="flex items-center gap-3">
                        {calendarTargets.map((target) => (
                          <span
                            key={target.alt}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/90"
                          >
                            <Image
                              src={target.light}
                              alt={target.alt}
                              width={22}
                              height={22}
                              className="h-5 w-5 dark:hidden"
                            />
                            <Image
                              src={target.dark}
                              alt={target.alt}
                              width={22}
                              height={22}
                              className="hidden h-5 w-5 dark:block"
                            />
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
              <div className="flex flex-col items-center">
                <div className="rounded-2xl border border-border/70 bg-background/80 p-3 shadow-sm">
                  <Image
                    src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 240' shape-rendering='crispEdges'><rect width='180' height='240' rx='10' fill='%23ffffff'/><rect x='0' y='0' width='180' height='48' rx='10' fill='%23f472b6'/><rect x='16' y='16' width='100' height='16' rx='3' fill='%23ffffff'/><rect x='16' y='72' width='148' height='14' rx='3' fill='%2311182722'/><rect x='16' y='92' width='120' height='10' rx='3' fill='%23a855f7'/><rect x='16' y='110' width='140' height='8' rx='3' fill='%236564f1'/><rect x='16' y='134' width='148' height='6' rx='3' fill='%23e5e7eb'/><rect x='16' y='148' width='112' height='6' rx='3' fill='%23e5e7eb'/><rect x='16' y='162' width='148' height='6' rx='3' fill='%23e5e7eb'/><rect x='16' y='176' width='96' height='6' rx='3' fill='%23e5e7eb'/></svg>"
                    alt="Flyer preview"
                    width={180}
                    height={240}
                    className="h-64 w-48 rounded-xl border border-border/60 object-cover"
                    draggable={false}
                  />
                </div>
                <p className="mt-2 text-xs text-foreground/60 italic">
                  Your flyer could be here
                </p>
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
        </div>
      </div>
    </section>
  );
}
