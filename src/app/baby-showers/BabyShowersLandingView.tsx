import {
  Baby,
  CalendarDays,
  ExternalLink,
  Gift,
  Heart,
  Link as LinkIcon,
  MapPin,
  MessageCircleHeart,
  QrCode,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import type { CSSProperties } from "react";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingPage from "@/components/marketing/MarketingPage";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import PublicTemplateGallery from "@/components/templates/PublicTemplateGallery";
import publicStyles from "@/styles/public-appearance.module.css";
import editorialStyles from "../category-pages/CelebrationLanding.module.css";
import CelebrationPreview from "../category-pages/CelebrationPreview";
import styles from "./BabyShowersLandingView.module.css";

const createHref = "#templates";

const collections = [
  {
    id: "pear-orchard-cradle",
    badge: "New collection",
    eyebrow: "Orchard & heirloom",
    title: "Pear Orchard Cradle",
    body: "A hand-painted pear orchard, woven cradle, and arched invitation for a warm welcome.",
    image: "/templates/baby-showers/pear-orchard-cradle.webp",
    imageAlt: "A woven baby cradle beneath a fruiting pear tree",
    accent: "#354329",
    soft: "#faf5df",
  },
  {
    id: "peach-patisserie",
    badge: "New collection",
    eyebrow: "Sweet & playful",
    title: "Peach Patisserie",
    body: "Peach pastries, a scalloped shopfront, and a charming menu-inspired baby shower design.",
    image: "/templates/baby-showers/peach-patisserie.webp",
    imageAlt: "Illustrated peach pastries in a charming French patisserie",
    accent: "#713d39",
    soft: "#fff0e5",
  },
  {
    id: "starlight-observatory",
    badge: "New collection",
    eyebrow: "Celestial & luminous",
    title: "Starlight Observatory",
    body: "A brass telescope, glowing planets, and a midnight invitation for your brightest new discovery.",
    image: "/templates/baby-showers/starlight-observatory.webp",
    imageAlt: "A brass telescope and planet mobile beneath a starry night sky",
    accent: "#224f79",
    soft: "#eaf3fb",
  },
] as const;

const hostNotes = [
  {
    quote:
      "Add registry links beside the shower details, so guests can find the invitation and gift information together.",
    initials: "01",
    name: "Gather the gift links",
    meta: "A planning note",
  },
  {
    quote:
      "Keep the current start time, directions, and host note on the same page after you share it.",
    initials: "02",
    name: "Keep the details together",
    meta: "For your guests",
  },
  {
    quote:
      "Review the invitation on your phone before publishing. Guests can open the shared page without downloading an app.",
    initials: "03",
    name: "Think of the guest view",
    meta: "Before you share",
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
      <p className="inline-flex rounded-full bg-[var(--marketing-soft)] px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--marketing-accent)]">
        {eyebrow}
      </p>
      <h2
        className={cx(
          styles.serif,
          "mt-4 text-3xl font-bold leading-tight text-[var(--marketing-ink)] sm:text-4xl lg:text-[2.8rem]",
        )}
      >
        {title}
      </h2>
      {body ? (
        <p className="mt-4 text-base leading-7 text-[var(--marketing-muted)]">{body}</p>
      ) : null}
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
        <p className="flex-1 text-sm leading-6 text-[var(--marketing-muted)]">{collection.body}</p>
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200/80 pt-5">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.15em] text-[var(--marketing-muted)]">
            Invite + live page
          </span>
          <Link
            href={createHref}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--baby-card-accent)] transition hover:gap-2.5"
          >
            Browse templates
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
    <MarketingPage className={`${publicStyles.page} ${styles.page} ${editorialStyles.editorial}`}>
      <SignedOutPageChrome activeBottomNavLabel="Menu" brandHref="/" />

      <main className="pb-24 md:pb-0">
        <MarketingHero
          eyebrow="Invitations · RSVP · registries"
          title={
            <>
              A little one.
              <br />
              <em>So much to celebrate.</em>
            </>
          }
          description="A lovely invitation for the sweetest new chapter. Bring your baby shower details, registry links, and guest replies together."
          image="/templates/baby-showers/pear-orchard-cradle.webp"
          imageAlt="Original pear orchard baby shower artwork with a woven cradle"
          primaryHref={createHref}
          primaryLabel="Browse baby shower designs"
          secondaryHref="#collections"
          secondaryLabel="Explore invitation styles"
        >
          <CelebrationPreview
            title="Olivia's baby shower"
            meta="Saturday, September 12 · The Garden House"
            chips={["RSVP", "Registry", "Directions"]}
          />
        </MarketingHero>
        <PublicTemplateGallery category="baby-showers" featured />

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
                className="shrink-0 snap-start rounded-full px-4 py-2 text-sm font-bold text-[var(--marketing-muted)] transition hover:bg-[var(--marketing-soft)] hover:text-[#d75b20]"
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
              body="Start with a signature design, then personalize the wording, date, place, registry links, and guest details in the baby shower editor."
            />
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href={createHref} className={styles.textLink}>
                Browse templates
              </Link>
            </div>
          </div>
        </section>

        <section
          id="registries"
          className="scroll-mt-28 border-y border-[#e7edf2] bg-[var(--marketing-paper)] px-5 py-20 sm:px-8 lg:px-10 lg:py-24"
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
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--marketing-soft)] text-[#d75b20]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[var(--marketing-ink)]">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-[var(--marketing-muted)]">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.registryPreview}>
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[var(--marketing-accent)]">
                    Olivia&apos;s baby shower
                  </p>
                  <h3
                    className={cx(
                      styles.serif,
                      "mt-1 text-2xl font-bold text-[var(--marketing-ink)]",
                    )}
                  >
                    Registry & wishes
                  </h3>
                </div>
                <span className="rounded-full bg-[#eaf3fb] px-3 py-1.5 text-[0.62rem] font-bold text-[var(--marketing-accent)]">
                  Sample guest view
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  {
                    name: "Babylist",
                    note: "Our complete baby registry",
                    initials: "BL",
                    color: "#9a3522",
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
                      <p className="text-sm font-bold text-[var(--marketing-ink)]">{item.name}</p>
                      <p className="mt-0.5 truncate text-xs text-[var(--marketing-muted)]">
                        {item.note}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#13233d] p-4 text-white">
                  <Users className="h-4 w-4 text-[#ff9a5f]" aria-hidden="true" />
                  <p className="mt-3 text-xl font-bold">36</p>
                  <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white/82">
                    Guests going
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--marketing-soft)] p-4 text-[#7a2f0f]">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  <p className="mt-3 text-sm font-bold">Saved to calendar</p>
                  <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#7a2f0f]">
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
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--marketing-soft)] text-[var(--marketing-accent)]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className={cx(styles.serif, "text-3xl font-bold text-[#526a7c]")}>
                        {item.number}
                      </span>
                    </div>
                    <h3
                      className={cx(
                        styles.serif,
                        "mt-6 text-2xl font-bold text-[var(--marketing-ink)]",
                      )}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--marketing-muted)]">
                      {item.body}
                    </p>
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
                    <h3 className="mt-4 font-bold !text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/65">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="host-notes"
          className="scroll-mt-28 border-y border-[#e7edf2] bg-[var(--marketing-paper)] px-5 py-20 sm:px-8 lg:px-10 lg:py-24"
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
                  <blockquote className="mt-5 flex-1 text-sm leading-7 text-slate-700">
                    {note.quote}
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--marketing-soft)] text-xs font-extrabold text-[var(--marketing-accent)]">
                      {note.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--marketing-ink)]">{note.name}</p>
                      <p className="mt-0.5 text-xs text-[var(--marketing-muted)]">{note.meta}</p>
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
                  <summary className="cursor-pointer list-none pr-8 text-base font-bold text-[var(--marketing-ink)] marker:hidden">
                    {item.question}
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--marketing-muted)]">
                    {item.answer}
                  </p>
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
                Browse templates
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
    </MarketingPage>
  );
}
