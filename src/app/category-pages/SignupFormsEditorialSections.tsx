import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Link as LinkIcon,
  PackageCheck,
  QrCode,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { UseCasePage } from "./category-page-data";

const useCases = [
  {
    src: "/images/landing/signup-forms/signup-editorial-potluck.webp",
    alt: "Friends arriving with dishes for a community potluck",
    label: "Potlucks",
    title: "Every dish accounted for",
    body: "Set quantities, avoid duplicates, and let everyone see what the table still needs.",
  },
  {
    src: "/images/landing/signup-forms/signup-editorial-team.webp",
    alt: "Parents organizing snacks and water at a youth soccer field",
    label: "Teams",
    title: "The whole season covered",
    body: "Rotate snacks, rides, equipment, and volunteer duties without another group-chat spreadsheet.",
  },
  {
    src: "/images/landing/signup-forms/signup-editorial-fundraiser.webp",
    alt: "Volunteers preparing baskets for a community fundraiser",
    label: "Fundraisers",
    title: "More hands, less chasing",
    body: "Publish shifts and supply needs, cap each slot, and know exactly where help is still needed.",
  },
] as const;

function SignupBoardPreview({ compact = false }: { compact?: boolean }) {
  const rows = [
    { label: "Welcome booth", claimed: 4, total: 4, tone: "bg-emerald-500" },
    { label: "Cake walk", claimed: 3, total: 4, tone: "bg-[#6b7ee8]" },
    { label: "Clean-up crew", claimed: 1, total: 4, tone: "bg-amber-500" },
  ];

  return (
    <div
      className={`overflow-hidden border border-white/22 bg-[#172044]/88 text-white shadow-[0_34px_100px_rgba(8,14,41,0.4)] backdrop-blur-xl ${
        compact ? "rounded-[1.8rem] p-5 sm:p-6" : "rounded-[2rem] p-5 sm:p-7"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#aebcff]">
            Live signup
          </p>
          <h2 className="mt-2 text-2xl font-semibold !text-white sm:text-3xl">Spring Carnival</h2>
          <p className="mt-1.5 text-xs text-white/52">Saturday · 10:00 AM–3:00 PM</p>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/9">
          <ClipboardList className="h-5 w-5 text-[#b9c4ff]" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between border-y border-white/12 py-4">
        <div>
          <p className="text-3xl font-semibold">31</p>
          <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/42">
            claimed
          </p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-semibold text-[#f2c27b]">14</p>
          <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/42">
            still open
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold">4</p>
          <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/42">
            lists
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {rows.map((row) => {
          const complete = row.claimed === row.total;
          return (
            <div key={row.label} className="rounded-2xl bg-white/7 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {complete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  ) : (
                    <Clock3 className="h-4 w-4 text-white/38" aria-hidden="true" />
                  )}
                  <span className="text-sm font-semibold">{row.label}</span>
                </div>
                <span className="text-xs font-bold text-white/55">
                  {row.claimed}/{row.total}
                </span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${row.tone}`}
                  style={{ width: `${(row.claimed / row.total) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#18214d]"
      >
        Claim a spot
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function SignupFormsHeroContent({ page }: { page: UseCasePage }) {
  const createHref = `${page.path}?auth=signup`;

  return (
    <div className="relative z-[1] mx-auto grid w-full max-w-7xl items-end gap-10 px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-32 sm:px-8 md:pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.54fr)] lg:px-10">
      <div className="max-w-4xl text-white">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/24 bg-black/15 px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-[#c6d0ff]" aria-hidden="true" />
          Signups without spreadsheet cleanup
        </div>
        <h1 className="mt-6 max-w-4xl text-[3rem] font-semibold leading-[0.98] !text-white drop-shadow-[0_5px_28px_rgba(0,0,0,0.5)] sm:text-6xl lg:text-[5rem]">
          Put every slot, shift, and needed item in one beautiful place.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-white/88 drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] sm:text-lg sm:leading-8">
          Create a polished signup page, share one link, and always know what is filled, what is
          open, and who to remind.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={createHref}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#18214d] shadow-[0_22px_54px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5"
          >
            Create a signup form
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={page.secondaryHref}
            className="inline-flex min-h-12 items-center rounded-full border border-white/32 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/18"
          >
            See how it works
          </Link>
        </div>
        <div className="mt-9 flex max-w-xl items-center divide-x divide-white/22">
          {[
            ["31", "claimed"],
            ["14", "open slots"],
            ["4", "active lists"],
          ].map(([value, label], index) => (
            <div key={label} className={index === 0 ? "pr-6" : "px-6"}>
              <p className="text-2xl font-semibold leading-none text-white sm:text-3xl">{value}</p>
              <p className="mt-1.5 text-[0.62rem] font-bold uppercase tracking-[0.17em] text-white/60">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden w-full max-w-[25rem] justify-self-end md:block">
        <SignupBoardPreview compact />
      </div>
    </div>
  );
}

export default function SignupFormsEditorialSections({ page }: { page: UseCasePage }) {
  const createHref = `${page.path}?auth=signup`;

  return (
    <>
      <section className="overflow-hidden bg-[#f8f9ff] px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#3c55ad]">
              Coordination people enjoy using
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.06] text-[#171b33] sm:text-5xl lg:text-6xl">
              Organize the help. Keep the human part.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#626983]">
              No dense spreadsheet. No endless “what can I bring?” messages. Just a clear, welcoming
              page that moves people from willing to signed up.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[#dfe4f5] pt-7">
              {[
                [Clock3, "Time slots and shifts"],
                [PackageCheck, "Items and quantities"],
                [Bell, "Updates and reminders"],
                [LinkIcon, "One shareable link"],
              ].map(([Icon, label]) => {
                const FeatureIcon = Icon as typeof Clock3;
                return (
                  <div
                    key={String(label)}
                    className="flex items-center gap-3 text-sm font-semibold"
                  >
                    <FeatureIcon className="h-4 w-4 text-[#5270d7]" aria-hidden="true" />
                    {String(label)}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative min-h-[36rem] sm:min-h-[43rem]">
            <div className="absolute left-0 top-0 h-[74%] w-[70%] overflow-hidden rounded-[2rem]">
              <Image
                src="/images/landing/signup-forms/signup-editorial-carnival-prep.webp"
                alt="Volunteers preparing a school carnival"
                fill
                sizes="(max-width: 1024px) 70vw, 40vw"
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 h-[53%] w-[58%] overflow-hidden rounded-[2rem] border-[0.65rem] border-[#f8f9ff]">
              <Image
                src="/images/landing/signup-forms/signup-editorial-supplies.webp"
                alt="Organized supplies for a community event"
                fill
                sizes="(max-width: 1024px) 58vw, 32vw"
                className="object-cover"
              />
            </div>
            <div className="absolute right-[2%] top-[8%] max-w-[14rem] rounded-2xl bg-white/94 p-4 shadow-[0_24px_60px_rgba(31,41,88,0.16)] backdrop-blur">
              <p className="text-2xl font-semibold text-[#202747]">31 people in</p>
              <p className="mt-1 text-xs font-semibold text-[#77809d]">
                and 14 opportunities still open
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#121a3a] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-10">
        <Image
          src="/images/landing/signup-forms/signup-editorial-coordination.webp"
          alt=""
          fill
          sizes="100vw"
          className="-z-20 object-cover opacity-35"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#111936] via-[#111936]/94 to-[#111936]/58" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,0.66fr)]">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#aebcff]">
              Clarity at a glance
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] !text-white sm:text-5xl lg:text-6xl">
              See what is covered before asking again.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/68">
              Limits close full slots automatically. Live counts show what still needs attention.
              Reminders go to the right people—not the entire group.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {["Set capacity", "Prevent duplicates", "Send targeted reminders"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/18 bg-white/8 px-4 py-2 text-sm font-semibold text-white/82"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <SignupBoardPreview />
        </div>
      </section>

      <section className="bg-[#eef2ff] px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#3c55ad]">
              One flexible form
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight text-[#171b33] sm:text-5xl">
              Ready for however your people show up.
            </h2>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {useCases.map((useCase, index) => (
              <article
                key={useCase.label}
                className={index === 1 ? "lg:translate-y-10" : undefined}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
                  <Image
                    src={useCase.src}
                    alt={useCase.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition duration-700 hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111936]/90 via-[#111936]/8 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.23em] text-white/68">
                      0{index + 1} · {useCase.label}
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold !text-white">{useCase.title}</h3>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-white/85">{useCase.body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9ff] px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.8fr)]">
          <div className="relative min-h-[34rem] overflow-hidden rounded-[2.25rem]">
            <Image
              src="/images/landing/signup-forms/signup-editorial-checkin.webp"
              alt="Volunteers welcoming families at community event check-in"
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111936]/82 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/65">
                From link to real life
              </p>
              <p className="mt-3 max-w-lg text-3xl font-semibold leading-tight !text-white sm:text-4xl">
                The right people. The right place. Everything covered.
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#3c55ad]">
              Built for organizers
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight text-[#171b33] sm:text-5xl">
              Share once. Stay organized as plans change.
            </h2>
            <div className="mt-8 divide-y divide-[#dfe4f5] border-y border-[#dfe4f5]">
              {[
                [ClipboardList, "Start with a structure that already makes sense"],
                [Users, "Collect names, quantities, and notes"],
                [QrCode, "Share by link or QR code"],
                [Bell, "Update the page and remind only who needs it"],
              ].map(([Icon, text]) => {
                const ItemIcon = Icon as typeof ClipboardList;
                return (
                  <div key={String(text)} className="flex items-center gap-4 py-5">
                    <ItemIcon className="h-5 w-5 text-[#5270d7]" aria-hidden="true" />
                    <p className="text-xl font-semibold text-[#252b49]">{String(text)}</p>
                  </div>
                );
              })}
            </div>
            <Link
              href={createHref}
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#18214d] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_50px_rgba(24,33,77,0.22)] transition hover:-translate-y-0.5"
            >
              Create your signup form
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#eef2ff] px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1fr)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#3c55ad]">
              Good to know
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight text-[#171b33] sm:text-5xl">
              Signup questions, answered.
            </h2>
          </div>
          <div className="divide-y divide-[#ccd5f0] border-y border-[#ccd5f0]">
            {page.faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold text-[#252b49]">
                  {faq.question}
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-[#6577c7] transition group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="max-w-2xl pb-1 pt-4 leading-7 text-[#68708b]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative isolate min-h-[34rem] overflow-hidden bg-cover bg-center px-5 py-24 sm:px-8 lg:px-10"
        style={{
          backgroundImage: "url('/images/landing/signup-forms/signup-editorial-community.webp')",
        }}
      >
        <div className="absolute inset-0 -z-10 bg-[#101733]/68" />
        <div className="mx-auto flex min-h-[22rem] max-w-4xl flex-col items-center justify-center text-center text-white">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-white/60">
            Bring the plan together
          </p>
          <h2 className="mt-5 text-4xl font-semibold leading-tight !text-white sm:text-6xl">
            Make it easy for people to help.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76">
            Create the signup, share one link, and let Envitefy keep every commitment organized.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={createHref}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#18214d] transition hover:-translate-y-0.5"
            >
              Create a signup form
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={page.secondaryHref}
              className="inline-flex min-h-12 items-center rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur"
            >
              Read the signup guide
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
