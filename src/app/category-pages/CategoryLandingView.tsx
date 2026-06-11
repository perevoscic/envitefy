import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Gift,
  Heart,
  Link as LinkIcon,
  MapPinned,
  MessageCircle,
  Sparkles,
  TicketCheck,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import type { CSSProperties } from "react";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import type { UseCaseIconId, UseCasePage } from "./category-page-data";

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
    <div className="relative w-full max-w-[28rem] justify-self-end overflow-hidden rounded-lg border border-white/22 bg-white/90 p-4 text-[#18131f] shadow-[0_30px_90px_rgba(9,4,19,0.34)] backdrop-blur-xl sm:p-5">
      <div className="flex items-start justify-between gap-4 border-b border-[#e5ded6] pb-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-[#6e6276]">{page.eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold leading-tight text-[#17111e]">
            {page.preview.eventTitle}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#6b6070]">{page.preview.eventMeta}</p>
        </div>
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-lg text-white shadow-[0_14px_30px_rgba(18,13,28,0.22)]"
          style={{ backgroundColor: page.theme.accent }}
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {page.preview.statusRows.map((row) => (
          <div
            key={`${page.slug}-${row.label}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#ece5dc] bg-[#fffaf5] px-3 py-2"
          >
            <span className="text-sm font-medium text-[#665d68]">{row.label}</span>
            <span className="text-sm font-bold text-[#1e1725]">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {page.preview.chips.map((chip) => (
          <span
            key={`${page.slug}-${chip}`}
            className="inline-flex items-center gap-1 rounded-full border border-[#e8ded2] bg-white px-3 py-1 text-xs font-semibold text-[#312438]"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionEyebrow({ children }: { children: string }) {
  return (
    <p className="text-sm font-bold uppercase text-[var(--use-case-accent-dark)]">{children}</p>
  );
}

export default function UseCaseLandingView({ page }: { page: UseCasePage }) {
  const pageUrl = `https://envitefy.com${page.path}`;
  const primaryHref = `${page.path}?auth=signup`;
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
    <div style={cssVars} className="min-h-screen bg-[var(--use-case-surface)] text-[var(--use-case-ink)]">
      <SignedOutPageChrome
        activeBottomNavLabel="Menu"
        brandHref="/"
        topNavVariant="transparent-dark"
      />

      <main>
        <section className="relative isolate flex min-h-[92svh] items-end overflow-hidden">
          <Image
            src={page.heroImage}
            alt={page.heroImageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: page.heroImagePosition ?? "center" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,7,14,0.84)_0%,rgba(10,7,14,0.62)_44%,rgba(10,7,14,0.24)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,var(--use-case-surface))]" />

          <div className="relative z-[1] mx-auto grid w-full max-w-7xl items-end gap-10 px-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-32 sm:px-8 md:pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,0.48fr)] lg:px-10">
            <div className="max-w-4xl text-white">
              <p className="text-sm font-bold uppercase text-white/76">{page.eyebrow}</p>
              <h1 className="mt-5 max-w-4xl text-[2.65rem] font-semibold leading-[1.03] !text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)] sm:text-6xl lg:text-7xl">
                {page.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/82 sm:text-xl sm:leading-8">
                {page.description}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={primaryHref}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#17111e] shadow-[0_22px_54px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5"
                >
                  {page.primaryCta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={page.secondaryHref}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/28 bg-white/12 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/18"
                >
                  {page.secondaryCta}
                </Link>
              </div>
              <div className="mt-8 hidden max-w-2xl grid-cols-3 gap-2 sm:grid sm:gap-3">
                {page.stats.map((stat) => (
                  <div
                    key={`${page.slug}-hero-stat-${stat.label}`}
                    className="rounded-lg border border-white/20 bg-white/12 px-3 py-3 backdrop-blur-md"
                  >
                    <p className="text-2xl font-semibold leading-none text-white">{stat.value}</p>
                    <p className="mt-1 text-xs font-semibold uppercase text-white/68">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden md:block">
              <HeroPreview page={page} />
            </div>
          </div>
        </section>

        <section className="relative z-[1] px-5 py-10 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.84fr)_minmax(19rem,0.36fr)]">
            <div>
              <SectionEyebrow>Product fit</SectionEyebrow>
              <h2 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight sm:text-4xl">
                {page.proofTitle}
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-[#5f5665]">{page.proofBody}</p>
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
                href={page.primaryHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#17111e] transition hover:-translate-y-0.5"
              >
                {page.primaryCta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Script id={`ld-use-case-webpage-${page.slug}`} type="application/ld+json">
        {JSON.stringify(webPageLd)}
      </Script>
      <Script id={`ld-use-case-faq-${page.slug}`} type="application/ld+json">
        {JSON.stringify(faqLd)}
      </Script>
    </div>
  );
}
