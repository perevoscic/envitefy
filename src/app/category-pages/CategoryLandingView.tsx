import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Gift,
  Heart,
  Link as LinkIcon,
  type LucideIcon,
  MapPinned,
  MessageCircle,
  Sparkles,
  TicketCheck,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import type { CSSProperties } from "react";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingPage from "@/components/marketing/MarketingPage";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import PublicTemplateGallery from "@/components/templates/PublicTemplateGallery";
import { templateCategoryForPath } from "@/lib/template-categories";
import publicStyles from "@/styles/public-appearance.module.css";
import editorialStyles from "./CelebrationLanding.module.css";
import CelebrationPreview from "./CelebrationPreview";
import type { UseCaseIconId, UseCasePage } from "./category-page-data";
import GenderRevealEditorialSections from "./GenderRevealEditorialSections";
import SignupFormsEditorialSections from "./SignupFormsEditorialSections";

const iconComponents: Record<UseCaseIconId, LucideIcon> = {
  calendar: CalendarDays,
  checklist: ClipboardList,
  gift: Gift,
  heart: Heart,
  link: LinkIcon,
  map: MapPinned,
  message: MessageCircle,
  sparkles: Sparkles,
  ticket: TicketCheck,
  upload: Upload,
  users: Users,
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function UseCaseIcon({ icon, className }: { icon: UseCaseIconId; className?: string }) {
  const Icon = iconComponents[icon];
  return <Icon className={cx("h-5 w-5", className)} aria-hidden="true" />;
}

function HeroPreview({ page }: { page: UseCasePage }) {
  return (
    <CelebrationPreview
      title={page.preview.eventTitle}
      meta={page.preview.eventMeta}
      rows={page.preview.statusRows}
      chips={page.preview.chips}
    />
  );
}

function SectionEyebrow({ children }: { children: string }) {
  return (
    <p className="text-sm font-bold uppercase text-[var(--use-case-accent-dark)]">{children}</p>
  );
}

export default function UseCaseLandingView({ page }: { page: UseCasePage }) {
  const pageUrl = `https://envitefy.com${page.path}`;
  const primaryHref = "#templates";
  const templateCategory = templateCategoryForPath(page.path);
  const cssVars = {
    "--use-case-accent": page.theme.accent,
    "--use-case-accent-dark": page.theme.accentDark,
    "--use-case-accent-soft": page.theme.accentSoft,
    "--use-case-ink": page.theme.ink,
    "--use-case-surface": page.theme.surface,
  } as CSSProperties;

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
    <MarketingPage className={`${publicStyles.page} ${editorialStyles.editorial}`}>
      <SignedOutPageChrome activeBottomNavLabel="Menu" brandHref="/" />

      <main style={cssVars}>
        <MarketingHero
          category={
            page.slug === "gender-reveal" || page.slug === "signup-forms" ? page.slug : undefined
          }
          eyebrow={page.eyebrow}
          title={
            page.slug === "gender-reveal" ? (
              <>
                A little mystery.
                <br />
                <em>A moment together.</em>
              </>
            ) : page.slug === "signup-forms" ? (
              <>
                Many helping hands.
                <br />
                <em>One simple signup.</em>
              </>
            ) : (
              page.title
            )
          }
          description={
            page.slug === "gender-reveal"
              ? "Bring everyone into the moment. Your invitation, guest replies, Team Pink or Team Blue, and all the details in one beautiful page."
              : page.slug === "signup-forms"
                ? "From potluck dishes to volunteer shifts, give everyone a clear place to choose a spot. Share one link and keep the plan together."
                : page.description
          }
          image={
            page.slug === "gender-reveal"
              ? "/templates/gender-reveal/collection-2026/secret-greenhouse.webp"
              : page.slug === "signup-forms"
                ? undefined
                : page.heroImage
          }
          imageAlt={
            page.slug === "gender-reveal"
              ? "Original pastel greenhouse gender reveal invitation artwork"
              : page.heroImageAlt
          }
          primaryHref={
            page.slug === "gender-reveal"
              ? page.primaryHref
              : page.slug === "signup-forms"
                ? `${page.path}?auth=signup`
                : primaryHref
          }
          primaryLabel={
            page.slug === "gender-reveal"
              ? "Create your reveal page"
              : page.slug === "signup-forms"
                ? "Create a signup page"
                : "Browse templates"
          }
          primaryRequiresAccount={page.slug === "gender-reveal"}
          secondaryHref={page.slug === "signup-forms" ? "#how-it-works" : page.secondaryHref}
          secondaryLabel={page.slug === "signup-forms" ? "See how it works" : page.secondaryCta}
        >
          <HeroPreview page={page} />
        </MarketingHero>
        {templateCategory && <PublicTemplateGallery category={templateCategory.slug} featured />}

        {page.slug === "gender-reveal" && <GenderRevealEditorialSections page={page} />}
        {page.slug === "signup-forms" && <SignupFormsEditorialSections page={page} />}
        {page.slug !== "gender-reveal" && page.slug !== "signup-forms" && (
          <>
            <section className="relative z-[1] px-5 py-10 sm:px-8 lg:px-10">
              <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.84fr)_minmax(19rem,0.36fr)]">
                <div>
                  <SectionEyebrow>Product fit</SectionEyebrow>
                  <h2 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight sm:text-4xl">
                    {page.proofTitle}
                  </h2>
                  <p className="mt-4 max-w-3xl text-lg leading-8 text-[#5f5665]">
                    {page.proofBody}
                  </p>
                </div>
                <div className="grid content-start gap-2 rounded-lg border border-[#e2d7ca] bg-white/78 p-4 shadow-[0_20px_70px_rgba(35,25,46,0.08)]">
                  {page.audience.map((item) => (
                    <div
                      key={`${page.slug}-audience-${item}`}
                      className="flex items-center gap-3 rounded-lg bg-[var(--use-case-accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--use-case-accent-dark)]"
                    >
                      <Users className="h-4 w-4" aria-hidden="true" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="px-5 py-10 sm:px-8 lg:px-10">
              <div className="mx-auto max-w-7xl">
                <SectionEyebrow>What the page handles</SectionEyebrow>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {page.features.map((feature) => (
                    <article
                      key={`${page.slug}-feature-${feature.title}`}
                      className="rounded-lg border border-[#e2d7ca] bg-white p-5 shadow-[0_18px_52px_rgba(35,25,46,0.07)]"
                    >
                      <div
                        className="grid h-11 w-11 place-items-center rounded-lg text-white"
                        style={{ backgroundColor: page.theme.accent }}
                      >
                        <UseCaseIcon icon={feature.icon} />
                      </div>
                      <h3 className="mt-5 text-xl font-semibold leading-tight">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-[#635967]">{feature.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-white px-5 py-14 sm:px-8 lg:px-10">
              <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
                <div>
                  <SectionEyebrow>Launch path</SectionEyebrow>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                    From scattered details to one guest-ready link.
                  </h2>
                </div>
                <div className="grid gap-4">
                  {page.steps.map((step, index) => (
                    <article
                      key={`${page.slug}-step-${step.title}`}
                      className="grid gap-4 rounded-lg border border-[#e2d7ca] bg-[var(--use-case-surface)] p-5 sm:grid-cols-[4rem_minmax(0,1fr)]"
                    >
                      <div className="grid h-12 w-12 place-items-center rounded-lg bg-[var(--use-case-accent-dark)] text-lg font-bold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{step.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-[#635967]">{step.body}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="px-5 py-14 sm:px-8 lg:px-10">
              <div className="mx-auto max-w-7xl">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
                  <div>
                    <SectionEyebrow>Questions</SectionEyebrow>
                    <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                      Details guests and organizers ask before sharing.
                    </h2>
                  </div>
                  <div className="grid gap-3">
                    {page.faqs.map((faq) => (
                      <article
                        key={`${page.slug}-faq-${faq.question}`}
                        className="rounded-lg border border-[#e2d7ca] bg-white p-5"
                      >
                        <h3 className="text-lg font-semibold">{faq.question}</h3>
                        <p className="mt-2 text-sm leading-7 text-[#635967]">{faq.answer}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="px-5 pb-20 sm:px-8 lg:px-10">
              <div className="mx-auto max-w-7xl overflow-hidden rounded-lg bg-[var(--use-case-accent-dark)] px-6 py-10 text-white shadow-[0_26px_80px_rgba(31,20,44,0.18)] sm:px-10">
                <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    <p className="text-sm font-bold uppercase text-white/64">{page.eyebrow}</p>
                    <h2 className="mt-3 text-3xl font-semibold leading-tight">
                      Give guests one page they can actually use.
                    </h2>
                  </div>
                  <Link
                    href={primaryHref}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#17111e] transition hover:-translate-y-0.5"
                  >
                    Browse templates
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <Script id={`ld-use-case-webpage-${page.slug}`} type="application/ld+json">
        {JSON.stringify(webPageLd)}
      </Script>
      <Script id={`ld-use-case-faq-${page.slug}`} type="application/ld+json">
        {JSON.stringify(faqLd)}
      </Script>
    </MarketingPage>
  );
}
