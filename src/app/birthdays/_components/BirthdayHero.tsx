import { ArrowRight, CalendarDays, Check, MapPin, Users } from "lucide-react";
import Link from "next/link";
import LandingHeroMedia from "@/components/landing/LandingHeroMedia";
import { landingHeroGalleries } from "@/lib/landing-hero-galleries";
import type { UseCasePage } from "../../category-pages/category-page-data";

function BirthdayHeroPreview({ page }: { page: UseCasePage }) {
  return (
    <aside className="w-full max-w-[25rem] overflow-hidden rounded-[1.75rem] border border-white/35 bg-white/92 text-[#2d211c] shadow-[0_30px_90px_rgba(12,7,5,0.32)] backdrop-blur-xl">
      <div className="border-b border-[#eadfd8] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--birthday-accent)]">
            Live birthday page
          </p>
          <span className="rounded-full bg-[#e6f3e9] px-2.5 py-1 text-[10px] font-bold text-[#2e6a48]">
            RSVP OPEN
          </span>
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">
          {page.preview.eventTitle}
        </h2>
        <p className="mt-2 text-sm text-[#74645b]">{page.preview.eventMeta}</p>
      </div>

      <div className="grid gap-3 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#fff1e8] p-3">
            <Users className="h-4 w-4 text-[var(--birthday-accent)]" aria-hidden="true" />
            <p className="mt-3 text-2xl font-semibold">16</p>
            <p className="text-xs text-[#806d62]">families joining</p>
          </div>
          <div className="rounded-2xl bg-[#edf4ed] p-3">
            <CalendarDays className="h-4 w-4 text-[#3c6c4f]" aria-hidden="true" />
            <p className="mt-3 text-2xl font-semibold">40</p>
            <p className="text-xs text-[#667168]">party headcount</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#eadfd8] px-3.5 py-3 text-sm">
          <MapPin className="h-4 w-4 shrink-0 text-[var(--birthday-accent)]" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-[#74645b]">Directions and pickup details</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </aside>
  );
}

export default function BirthdayHero({
  page,
  primaryHref,
}: {
  page: UseCasePage;
  primaryHref: string;
}) {
  return (
    <section className="relative isolate flex min-h-[96svh] items-end overflow-hidden">
      <LandingHeroMedia images={landingHeroGalleries.birthdays} />
      <div className="relative z-[1] mx-auto grid w-full max-w-7xl items-end gap-12 px-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-32 sm:px-8 md:pb-16 lg:grid-cols-[minmax(0,1fr)_25rem] lg:px-10">
        <div className="max-w-4xl text-white">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
            {page.eyebrow}
          </p>
          <h1 className="mt-5 max-w-4xl text-[2.65rem] font-semibold leading-[1.02] tracking-[-0.045em] !text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] sm:text-6xl lg:text-7xl">
            {page.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:text-xl sm:leading-8">
            {page.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={primaryHref}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#21170f] shadow-[0_22px_54px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5"
            >
              {page.primaryCta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="#birthday-prompt-studio"
              className="inline-flex min-h-12 items-center rounded-full border border-white/35 bg-black/15 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-black/25"
            >
              See what a prompt creates
            </Link>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-white/88">
            {["No app for guests", "Household headcounts", "Updates stay live"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white/18">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden lg:block">
          <BirthdayHeroPreview page={page} />
        </div>
      </div>
    </section>
  );
}
