import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Baby,
  Bell,
  CalendarCheck2,
  CakeSlice,
  ClipboardList,
  FileUp,
  Gift,
  Heart,
  HelpCircle,
  MapPin,
  MessageCircle,
  School,
  Send,
  ShieldCheck,
  TicketCheck,
  Upload,
} from "lucide-react";
import conciergeLogo from "@/assets/envitefy-concierge-logo.png";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";
import LandingLiveCardShowcase from "@/components/landing/LandingLiveCardShowcase";
import { AdminRouteError, requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Landing Preview | Envitefy Admin",
  description: "Admin-only mockup for the next Envitefy general landing page.",
  robots: { index: false, follow: false },
};

const intentTiles = [
  {
    title: "Birthday party",
    description: "Invite, RSVP, directions, gifts",
    icon: CakeSlice,
    href: "/chat",
    tone: "sage",
  },
  {
    title: "Wedding",
    description: "Schedule, registry, hotels, RSVP",
    icon: Heart,
    href: "/chat",
    tone: "lavender",
  },
  {
    title: "Baby shower",
    description: "Registry, food slots, guest notes",
    icon: Baby,
    href: "/chat",
    tone: "lavender",
  },
  {
    title: "Team or school",
    description: "Schedules, sign-ups, parent details",
    icon: School,
    href: "/chat",
    tone: "sage",
  },
  {
    title: "Upload flyer/PDF",
    description: "Convert what you already have",
    icon: FileUp,
    href: "/?action=upload",
    tone: "sage",
  },
  {
    title: "Something else",
    description: "Start open-ended with Concierge",
    icon: HelpCircle,
    href: "/chat",
    tone: "lavender",
  },
] as const;

const guestActions = [
  { label: "RSVP", icon: TicketCheck },
  { label: "Save date", icon: CalendarCheck2 },
  { label: "Open map", icon: MapPin },
  { label: "Registry", icon: Gift },
  { label: "Sign-up slots", icon: ClipboardList },
  { label: "Updates", icon: Bell },
  { label: "Share", icon: Send },
  { label: "Message host", icon: MessageCircle },
] as const;

const examples = [
  {
    title: "Birthday parties",
    image: "/images/marketing/use-case-birthday.webp",
    note: "Invite, RSVP, directions, gifts",
  },
  {
    title: "Wedding weekends",
    image: "/images/marketing/use-case-wedding.webp",
    note: "Schedule, registry, hotel notes",
  },
  {
    title: "Baby showers",
    image: "/images/marketing/use-case-baby.webp",
    note: "Guest list, gift links, reminders",
  },
  {
    title: "School events",
    image: "/images/marketing/use-case-school.webp",
    note: "Parent info, sign-ups, field trips",
  },
  {
    title: "Team weekends",
    image: "/images/marketing/use-case-gymnastics.webp",
    note: "Schedules, venues, live updates",
  },
  {
    title: "Open houses",
    image: "/images/marketing/use-case-team.webp",
    note: "Client events and professional gatherings",
  },
] as const;

const workflow = [
  {
    title: "Start with anything",
    description: "Describe the event, paste details, or upload a flyer, invite, PDF, or schedule.",
  },
  {
    title: "Confirm the useful parts",
    description:
      "Review the date, location, RSVP needs, registry links, sign-up slots, and visuals.",
  },
  {
    title: "Publish one clean link",
    description:
      "Share a mobile event page that guests can use before, during, and after the event.",
  },
] as const;

const phonePreviews = {
  eventHub: {
    tone: "sage",
    userMessage: "Make a garden brunch invite with RSVP, a map, and a registry link.",
    attachment: "/images/marketing/landing-hero-live-card.webp",
    attachmentAlt: "Garden brunch live card preview",
    attachmentLabel: "Invite uploaded",
    assistantMessage:
      "I drafted the invite, event page, RSVP flow, map section, registry links, and update notes.",
    draftTitle: "Garden brunch",
    chips: ["RSVP", "Map", "Registry", "Updates"],
    inputPlaceholder: "Message Concierge",
  },
  signup: {
    tone: "lavender",
    userMessage: "Turn this school carnival flyer into a page with volunteer slots and updates.",
    attachment: "/images/marketing/use-case-school.webp",
    attachmentAlt: "School event flyer preview",
    attachmentLabel: "Flyer uploaded",
    assistantMessage:
      "I found the schedule, location, parent sign-up needs, reminder notes, and share page.",
    draftTitle: "Spring carnival",
    chips: ["Volunteer slots", "Schedule", "Map", "Reminders"],
    inputPlaceholder: "Ask about sign-ups",
  },
} as const;

const intentTileToneClasses = {
  sage: {
    card: "hover:border-[#8ab8aa] hover:shadow-[0_20px_42px_rgba(39,104,92,0.13),inset_0_1px_0_rgba(255,255,255,0.92)]",
    icon: "border-[#d7e7df] bg-[#e8f4ef] text-[#27685c] group-hover:border-[#17211f] group-hover:bg-[#17211f] group-hover:text-white",
  },
  lavender: {
    card: "hover:border-[#cdbdeb] hover:shadow-[0_20px_42px_rgba(116,87,166,0.16),inset_0_1px_0_rgba(255,255,255,0.92)]",
    icon: "border-[#d8ccef] bg-[#f1ecfb] text-[#7457a6] group-hover:border-[#7457a6] group-hover:bg-[#7457a6] group-hover:text-white",
  },
} as const;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function SectionHeader({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  center?: boolean;
}) {
  return (
    <div className={cx("max-w-2xl", center && "mx-auto text-center")}>
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#3f7f72]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-[#17211f] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-[#5d6b66]">{description}</p>
    </div>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#17211f] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#24332f]"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#cddad3] bg-white px-5 text-sm font-semibold text-[#17211f] transition hover:-translate-y-0.5 hover:border-[#8ab8aa]"
    >
      {children}
    </Link>
  );
}

function PhoneConciergePreview({ variant = "eventHub" }: { variant?: keyof typeof phonePreviews }) {
  const preview = phonePreviews[variant];
  const isLavender = preview.tone === "lavender";

  return (
    <div className="mx-auto w-full max-w-[330px]">
      <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2.4rem] border-[7px] border-[#151918] bg-[#151918] shadow-[0_26px_70px_rgba(23,33,31,0.22)]">
        <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-[#151918]" />
        <div className="flex h-full flex-col overflow-hidden rounded-[1.95rem] bg-[#f6f7f4]">
          <div className="border-b border-[#dde5df] bg-[#fbfaf7] px-4 pb-3 pt-8">
            <div className="flex items-center gap-3">
              <Image
                src={conciergeLogo}
                alt=""
                width={34}
                height={34}
                className="h-8 w-8 object-contain"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#17211f]">Envitefy Concierge</p>
                <p className={cx("text-xs", isLavender ? "text-[#7457a6]" : "text-[#3f7f72]")}>
                  Active now
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-hidden px-3 py-4">
            <div className="flex items-end gap-2">
              <Image
                src={conciergeLogo}
                alt=""
                width={26}
                height={26}
                className="h-6 w-6 shrink-0 object-contain"
              />
              <div className="max-w-[78%] rounded-[1.1rem] rounded-bl-sm bg-white px-3.5 py-2.5 text-[13px] leading-5 text-[#2f3b36] shadow-sm">
                Tell me what you are hosting, or send the invite you already have.
              </div>
            </div>

            <div className="flex justify-end">
              <div
                className={cx(
                  "max-w-[80%] rounded-[1.1rem] rounded-br-sm px-3.5 py-2.5 text-[13px] leading-5 text-white shadow-sm",
                  isLavender ? "bg-[#7457a6]" : "bg-[#27685c]",
                )}
              >
                {preview.userMessage}
              </div>
            </div>

            <div className="ml-auto max-w-[76%] overflow-hidden rounded-[1rem] border border-[#cddad3] bg-white shadow-sm">
              <img
                src={preview.attachment}
                alt={preview.attachmentAlt}
                className="h-28 w-full object-cover"
              />
              <div className="px-3 py-2 text-[12px] font-medium text-[#53615c]">
                {preview.attachmentLabel}
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Image
                src={conciergeLogo}
                alt=""
                width={26}
                height={26}
                className="h-6 w-6 shrink-0 object-contain"
              />
              <div className="max-w-[82%] rounded-[1.1rem] rounded-bl-sm bg-white px-3.5 py-2.5 text-[13px] leading-5 text-[#2f3b36] shadow-sm">
                {preview.assistantMessage}
              </div>
            </div>

            <div className="rounded-xl border border-[#dfe7e2] bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p
                    className={cx(
                      "text-[11px] font-semibold uppercase tracking-[0.16em]",
                      isLavender ? "text-[#7457a6]" : "text-[#3f7f72]",
                    )}
                  >
                    Draft ready
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#17211f]">{preview.draftTitle}</p>
                </div>
                <span
                  className={cx(
                    "rounded-md px-2 py-1 text-[11px] font-semibold",
                    isLavender ? "bg-[#f1ecfb] text-[#7457a6]" : "bg-[#e8f4ef] text-[#27685c]",
                  )}
                >
                  Review
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-semibold text-[#53615c]">
                {preview.chips.map((chip) => (
                  <span
                    key={chip}
                    className={cx(
                      "rounded-md px-2 py-1.5",
                      isLavender ? "bg-[#f6f2fc]" : "bg-[#f6f7f4]",
                    )}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[#dde5df] bg-[#fbfaf7] px-3 py-3">
            <div className="flex items-center gap-2 rounded-full bg-[#eef1ed] px-3 py-2">
              <span className="flex-1 text-[12px] text-[#7a8580]">{preview.inputPlaceholder}</span>
              <span
                className={cx(
                  "flex h-7 w-7 items-center justify-center rounded-full text-white",
                  isLavender ? "bg-[#7457a6]" : "bg-[#27685c]",
                )}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewDenied({ status }: { status: number }) {
  const isUnauthorized = status === 401;
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f4ef] px-6 text-[#17211f]">
      <section className="max-w-md rounded-lg border border-[#d9d1c6] bg-white p-8 text-center shadow-sm">
        <ShieldCheck className="mx-auto h-10 w-10 text-[#3f7f72]" />
        <h1 className="mt-5 text-2xl font-semibold">
          {isUnauthorized ? "Sign in required" : "Admins only"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#5d6b66]">
          {isUnauthorized
            ? "This landing mock is an internal preview route."
            : "This preview is limited to Envitefy admin accounts."}
        </p>
        <Link
          href={isUnauthorized ? "/api/auth/signin?callbackUrl=/admin/landing-preview" : "/"}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#17211f] px-4 text-sm font-semibold text-white transition hover:bg-[#24332f]"
        >
          {isUnauthorized ? "Sign in" : "Go home"}
        </Link>
      </section>
    </main>
  );
}

async function ensureAdminAccess() {
  try {
    return await requireAdminSession();
  } catch (error) {
    if (error instanceof AdminRouteError && error.status === 401) {
      redirect("/api/auth/signin?callbackUrl=/admin/landing-preview");
    }
    if (error instanceof AdminRouteError) {
      return { deniedStatus: error.status };
    }
    throw error;
  }
}

export default async function AdminLandingPreviewPage() {
  const admin = await ensureAdminAccess();
  if ("deniedStatus" in admin) {
    return <PreviewDenied status={admin.deniedStatus} />;
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#17211f]">
      <div className="border-b border-[#e5ded5] bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-2 text-xs text-[#6b756f] sm:px-8 lg:px-10">
          <Link href="/admin" className="font-semibold text-[#3f7f72] hover:text-[#255f55]">
            Admin preview
          </Link>
          <span>Noindex route. Production /landing is unchanged.</span>
        </div>
      </div>

      <header className="sticky top-0 z-20 border-b border-[#e5ded5] bg-[#fbfaf7]/94 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
          <Link href="/admin/landing-preview" className="flex items-center overflow-visible">
            <EnvitefyWordmark className="text-[2rem]" scaled={false} />
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-[#5d6b66] md:flex">
            <a href="#platform" className="hover:text-[#17211f]">
              Platform
            </a>
            <a href="#showcase" className="hover:text-[#17211f]">
              Gallery
            </a>
            <a href="#concierge" className="hover:text-[#17211f]">
              Concierge
            </a>
            <a href="#examples" className="hover:text-[#17211f]">
              Examples
            </a>
            <a href="#workflow" className="hover:text-[#17211f]">
              Workflow
            </a>
          </div>
          <div className="flex items-center gap-2">
            <SecondaryLink href="/?action=upload">Upload</SecondaryLink>
            <PrimaryLink href="/chat">
              Concierge
              <ArrowRight className="h-4 w-4" />
            </PrimaryLink>
          </div>
        </nav>
      </header>

      <section className="border-b border-[#e5ded5] bg-[#f7f4ef]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:px-10 lg:py-24">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#cddad3] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#3f7f72]">
              <Image
                src={conciergeLogo}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 object-contain"
              />
              Event creation assistant
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#17211f] sm:text-6xl lg:text-[4.9rem]">
              One polished event link from idea to RSVP.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#53615c]">
              Envitefy helps hosts create invitations, event pages, RSVP flows, registry links, and
              smart sign-ups from a message, upload, flyer, PDF, schedule, or design idea.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="/chat">
                Start with Concierge
                <ArrowRight className="h-4 w-4" />
              </PrimaryLink>
              <SecondaryLink href="/?action=upload">
                Upload an invite or PDF
                <Upload className="h-4 w-4" />
              </SecondaryLink>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {["Invite", "RSVP", "Event page", "Sign-up"].map((item) => (
                <div key={item} className="rounded-lg border border-[#e0d8ce] bg-white px-4 py-3">
                  <p className="font-semibold text-[#17211f]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="grid items-center gap-5 lg:grid-cols-[minmax(290px,0.9fr)_minmax(0,1.1fr)]">
              <PhoneConciergePreview />
              <div className="space-y-4">
                <div className="rounded-lg border border-[#d9d1c6] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-[#eee7df] pb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3f7f72]">
                        From chat to live link
                      </p>
                      <h2 className="mt-1 text-xl font-semibold">Garden brunch</h2>
                    </div>
                    <span className="rounded-md bg-[#e8f4ef] px-2.5 py-1 text-xs font-semibold text-[#27685c]">
                      Published
                    </span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      ["42", "RSVPs"],
                      ["8", "Sign-up slots"],
                      ["3", "Registry links"],
                      ["1", "Share URL"],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-lg bg-[#f7f4ef] p-3">
                        <p className="text-2xl font-semibold">{value}</p>
                        <p className="mt-1 text-xs font-medium text-[#6b756f]">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 space-y-2">
                    {[
                      "Concierge fills the missing details",
                      "Guests can RSVP from the page",
                      "Maps, registry, and updates travel together",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3 text-sm text-[#53615c]">
                        <span className="h-2 w-2 rounded-full bg-[#3f7f72]" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-[#d9d1c6] bg-white shadow-sm">
                  <img
                    src="/images/marketing/landing-hero-live-card.webp"
                    alt="Live card gallery preview"
                    className="h-64 w-full object-cover object-top"
                  />
                  <div className="grid grid-cols-3 divide-x divide-[#eee7df] border-t border-[#eee7df] text-center text-xs font-semibold text-[#53615c]">
                    {["Invite", "RSVP", "Updates"].map((item) => (
                      <span key={item} className="px-2 py-3">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="border-b border-[#dde5df] bg-[#f6f7f4]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <SectionHeader
            eyebrow="Intent chooser"
            title="Pick the closest starting point."
            description="A soft chooser works best when it feels like Envitefy: warm surface, sage action, lavender accents, charcoal text, and enough contrast to stay practical."
            center
          />
          <div className="mx-auto mt-5 h-1 w-24 rounded-full bg-[#cdbdeb]" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {intentTiles.map((option) => {
              const Icon = option.icon;
              const toneClasses = intentTileToneClasses[option.tone];
              return (
                <Link
                  key={option.title}
                  href={option.href}
                  className={cx(
                    "group flex min-h-[164px] flex-col items-center justify-center rounded-lg border border-[#dde5df] bg-[#fbfaf7] px-5 py-6 text-center shadow-[0_16px_34px_rgba(23,33,31,0.08),inset_0_1px_0_rgba(255,255,255,0.86)] transition hover:-translate-y-1 hover:bg-white",
                    toneClasses.card,
                  )}
                  aria-label={`Start ${option.title.toLowerCase()} with Envitefy`}
                >
                  <span
                    className={cx(
                      "flex h-12 w-12 items-center justify-center rounded-lg border shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_10px_18px_rgba(23,33,31,0.07)] transition",
                      toneClasses.icon,
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="mt-5 text-sm font-bold uppercase tracking-[0.14em] text-[#17211f]">
                    {option.title}
                  </span>
                  <span className="mt-2 max-w-[13rem] text-sm leading-5 text-[#5d6b66]">
                    {option.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e5ded5] bg-[#fffdf8]">
        <LandingLiveCardShowcase
          eyebrow="Live card gallery"
          title="A polished card guests want to open."
          description="Bring the existing Envitefy live card gallery back as proof that the shared link can feel designed, personal, and useful on a phone."
        />
      </section>

      <section id="concierge" className="border-y border-[#e5ded5] bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <SectionHeader
              eyebrow="Concierge"
              title="The front door is a conversation."
              description="Concierge should be positioned as the simplest way to get from loose event details to a useful page, while upload and manual creation stay available paths."
            />
            <div className="mt-8 grid gap-3">
              {[
                "Tell Envitefy what you're planning",
                "Attach the invite, flyer, PDF, screenshot, or schedule",
                "Review missing date, location, registry, and RSVP details",
                "Publish a live card, event page, or smart sign-up",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-[#e0d8ce] bg-[#fbfaf7] p-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#17211f] text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium leading-6 text-[#38443f]">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#d9d1c6] bg-[#f7f4ef] px-5 py-6 shadow-sm sm:px-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3f7f72]">
                  Phone-first preview
                </p>
                <p className="mt-2 text-sm leading-6 text-[#53615c]">
                  The landing page should show Concierge where hosts expect it: in a real chat flow,
                  inside a phone, with a draft event emerging from the conversation.
                </p>
              </div>
            </div>
            <PhoneConciergePreview variant="signup" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <SectionHeader
            eyebrow="Guest experience"
            title="A link with real utility after the invite is sent."
            description="Guests should understand what to do next. Hosts should have fewer duplicate texts, fewer scattered links, and a clearer record of responses."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {guestActions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.label}
                  className="flex items-center gap-3 rounded-lg border border-[#e0d8ce] bg-white p-4 shadow-sm"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5efe7] text-[#986548]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold">{action.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="examples" className="border-y border-[#e5ded5] bg-[#f7f4ef]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <SectionHeader
            eyebrow="Examples"
            title="Broad enough for everyday events, specific enough to feel useful."
            description="The landing page should show that Envitefy works across celebrations, school needs, team weekends, community logistics, and professional gatherings."
            center
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {examples.map((example) => (
              <article
                key={example.title}
                className="overflow-hidden rounded-lg border border-[#d9d1c6] bg-white shadow-sm"
              >
                <img
                  src={example.image}
                  alt={`${example.title} example`}
                  className="h-52 w-full object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{example.title}</h3>
                  <p className="mt-1 text-sm text-[#5d6b66]">{example.note}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader
            eyebrow="Workflow"
            title="Simple enough to remember."
            description="The page should avoid product taxonomy and explain the creation path in three steps."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {workflow.map((step, index) => (
              <article
                key={step.title}
                className="rounded-lg border border-[#e0d8ce] bg-white p-5 shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#17211f] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5d6b66]">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#e5ded5] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#3f7f72]">
              Ready to preview the next direction
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              A more professional landing page: light, direct, and product-led.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5d6b66]">
              This mock keeps the product promise focused on a useful event link, with Concierge as
              the fastest path and upload as a supporting input.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <PrimaryLink href="/chat">
              Start with Concierge
              <ArrowRight className="h-4 w-4" />
            </PrimaryLink>
            <SecondaryLink href="/?action=upload">Upload what you have</SecondaryLink>
          </div>
        </div>
      </section>
    </main>
  );
}
