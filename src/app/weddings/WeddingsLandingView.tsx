import { ArrowRight, Gift, ListChecks, UtensilsCrossed } from "lucide-react";
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
import type { UseCasePage } from "../category-pages/category-page-data";
import WeddingStudioPreview from "./WeddingStudioPreview";

type SuiteTheme = "gold" | "tuscan" | "noir";

const collections: Array<{
  id: SuiteTheme;
  badge?: string;
  title: string;
  body: string;
  couple: string;
  script: string;
  pieces: [string, string, string];
}> = [
  {
    id: "gold",
    badge: "A classic palette",
    title: "Versailles Grand Gold",
    body: "Heavy foil borders, classical European serif typography, and royal crest monograms for formal hotel ballrooms and historic estates.",
    couple: "Eleanor & Julian",
    script: "Together Forever",
    pieces: ["Invitation", "RSVP", "Details"],
  },
  {
    id: "tuscan",
    title: "Tuscan Vineyard & Estate",
    body: "Botanical olive branch watercolors, organic textured card backgrounds, and romantic outdoor destination styling.",
    couple: "Clara & Matteo",
    script: "Under the Vines",
    pieces: ["Invitation", "RSVP", "Details"],
  },
  {
    id: "noir",
    title: "Modern Minimalist Noir",
    body: "Sophisticated dark charcoal tones with warm metallic gold accents, clean structural lines, and ultra-chic gallery layouts.",
    couple: "Avery & Cole",
    script: "An Evening Affair",
    pieces: ["Invitation", "RSVP", "Details"],
  },
];

function SuiteStationeryPreview({
  theme,
  couple,
  script,
}: {
  theme: SuiteTheme;
  couple: string;
  script: string;
}) {
  const shell =
    theme === "noir"
      ? {
          stage: "bg-[#1a1714]",
          invite: "bg-[#14110f] text-[#f4efe6] border-[#ab8a5f]/70",
          monogram: "border-[#ab8a5f]/80 text-[#d4bea0]",
          rule: "border-[#ab8a5f]/35",
          script: "text-[#d4bea0]",
          muted: "text-[#cfc5b5]",
          cardBack: "bg-[#2a241f] border-[#ab8a5f]/40",
          cardMid: "bg-[#1f1b17] border-[#ab8a5f]/55",
        }
      : theme === "tuscan"
        ? {
            stage: "bg-[#f3efe4]",
            invite: "bg-[#fbf8f1] text-[#3d3428] border-[#9cae7a]/70",
            monogram: "border-[#9cae7a] text-[#56663d]",
            rule: "border-[#c5d1ab]",
            script: "text-[#56663d]",
            muted: "text-[#6b6154]",
            cardBack: "bg-[#ebe4d4] border-[#b7c49a]",
            cardMid: "bg-[#f4efe3] border-[#a8b888]",
          }
        : {
            stage: "bg-[#f4eee4]",
            invite: "bg-[#fffdf9] text-[#3c2b1d] border-[#c0a37b]",
            monogram: "border-[#c0a37b] text-[#795b3d]",
            rule: "border-[#e5d7c3]",
            script: "text-[#795b3d]",
            muted: "text-[#6b5848]",
            cardBack: "bg-[#ebe1d1] border-[#d4bea0]",
            cardMid: "bg-[#f7f1e7] border-[#cbb48f]",
          };

  const initials = couple
    .split("&")
    .map((part) => part.trim().charAt(0))
    .join("");

  return (
    <div
      data-appearance-scope="authored"
      className={`relative h-56 overflow-hidden rounded-[1.75rem] ${shell.stage}`}
    >
      <div
        className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#ab8a5f_1px,transparent_1px)] [background-size:16px_16px]"
        aria-hidden="true"
      />

      {/* Stacked suite pieces — same structure for every suite */}
      <div
        className={`absolute top-8 left-8 h-36 w-28 -rotate-[10deg] rounded-xl border shadow-md ${shell.cardBack}`}
        aria-hidden="true"
      />
      <div
        className={`absolute top-7 right-7 h-36 w-28 rotate-[11deg] rounded-xl border shadow-md ${shell.cardMid}`}
        aria-hidden="true"
      />

      <div
        className={`absolute inset-x-10 bottom-5 top-6 flex flex-col items-center justify-center rounded-2xl border px-4 py-5 text-center shadow-[0_18px_40px_rgba(82,60,42,0.18)] ${shell.invite}`}
      >
        <div
          className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full border font-wedding-serif text-sm tracking-[0.18em] ${shell.monogram}`}
        >
          {initials}
        </div>
        <p className={`text-[9px] font-semibold uppercase tracking-[0.28em] ${shell.muted}`}>
          The Wedding Of
        </p>
        <p className="mt-1.5 font-wedding-serif text-lg leading-none tracking-wide">{couple}</p>
        <div className={`my-3 h-px w-14 ${shell.rule} border-t`} />
        <p className={`font-wedding-script text-xl leading-none ${shell.script}`}>{script}</p>
        <p className={`mt-2 text-[9px] uppercase tracking-[0.22em] ${shell.muted}`}>
          Invitation Suite
        </p>
      </div>
    </div>
  );
}

const concierge = [
  {
    icon: ListChecks,
    title: "Multi-Event Itineraries",
    body: "Manage separate RSVP responses for rehearsal dinners, welcome cocktails, main ceremony, and next-day brunch.",
  },
  {
    icon: UtensilsCrossed,
    title: "Meal & Dietary Tracking",
    body: "Keep meal preferences and dietary notes alongside your guest replies so the important details are easy to find.",
  },
  {
    icon: Gift,
    title: "Registry & Fund Linkage",
    body: "Integrate Zola, Honeyfund, Bloomingdale's, or Crate & Barrel seamlessly into your guest experience suite.",
  },
] as const;

const timeline = [
  {
    title: "Choose & Customize",
    body: "Select your wedding suite theme and customize names, dates, and venues instantly.",
  },
  {
    title: "Import Guest List",
    body: "Share your wedding page with guests by text, email, or the messaging app you already use.",
  },
  {
    title: "Track RSVPs Live",
    body: "Monitor responses, meal preferences, and guest messages in your dedicated live dashboard.",
  },
] as const;

const reviews = [
  {
    quote:
      "Keep ceremony, reception, and wedding-weekend information together so guests can find the right detail from the same link.",
    initials: "01",
    name: "One place for the weekend",
    meta: "A planning note",
  },
  {
    quote:
      "Start with a private draft. Review names, times, locations, and guest instructions before you publish and share your invitation.",
    initials: "02",
    name: "Make room for the final details",
    meta: "Before you share",
  },
] as const;

function SectionEyebrow({ children }: { children: string }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#795b3d]">
      {children}
    </span>
  );
}

export default function WeddingsLandingView({ page }: { page: UseCasePage }) {
  const pageUrl = `https://envitefy.com${page.path}`;
  const primaryHref = "#templates";
  const studioHref = "/event/weddings";

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.metadataTitle,
    url: pageUrl,
    description: page.description,
    about: page.keywords,
    isPartOf: {
      "@type": "WebSite",
      name: "Envitefy",
      url: "https://envitefy.com",
    },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <MarketingPage className={`${publicStyles.page} ${editorialStyles.editorial} weddings-landing`}>
      <SignedOutPageChrome activeBottomNavLabel="Menu" brandHref="/" />

      <main
        style={
          {
            "--font-wedding-serif": "'Cormorant Garamond', Georgia, serif",
            "--font-wedding-script": "'Great Vibes', cursive",
            "--font-wedding-sans": "var(--font-sans), sans-serif",
          } as CSSProperties
        }
      >
        <MarketingHero
          eyebrow="Wedding invitations & guest pages"
          title={
            <>
              The beginning of
              <br />
              <em>your forever.</em>
            </>
          }
          description="A beautiful invitation, every wedding detail, and your guest replies. Bring it all together in one thoughtful link."
          image="/templates/weddings/generated-heroes/blush-linen-romance-hero.webp"
          imageAlt="Original blush floral wedding invitation artwork"
          primaryHref={primaryHref}
          primaryLabel="Browse wedding designs"
          secondaryHref="#collections"
          secondaryLabel="Explore the collections"
        >
          <CelebrationPreview
            title="Eleanor & Julian"
            meta="Together with their families · September 12"
            rows={[{ label: "The celebration", value: "Garden ceremony & dinner" }]}
          />
        </MarketingHero>
        <PublicTemplateGallery category="weddings" featured />

        <section id="collections" className="border-t border-[#f2ece1] bg-white py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-20 max-w-3xl space-y-4 text-center">
              <SectionEyebrow>Curated Design Suites</SectionEyebrow>
              <h2 className="font-wedding-serif text-3xl font-light tracking-wide text-slate-900 sm:text-5xl">
                Uncompromising Wedding Aesthetics
              </h2>
              <p className="text-sm font-light leading-relaxed text-slate-600 sm:text-base">
                Choose an editorial palette that feels like you, then make the names, details, and
                wording your own.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {collections.map((suite) => (
                <article
                  key={suite.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[2.25rem] border border-[#e5d7c3] bg-[#fdfbf7] shadow-[0_18px_50px_rgba(82,60,42,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(82,60,42,0.12)]"
                >
                  {suite.badge ? (
                    <div className="absolute top-4 right-4 z-10 rounded-full bg-[#f2ece1] px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#523c2a]">
                      {suite.badge}
                    </div>
                  ) : null}

                  <div className="p-4 pb-0">
                    <SuiteStationeryPreview
                      theme={suite.id}
                      couple={suite.couple}
                      script={suite.script}
                    />
                  </div>

                  <div className="flex flex-1 flex-col px-7 pt-6 pb-8">
                    <div className="mb-4 flex items-center gap-2">
                      {suite.pieces.map((piece) => (
                        <span
                          key={`${suite.id}-${piece}`}
                          className="rounded-full border border-[#e5d7c3] bg-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#795b3d]"
                        >
                          {piece}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-wedding-serif text-2xl font-normal tracking-wide text-slate-900">
                      {suite.title}
                    </h3>
                    <p className="mt-3 flex-1 text-xs font-light leading-relaxed text-slate-600 sm:text-sm">
                      {suite.body}
                    </p>
                    <Link
                      href={primaryHref}
                      className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#795b3d] transition group-hover:gap-3"
                    >
                      Browse templates
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="studio"
          className="border-y border-[#e5d7c3]/70 bg-gradient-to-b from-[#fbf9f5] to-[#faf7f2]/50 py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
              <SectionEyebrow>Wedding Invitation Design</SectionEyebrow>
              <h2 className="font-wedding-serif text-3xl font-light tracking-wide text-slate-900 sm:text-5xl">
                Design Your Wedding Invitation Live
              </h2>
              <p className="text-sm font-light text-slate-600 sm:text-base">
                Personalize names, dates, venue locations, and aesthetic themes in real time.
              </p>
            </div>
            <WeddingStudioPreview />
            <div className="mt-10 text-center">
              <Link
                href={studioHref}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3.5 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-[#634932]"
              >
                Customize Your Wedding Invitation
                <ArrowRight className="h-3.5 w-3.5 text-[#c0a37b]" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section id="concierge" className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-20 max-w-3xl space-y-4 text-center">
              <SectionEyebrow>Guest Planning Suite</SectionEyebrow>
              <h2 className="font-wedding-serif text-3xl font-light tracking-wide text-slate-900 sm:text-5xl">
                Everything Needed for Your Grand Celebration
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              {concierge.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="space-y-4 rounded-[2rem] border border-[#e5d7c3]/80 bg-[#fbf9f5]/60 p-10"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#e5d7c3] bg-white text-[#795b3d] shadow-sm">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="font-wedding-serif text-2xl text-slate-900">{item.title}</h3>
                    <p className="text-xs font-light leading-relaxed text-slate-600 sm:text-sm">
                      {item.body}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="timeline" className="border-t border-[#e5d7c3]/60 bg-[#fbf9f5]/50 py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
              <SectionEyebrow>Seamless Process</SectionEyebrow>
              <h2 className="font-wedding-serif text-3xl font-light tracking-wide text-slate-900 sm:text-5xl">
                From a first idea to a guest-ready link.
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {timeline.map((step, index) => (
                <article
                  key={step.title}
                  className="space-y-4 rounded-3xl border border-[#e5d7c3] bg-white p-8 text-center shadow-sm"
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#e5d7c3] bg-[#faf7f2] font-wedding-serif text-lg font-bold text-[#795b3d]">
                    {index + 1}
                  </div>
                  <h3 className="font-wedding-serif text-xl font-normal text-slate-900">
                    {step.title}
                  </h3>
                  <p className="text-xs font-light leading-relaxed text-slate-600">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="reviews" className="border-t border-[#f2ece1] bg-white py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
              <SectionEyebrow>Thoughtful planning</SectionEyebrow>
              <h2 className="font-wedding-serif text-3xl font-light tracking-wide text-slate-900 sm:text-5xl">
                Little details. A calmer celebration.
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              {reviews.map((review) => (
                <article
                  key={review.name}
                  className="space-y-6 rounded-[2.5rem] border border-[#e5d7c3] bg-[#fbf9f5]/50 p-10"
                >
                  <p className="font-wedding-serif text-xl leading-relaxed text-slate-800 italic">
                    {review.quote}
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e5d7c3] font-wedding-serif font-bold text-[#523c2a]">
                      {review.initials}
                    </div>
                    <div>
                      <h4 className="font-wedding-serif text-lg text-slate-900">{review.name}</h4>
                      <p className="text-xs uppercase tracking-widest text-slate-500">
                        {review.meta}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-900 px-4 pt-20 pb-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-16">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-[#ab8a5f]/30 bg-gradient-to-r from-[#795b3d] via-[#634932] to-[#523c2a] p-10 text-center shadow-2xl sm:p-14">
              <div
                className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"
                aria-hidden="true"
              />
              <div className="relative z-10 mx-auto max-w-2xl space-y-4">
                <h3 className="font-wedding-serif text-3xl font-light tracking-wide sm:text-5xl">
                  Begin Your Wedding Stationery Journey
                </h3>
                <p className="text-xs font-light tracking-wider text-[#f2ece1] sm:text-sm">
                  Start with a design you love, personalize the details, and share when you are
                  ready.
                </p>
                <div className="pt-4">
                  <Link
                    href={primaryHref}
                    className="inline-block rounded-full bg-white px-10 py-4 text-xs font-semibold uppercase tracking-widest text-[#523c2a] shadow-xl transition hover:bg-[#fbf9f5]"
                  >
                    Browse templates
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes wedding-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .weddings-landing .font-wedding-serif {
          font-family: var(--font-wedding-serif);
        }
        .weddings-landing .font-wedding-script {
          font-family: var(--font-wedding-script);
        }
      `}</style>

      <Script id="ld-use-case-webpage-weddings" type="application/ld+json">
        {JSON.stringify(webPageLd)}
      </Script>
      <Script id="ld-use-case-faq-weddings" type="application/ld+json">
        {JSON.stringify(faqLd)}
      </Script>
    </MarketingPage>
  );
}
