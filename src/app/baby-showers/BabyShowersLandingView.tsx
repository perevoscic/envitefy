import {
  ArrowRight,
  Baby,
  CalendarDays,
  Check,
  ExternalLink,
  Gift,
  Heart,
  Link as LinkIcon,
  MapPin,
  MessageCircleHeart,
  QrCode,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import type { CSSProperties } from "react";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import styles from "./BabyShowersLandingView.module.css";

const createHref = "/baby-showers?auth=signup";

const collections = [
  {
    id: "gender-neutral-greenery",
    badge: "Most loved",
    eyebrow: "Fresh & modern",
    title: "Botanical Sprout",
    body: "Soft eucalyptus, warm ivory, and clean type for a relaxed, gender-neutral celebration.",
    image: "/templates/baby-showers/gender-neutral-greenery.webp",
    imageAlt: "Gender-neutral greenery baby shower setting",
    accent: "#547867",
    soft: "#edf4ef",
  },
  {
    id: "terracotta-bloom",
    badge: "Trending",
    eyebrow: "Warm & joyful",
    title: "Terracotta Bloom",
    body: "Earthy citrus tones, modern florals, and a sun-washed palette made for an easygoing shower.",
    image: "/templates/baby-showers/terracotta-bloom.webp",
    imageAlt: "Terracotta floral baby shower table setting",
    accent: "#d7662e",
    soft: "#fff0e7",
  },
  {
    id: "little-star-is-coming",
    badge: "Classic",
    eyebrow: "Dreamy & timeless",
    title: "Moonlit Little Star",
    body: "Deep navy, warm starlight, and celestial details for a magical welcome under the moon.",
    image: "/templates/baby-showers/little-star-is-coming.webp",
    imageAlt: "Moon and stars baby shower setting",
    accent: "#224f79",
    soft: "#eaf3fb",
  },
] as const;

const hostNotes = [
  {
    quote:
      "The invitation looked beautiful on every phone, and having the registry and RSVP in the same place saved us so many follow-up texts.",
    initials: "ES",
    name: "Emily S.",
    meta: "Baby shower host",
  },
  {
    quote:
      "We changed the brunch time once and everyone had the current details immediately. No new invitation, no confusion.",
    initials: "JM",
    name: "Jessica M.",
    meta: "Expecting parent",
  },
  {
    quote:
      "Guests could RSVP, open the registry, get directions, and save the date without downloading another app.",
    initials: "CL",
    name: "Chloe L.",
    meta: "Co-host",
  },
] as const;

const faqItems = [
  {
    question: "Can I add more than one registry or wishlist?",
    answer:
      "Yes. Keep Babylist, Target, Amazon, or any custom gift link together on the same guest page.",
  },
  {
    question: "Can I update the shower after sharing it?",
    answer:
      "Yes. Change the time, location, registry links, or guest note on the live page without sending a replacement invitation.",
  },
  {
    question: "Do guests need an Envitefy account?",
    answer:
      "No. Guests can open the invitation, review the details, visit your registry, and RSVP from the shared link.",
  },
] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SectionHeading({
  eyebrow,
  title,
  body,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <p className="inline-flex rounded-full bg-[#fff0e6] px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#d75b20]">
        {eyebrow}
      </p>
      <h2
        className={cx(
          styles.serif,
          "mt-4 text-3xl font-bold leading-tight text-[#13233d] sm:text-4xl lg:text-[2.8rem]",
        )}
      >
        {title}
      </h2>
      {body ? <p className="mt-4 text-base leading-7 text-slate-600">{body}</p> : null}
    </div>
  );
}

function HeroInvitation() {
  return (
    <div className={styles.heroVisual}>
      <Image
        src="/images/landing/hero/baby-shower-mobile.webp"
        alt="Elegant baby shower table with flowers, teddy bears, and a celebration cake"
        fill
        priority
        sizes="(max-width: 1024px) 80vw, 420px"
        className="object-cover"
      />

      <div className={styles.invitationCard}>
        <div className="flex items-center justify-center gap-2 text-[0.58rem] font-bold uppercase tracking-[0.24em] text-[#d75b20]">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          A little sprout is on the way
        </div>
        <p className={cx(styles.serif, "mt-3 text-3xl font-bold leading-none text-[#13233d]")}>
          Olivia&apos;s
        </p>
        <p className={cx(styles.serif, "mt-1 text-xl italic text-[#d75b20]")}>baby shower</p>
        <div className="mx-auto my-4 h-px w-12 bg-[#efb692]" />
        <p className="text-[0.68rem] font-semibold leading-5 text-slate-600">
          Saturday, September 12 · 11:00 AM
          <br />
          The Garden House · Austin
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[0.58rem] font-bold uppercase tracking-[0.1em]">
          <span className="rounded-full bg-[#eaf3fb] px-2 py-2 text-[#245b87]">RSVP open</span>
          <span className="rounded-full bg-[#fff0e6] px-2 py-2 text-[#d75b20]">
            View registry
          </span>
        </div>
      </div>

      <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/70 bg-white/92 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fff0e6] text-[#e66627]">
            <Gift className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#13233d]">One guest-ready link</p>
            <p className="mt-0.5 text-[0.68rem] leading-4 text-slate-500">
              Invitation, RSVP, registry, directions, and updates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CollectionCard({ collection }: { collection: (typeof collections)[number] }) {
  const cardStyle = {
    "--baby-card-accent": collection.accent,
    "--baby-card-soft": collection.soft,
  } as CSSProperties;

  return (
    <article className={styles.collectionCard} style={cardStyle}>
      <div className="group relative h-64 overflow-hidden">
        <Image
          src={collection.image}
          alt={collection.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#13233d]/58 via-transparent to-transparent" />
        <span className="absolute top-4 right-4 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[0.65rem] font-bold text-[var(--baby-card-accent)] shadow-sm backdrop-blur">
          {collection.badge}
        </span>
        <div className="absolute right-5 bottom-5 left-5 rounded-2xl border border-white/30 bg-[#13233d]/58 p-4 text-white backdrop-blur-md">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/75">
            {collection.eyebrow}
          </p>
          <p className={cx(styles.serif, "mt-1 text-xl font-bold")}>{collection.title}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p className="flex-1 text-sm leading-6 text-slate-600">{collection.body}</p>
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200/80 pt-5">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.15em] text-slate-500">
            Invite + live page
          </span>
          <Link
            href={createHref}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--baby-card-accent)] transition hover:gap-2.5"
          >
            Start designing
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function BabyShowersLandingView() {
  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Baby Shower Invitation, RSVP and Registry Page | Envitefy",
    url: "https://envitefy.com/baby-showers",
    description:
      "Create a polished baby shower invitation with RSVPs, registry links, directions, calendar saves, and guest updates in one live page.",
    isPartOf: {
      "@type": "WebSite",
      name: "Envitefy",
      url: "https://envitefy.com",
    },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className={styles.page}>
      <SignedOutPageChrome activeBottomNavLabel="Menu" brandHref="/" />

      <main className="pb-24 md:pb-0">
        <section className={styles.heroPattern}>
          <Image
            src="/images/landing/hero/baby-shower-desktop.webp"
            alt="Teddy-bear baby shower celebration with cake, flowers, and gifts"
            fill
            priority
            sizes="100vw"
            className="hidden object-cover sm:block"
          />
          <Image
            src="/images/landing/hero/baby-shower-mobile.webp"
            alt="Teddy-bear baby shower celebration with cake, flowers, and gifts"
            fill
            priority
            sizes="100vw"
            className="object-cover sm:hidden"
          />
          <div className="relative z-[1] mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-5 pt-32 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.7fr)] lg:px-10 lg:pt-36 lg:pb-24">
            <div className="max-w-3xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe1ee] bg-white/85 px-4 py-2 text-[0.66rem] font-bold uppercase tracking-[0.17em] text-[#245b87] shadow-sm backdrop-blur">
                <Baby className="h-3.5 w-3.5 text-[#e66627]" aria-hidden="true" />
                Invitations · RSVP · registries
              </div>
              <h1
                className={cx(
                  styles.serif,
                  "mt-6 text-[2.8rem] font-bold leading-[1.03] tracking-[-0.035em] !text-[#13233d] drop-shadow-[0_2px_10px_rgba(255,255,255,0.96)] sm:text-6xl lg:text-[4.55rem]",
                )}
              >
                Gorgeous baby shower invitations,{" "}
                <span className="text-[#e66627] italic">all in one beautiful link.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-8 text-[#13233d] drop-shadow-[0_2px_8px_rgba(255,255,255,0.98)] sm:text-lg lg:mx-0">
                Set the perfect tone for welcoming your little one. Create a polished digital
                invitation with RSVPs, registry links, directions, calendar saves, and every guest
                detail together.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link href={createHref} className={styles.primaryCta}>
                  Create your baby shower
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a href="#collections" className={styles.secondaryCta}>
                  Browse invitation styles
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-semibold text-[#13233d] drop-shadow-[0_2px_7px_rgba(255,255,255,0.98)] lg:justify-start">
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#e66627]" aria-hidden="true" />
                  No guest app needed
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#e66627]" aria-hidden="true" />
                  Update details anytime
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[27rem]">
              <HeroInvitation />
              <div className={styles.floatingNote}>
                <Heart className="h-4 w-4 fill-current text-[#e66627]" aria-hidden="true" />
                Personalized for your celebration
              </div>
            </div>
          </div>
        </section>

        <nav className="border-y border-[#e7edf2] bg-white" aria-label="Baby shower page sections">
          <div className="mx-auto flex max-w-5xl snap-x gap-2 overflow-x-auto px-5 py-4 sm:justify-center sm:px-8">
            {[
              ["Invitation styles", "#collections"],
              ["Registries", "#registries"],
              ["How it works", "#how-it-works"],
              ["Host notes", "#host-notes"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="shrink-0 snap-start rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-[#fff0e6] hover:text-[#d75b20]"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        <section
          id="collections"
          className="scroll-mt-28 bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Invitation styles"
              title="Choose a look that feels like your celebration"
              body="Start with a signature design, then personalize the wording, date, place, registry links, and guest details in the Envitefy studio."
            />
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href={createHref} className={styles.textLink}>
                Create your baby shower invitation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section
          id="registries"
          className="scroll-mt-28 border-y border-[#e7edf2] bg-[#f6f9fc] px-5 py-20 sm:px-8 lg:px-10 lg:py-24"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Registry & wishlist links"
                title="Every gift link, right where guests expect it"
                body="Keep Babylist, Target, Amazon, and custom wishlist links on the same polished page as the invitation. Guests can move from RSVP to registry without searching through old texts."
              />
              <div className="mt-8 space-y-5">
                {[
                  {
                    icon: LinkIcon,
                    title: "All your registry destinations",
                    body: "Bring multiple store and wishlist links together in one clear guest view.",
                  },
                  {
                    icon: QrCode,
                    title: "Easy from digital or printed invites",
                    body: "Share the live link directly or place its QR code on printed stationery.",
                  },
                  {
                    icon: MessageCircleHeart,
                    title: "One place for the latest note",
                    body: "Keep gifting preferences, diaper raffle details, and host updates current.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fff0e6] text-[#d75b20]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#13233d]">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{item.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.registryPreview}>
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#245b87]">
                    Olivia&apos;s baby shower
                  </p>
                  <h3 className={cx(styles.serif, "mt-1 text-2xl font-bold text-[#13233d]")}>
                    Registry & wishes
                  </h3>
                </div>
                <span className="rounded-full bg-[#eaf3fb] px-3 py-1.5 text-[0.62rem] font-bold text-[#245b87]">
                  Guest view
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  {
                    name: "Babylist",
                    note: "Our complete baby registry",
                    initials: "BL",
                    color: "#e56647",
                    background: "#fff0ec",
                  },
                  {
                    name: "Target",
                    note: "Nursery and everyday essentials",
                    initials: "TG",
                    color: "#cc2f2f",
                    background: "#fff0f0",
                  },
                  {
                    name: "Books for baby",
                    note: "A few favorite bedtime stories",
                    initials: "BB",
                    color: "#245b87",
                    background: "#eaf3fb",
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-[#f8fafc] p-3.5"
                  >
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xs font-extrabold"
                      style={{ color: item.color, backgroundColor: item.background }}
                    >
                      {item.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#13233d]">{item.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{item.note}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#13233d] p-4 text-white">
                  <Users className="h-4 w-4 text-[#ff9a5f]" aria-hidden="true" />
                  <p className="mt-3 text-xl font-bold">36</p>
                  <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white/65">
                    Guests going
                  </p>
                </div>
                <div className="rounded-2xl bg-[#fff0e6] p-4 text-[#9f431a]">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  <p className="mt-3 text-sm font-bold">Saved to calendar</p>
                  <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#9f431a]/65">
                    One tap for guests
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-28 bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="One invitation, everything included"
              title="Beautiful for guests. Practical for hosts."
              body="Envitefy keeps the design guests see and the details hosts manage connected from the first share to the final RSVP."
            />
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: Sparkles,
                  number: "01",
                  title: "Pick and personalize",
                  body: "Choose a design, add the shower details, and make the wording feel like you.",
                },
                {
                  icon: Gift,
                  number: "02",
                  title: "Add the helpful extras",
                  body: "Connect registry links, directions, calendar saves, RSVP questions, and host notes.",
                },
                {
                  icon: Heart,
                  number: "03",
                  title: "Share one live page",
                  body: "Send one link by text or email and update it later without starting over.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.number} className={styles.stepCard}>
                    <div className="flex items-center justify-between">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0e6] text-[#d75b20]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className={cx(styles.serif, "text-3xl font-bold text-[#dbe6ef]")}>
                        {item.number}
                      </span>
                    </div>
                    <h3 className={cx(styles.serif, "mt-6 text-2xl font-bold text-[#13233d]")}>
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
                  </article>
                );
              })}
            </div>

            <div className="mt-10 grid gap-4 rounded-[2rem] bg-[#13233d] p-6 text-white sm:grid-cols-3 sm:p-8">
              {[
                {
                  icon: CalendarDays,
                  title: "Date & calendar",
                  body: "Make the shower easy to remember.",
                },
                {
                  icon: MapPin,
                  title: "Place & directions",
                  body: "Keep arrival details close at hand.",
                },
                {
                  icon: Users,
                  title: "RSVP & guest notes",
                  body: "See replies and helpful details together.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"
                  >
                    <Icon className="h-5 w-5 text-[#ff9a5f]" aria-hidden="true" />
                    <h3 className="mt-4 font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/65">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="host-notes"
          className="scroll-mt-28 border-y border-[#e7edf2] bg-[#f6f9fc] px-5 py-20 sm:px-8 lg:px-10 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Host notes"
              title="Less chasing. More celebrating."
              body="One live invitation keeps the little details from turning into a dozen separate conversations."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {hostNotes.map((note) => (
                <article key={note.name} className={styles.quoteCard}>
                  <div className="flex gap-1 text-[#f0a53b]" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={`${note.initials}-${String(index)}`}
                        className="h-4 w-4 fill-current"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <blockquote className="mt-5 flex-1 text-sm leading-7 text-slate-700">
                    &ldquo;{note.quote}&rdquo;
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#fff0e6] text-xs font-extrabold text-[#d75b20]">
                      {note.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#13233d]">{note.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{note.meta}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.42fr_0.58fr]">
            <SectionHeading
              align="left"
              eyebrow="Good to know"
              title="A few questions before you share"
            />
            <div className="space-y-3">
              {faqItems.map((item) => (
                <details key={item.question} className={styles.faqCard}>
                  <summary className="cursor-pointer list-none pr-8 text-base font-bold text-[#13233d] marker:hidden">
                    {item.question}
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#13233d] px-5 py-20 text-white sm:px-8 lg:px-10">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#1d3f64] via-[#17324f] to-[#13233d] px-6 py-12 text-center shadow-2xl sm:px-12 sm:py-16">
            <div className={styles.ctaPattern} aria-hidden="true" />
            <div className="relative z-[1] mx-auto max-w-3xl">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#e66627] shadow-lg shadow-[#e66627]/30">
                <Baby className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className={cx(styles.serif, "mt-6 text-3xl font-bold leading-tight sm:text-5xl")}>
                Make the first hello feel unforgettable.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                Create your baby shower invitation, add the registry, and give every guest one
                beautiful place for the details.
              </p>
              <Link href={createHref} className={cx(styles.primaryCta, "mt-8")}>
                Start your baby shower page
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Script id="ld-baby-showers-webpage" type="application/ld+json">
        {JSON.stringify(webPageLd)}
      </Script>
      <Script id="ld-baby-showers-faq" type="application/ld+json">
        {JSON.stringify(faqLd)}
      </Script>
    </div>
  );
}
