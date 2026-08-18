import {
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { UseCasePage } from "./category-page-data";

const moments = [
  {
    src: "/images/landing/gender-reveal/gender-reveal-editorial-plan.webp",
    alt: "Host preparing elegant gender reveal party details",
    label: "Plan",
    title: "Set the scene",
    body: "Share the date, place, dress cue, parking, gifts, and reveal plan without a thread of follow-up texts.",
  },
  {
    src: "/images/landing/gender-reveal/gender-reveal-editorial-gather.webp",
    alt: "Friends and family gathering around the parents-to-be",
    label: "Gather",
    title: "Count every guest",
    body: "RSVPs, party size, gift notes, calendar saves, and Team Pink or Team Blue arrive in one guest flow.",
  },
  {
    src: "/images/landing/gender-reveal/gender-reveal-editorial-moment.webp",
    alt: "Parents-to-be reacting during the gender reveal moment",
    label: "Reveal",
    title: "Keep the memory",
    body: "Flip the same page to the result after the moment. The tally, photos, and thank-you notes stay together.",
  },
] as const;

export function GenderRevealHeroContent({ page }: { page: UseCasePage }) {
  return (
    <div className="relative z-[1] mx-auto grid w-full max-w-7xl items-end gap-10 px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-32 sm:px-8 md:pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.54fr)] lg:px-10">
      <div className="max-w-4xl text-white">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/24 bg-black/15 px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-[#ffd1e2]" aria-hidden="true" />
          One link. One unforgettable moment.
        </div>
        <h1 className="mt-6 max-w-4xl font-serif text-[3rem] font-medium leading-[0.98] !text-white drop-shadow-[0_5px_28px_rgba(0,0,0,0.5)] sm:text-6xl lg:text-[5.2rem]">
          Every RSVP. Every guess. All the way to the reveal.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-white/88 drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] sm:text-lg sm:leading-8">
          A beautiful party page that keeps the invitation, Team Pink or Team Blue, guest counts,
          gifts, maps, and updates together.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={page.primaryHref}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#241b29] shadow-[0_22px_54px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5"
          >
            Create your reveal page
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={page.secondaryHref}
            className="inline-flex min-h-12 items-center rounded-full border border-white/32 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/18"
          >
            Upload your invitation
          </Link>
        </div>

        <div className="mt-9 flex max-w-xl items-center divide-x divide-white/22">
          {[
            ["54", "coming"],
            ["49", "guesses"],
            ["8", "pending"],
          ].map(([value, label], index) => (
            <div key={label} className={index === 0 ? "pr-6" : "px-6"}>
              <p className="font-serif text-2xl leading-none text-white sm:text-3xl">{value}</p>
              <p className="mt-1.5 text-[0.62rem] font-bold uppercase tracking-[0.17em] text-white/60">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden justify-self-end md:block">
        <div className="w-full max-w-[25rem] overflow-hidden rounded-[2rem] border border-white/25 bg-[#21182c]/78 p-5 text-white shadow-[0_34px_100px_rgba(10,5,17,0.42)] backdrop-blur-xl sm:p-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-white/52">
                Saturday · September 12
              </p>
              <h2 className="mt-2 font-serif text-3xl !text-white">Little Spark Reveal</h2>
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-white/62">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                Cedar Park Pavilion · 2:00 PM
              </div>
            </div>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10">
              <Heart className="h-4 w-4 text-[#f3b6cf]" aria-hidden="true" />
            </div>
          </div>

          <div className="my-5 h-px bg-white/13" />

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#f1abc7]">
                Team Pink
              </p>
              <p className="mt-1 font-serif text-4xl">28</p>
            </div>
            <div className="pb-1 text-center">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-white/38">
                Live guesses
              </p>
              <p className="mt-1 text-sm font-semibold text-white/72">49 total</p>
            </div>
            <div className="text-right">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#acd5fb]">
                Team Blue
              </p>
              <p className="mt-1 font-serif text-4xl">21</p>
            </div>
          </div>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="w-[57%] bg-gradient-to-r from-[#d66796] to-[#f1abc7]" />
            <div className="w-[43%] bg-gradient-to-r from-[#acd5fb] to-[#619ed7]" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold text-[#251b2d]">
              RSVP
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/8 px-4 py-3 text-center text-sm font-bold text-white">
              Add to calendar
            </div>
          </div>
          <p className="mt-4 text-center text-[0.65rem] font-semibold text-white/44">
            Guest counts update as replies come in
          </p>
        </div>
      </div>
    </div>
  );
}

function ScoreboardPreview() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-[#21182c]/92 p-5 text-white shadow-[0_36px_100px_rgba(33,24,44,0.34)] backdrop-blur-xl sm:p-7">
      <div className="flex items-center justify-between border-b border-white/15 pb-5">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-white/55">
            The little spark reveal
          </p>
          <p className="mt-2 font-serif text-2xl">He or she?</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-full bg-white/10">
          <Sparkles className="h-5 w-5 text-[#f4bfd5]" aria-hidden="true" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 py-5 text-center">
        {[
          ["54", "coming"],
          ["8", "pending"],
          ["49", "guesses"],
        ].map(([value, label]) => (
          <div key={label}>
            <p className="font-serif text-3xl">{value}</p>
            <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white/50">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-white/8 p-4">
        <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em]">
          <span className="text-[#f5bfd5]">Team Pink · 28</span>
          <span className="text-[#b9dcff]">21 · Team Blue</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
          <div className="w-[57%] bg-gradient-to-r from-[#d9699a] to-[#f4a8c5]" />
          <div className="w-[43%] bg-gradient-to-r from-[#9dccf8] to-[#5d9bd6]" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/12 bg-white/6 px-4 py-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-300/15">
          <Check className="h-4 w-4 text-emerald-200" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold">RSVP saved · Team Pink</p>
          <p className="mt-0.5 text-xs text-white/48">The host count updated instantly.</p>
        </div>
      </div>
    </div>
  );
}

export default function GenderRevealEditorialSections({ page }: { page: UseCasePage }) {
  return (
    <>
      <section className="overflow-hidden bg-[#fffaf7] px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a25b78]">
              More than an invitation
            </p>
            <h2 className="mt-5 font-serif text-4xl leading-[1.05] text-[#241b29] sm:text-5xl lg:text-6xl">
              The anticipation deserves its own place.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#6b5d68]">
              A beautiful page for the people you love—and a calm command center for the people
              making the day happen.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[#eadbd7] pt-7">
              {[
                [Users, "Live RSVPs"],
                [Heart, "Pink or blue guesses"],
                [CalendarDays, "One-tap calendar"],
                [Gift, "Registry and notes"],
              ].map(([Icon, label]) => {
                const FeatureIcon = Icon as typeof Users;
                return (
                  <div
                    key={String(label)}
                    className="flex items-center gap-3 text-sm font-semibold"
                  >
                    <FeatureIcon className="h-4 w-4 text-[#b56182]" aria-hidden="true" />
                    {String(label)}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative min-h-[36rem] sm:min-h-[43rem]">
            <div className="absolute left-0 top-0 h-[72%] w-[71%] overflow-hidden rounded-[2rem]">
              <Image
                src="/images/landing/gender-reveal/gender-reveal-editorial-arrival.webp"
                alt="Elegant gender reveal party entrance"
                fill
                sizes="(max-width: 1024px) 70vw, 40vw"
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 h-[54%] w-[57%] overflow-hidden rounded-[2rem] border-[0.65rem] border-[#fffaf7]">
              <Image
                src="/images/landing/gender-reveal/gender-reveal-editorial-details.webp"
                alt="Gender reveal cake and dessert details"
                fill
                sizes="(max-width: 1024px) 55vw, 32vw"
                className="object-cover"
              />
            </div>
            <div className="absolute right-[3%] top-[8%] max-w-[13rem] rounded-2xl bg-white/92 p-4 shadow-[0_24px_60px_rgba(66,45,60,0.18)] backdrop-blur">
              <p className="font-serif text-2xl text-[#332638]">49 guesses</p>
              <p className="mt-1 text-xs font-semibold text-[#8a7583]">
                and everyone is counting down
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#251b2e] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-10">
        <Image
          src="/images/landing/gender-reveal/gender-reveal-editorial-anticipation.webp"
          alt=""
          fill
          sizes="100vw"
          className="-z-20 object-cover opacity-25"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#24192e] via-[#24192e]/95 to-[#24192e]/55" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,0.66fr)]">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#efb6ce]">
              The signature Envitefy moment
            </p>
            <h2 className="mt-5 font-serif text-4xl leading-[1.05] !text-white sm:text-5xl lg:text-6xl">
              Let the guest list become part of the fun.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/67">
              A yes RSVP invites a pick. Maybe guests can join in. Declines can still leave a gift
              note. You decide when the room gets to see the score.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {["Show it live", "Hide until the reveal", "Lock at the deadline"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/18 bg-white/8 px-4 py-2 text-sm font-semibold text-white/82"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <ScoreboardPreview />
        </div>
      </section>

      <section className="bg-[#f8efe9] px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a25b78]">
              One page, before and after
            </p>
            <h2 className="mt-5 font-serif text-4xl leading-tight text-[#241b29] sm:text-5xl">
              From the first hint to the happy tears.
            </h2>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {moments.map((moment, index) => (
              <article key={moment.label} className={index === 1 ? "lg:translate-y-10" : undefined}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
                  <Image
                    src={moment.src}
                    alt={moment.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition duration-700 hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/64 via-black/4 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.23em] text-white/65">
                      0{index + 1} · {moment.label}
                    </p>
                    <h3 className="mt-3 font-serif text-3xl !text-white">{moment.title}</h3>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-white/85">{moment.body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf7] px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.8fr)]">
          <div className="relative min-h-[34rem] overflow-hidden rounded-[2.25rem]">
            <Image
              src="/images/landing/gender-reveal/gender-reveal-editorial-table.webp"
              alt="Elegant outdoor gender reveal dinner table"
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#231a2b]/76 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/65">
                One link for every guest
              </p>
              <p className="mt-3 max-w-lg font-serif text-3xl leading-tight sm:text-4xl">
                Invite, map, registry, reminders, and the result.
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a25b78]">
              Thoughtful by design
            </p>
            <h2 className="mt-5 font-serif text-4xl leading-tight text-[#241b29] sm:text-5xl">
              Less chasing. More celebrating.
            </h2>
            <div className="mt-8 divide-y divide-[#eadbd7] border-y border-[#eadbd7]">
              {[
                [MapPin, "Guests always know where to go"],
                [CalendarDays, "The date saves in one tap"],
                [MessageCircle, "Rain plans and updates stay current"],
                [Gift, "Gift links and notes live beside the invite"],
              ].map(([Icon, text]) => {
                const ItemIcon = Icon as typeof MapPin;
                return (
                  <div key={String(text)} className="flex items-center gap-4 py-5">
                    <ItemIcon className="h-5 w-5 text-[#b56182]" aria-hidden="true" />
                    <p className="font-serif text-xl text-[#3b2d3c]">{String(text)}</p>
                  </div>
                );
              })}
            </div>
            <Link
              href={page.primaryHref}
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#2b1748] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_50px_rgba(43,23,72,0.2)] transition hover:-translate-y-0.5"
            >
              {page.primaryCta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="reveal-start"
        className="scroll-mt-20 bg-[#fffaf7] px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a25b78]">
              Two ways to start
            </p>
            <h2 className="mt-5 font-serif text-4xl leading-tight text-[#241b29] sm:text-5xl">
              SNAP the invite. Or tell Envitefy Concierge.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#6b5d68]">
              Photograph the card you already printed, or describe the reveal in a message.
              Envitefy turns that into a live page with RSVPs, guesses, gifts, and the plan.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <article className="rounded-[2rem] border border-[#eadbd7] bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f8efe9] text-[#b56182]">
                  <Camera className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a25b78]">
                    SNAP
                  </p>
                  <h3 className="font-serif text-3xl text-[#241b29]">Upload the invitation</h3>
                </div>
              </div>
              <p className="mt-4 leading-7 text-[#6b5d68]">
                SNAP reads the date, time, place, and host notes from a photo, screenshot, or
                flyer. You review the draft, then share one guest link instead of a blurry image.
              </p>
              <div className="mt-6 rounded-[1.5rem] bg-[#f8efe9] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a25b78]">
                  Extracted from the invite
                </p>
                <p className="mt-2 font-serif text-2xl text-[#241b29]">Little Spark Reveal</p>
                <p className="mt-1 text-sm text-[#6b5d68]">Saturday · September 12 · 2:00 PM</p>
                <div className="mt-4 grid gap-2 text-sm">
                  {[
                    ["Where", "Cedar Park Pavilion"],
                    ["Next", "Review, then share"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
                    >
                      <span className="text-[#8a7583]">{label}</span>
                      <span className="font-semibold text-[#241b29]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link
                href="/snap?auth=signup"
                className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#8a3d5d] underline decoration-[#d7a8b8] underline-offset-8"
              >
                Try SNAP
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>

            <article className="rounded-[2rem] bg-[#251b2e] p-6 text-white sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f3b6cf] text-[#251b2e]">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#efb6ce]">
                    Envitefy Concierge
                  </p>
                  <h3 className="font-serif text-3xl !text-white">Describe the reveal</h3>
                </div>
              </div>
              <p className="mt-4 leading-7 text-white/68">
                Tell Concierge who it is for, when, and where. It collects missing details, then
                drafts the invitation, Team Pink or Team Blue, RSVP, and guest page.
              </p>
              <div className="mt-6 space-y-3">
                <div className="ml-8 rounded-2xl rounded-tr-md bg-white px-4 py-3 text-sm leading-6 text-[#241b29]">
                  Saturday reveal at Cedar Park, 2 PM. RSVP plus Team Pink or Team Blue, please.
                </div>
                <div className="mr-2 flex gap-2">
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f3b6cf] text-[#251b2e]">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="rounded-2xl rounded-tl-md bg-white/10 px-4 py-3 text-sm leading-6 text-white/88">
                    I&apos;ll draft the reveal page with live RSVPs, guesses, gifts, and the plan.
                    You can hide the tally until the moment.
                  </div>
                </div>
              </div>
              <Link
                href="/chat"
                className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#f3b6cf] underline decoration-[#f3b6cf]/40 underline-offset-8"
              >
                Ask Envitefy Concierge
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-[#f8efe9] px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1fr)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a25b78]">
              Good to know
            </p>
            <h2 className="mt-5 font-serif text-4xl leading-tight text-[#241b29] sm:text-5xl">
              Your party, answered.
            </h2>
          </div>
          <div className="divide-y divide-[#dfcec8] border-y border-[#dfcec8]">
            {page.faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold text-[#342836]">
                  {faq.question}
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-[#9b6d80] transition group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="max-w-2xl pb-1 pt-4 leading-7 text-[#6f606b]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative isolate min-h-[34rem] overflow-hidden bg-cover bg-center px-5 py-24 sm:px-8 lg:px-10"
        style={{
          backgroundImage:
            "url('/images/landing/gender-reveal/gender-reveal-editorial-celebration.webp')",
        }}
      >
        <div className="absolute inset-0 -z-10 bg-[#201628]/65" />
        <div className="mx-auto flex min-h-[22rem] max-w-4xl flex-col items-center justify-center text-center text-white">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-white/60">
            Ready when you are
          </p>
          <h2 className="mt-5 font-serif text-4xl leading-tight !text-white sm:text-6xl">
            Make the wait feel magical.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
            Build your reveal page, share one link, and let Envitefy keep count.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={page.primaryHref}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#241b29] transition hover:-translate-y-0.5"
            >
              Create your reveal page
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={page.secondaryHref}
              className="inline-flex min-h-12 items-center rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur"
            >
              Upload an invitation
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
