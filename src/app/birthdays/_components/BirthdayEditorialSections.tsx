import {
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  MapPin,
  MessageCircle,
  Sparkles,
  Users,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { UseCasePage } from "../../category-pages/category-page-data";
import {
  birthdayFinalImage,
  birthdayGuestRows,
  birthdayHostStats,
  birthdayInvitationBackdrop,
  birthdayMilestones,
  birthdaySetupSteps,
} from "../birthday-landing-data";
import BirthdayInvitationDemo from "./BirthdayInvitationDemo";
import BirthdayPromptStudio from "./BirthdayPromptStudio";
import BirthdaySectionIntro from "./BirthdaySectionIntro";

function PromptCreation({ primaryHref }: { primaryHref: string }) {
  return (
    <section
      id="birthday-prompt-studio"
      className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <BirthdaySectionIntro
          eyebrow="From words to wow"
          title="Describe the birthday. See the invitation take shape."
          body="There is no fixed catalog to search. Tell Envitefy who you are celebrating, what they love, and how the party should feel. The visual direction is created from that prompt."
        />
        <BirthdayPromptStudio primaryHref={primaryHref} />
      </div>
    </section>
  );
}

function InvitationExperience({ primaryHref }: { primaryHref: string }) {
  const features = [
    {
      icon: Users,
      title: "Household RSVP",
      body: "Kids, adults, and allergy notes stay with the right family.",
    },
    {
      icon: MapPin,
      title: "Arrival without confusion",
      body: "Share the correct entrance, parking, and pickup instructions.",
    },
    {
      icon: CalendarDays,
      title: "One always-current link",
      body: "Change a time or rain plan without sending a new invitation.",
    },
  ] as const;

  return (
    <section
      id="birthday-live-page"
      className="scroll-mt-20 bg-[#f4ebe4] px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <BirthdaySectionIntro
            eyebrow="From invitation to Live Card"
            title="Tell it what the party page should do."
            body="The same visual direction becomes a useful Live Card. Add the guest experience in plain language, then preview exactly what families will receive."
          />
          <div className="mt-8 rounded-[1.75rem] bg-white p-5 shadow-[0_16px_45px_rgba(73,48,34,0.08)]">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--birthday-accent)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Live Card prompt
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--birthday-ink)]">
              “Turn Maya&apos;s invitation into a Live Card. Ask each family for kids, adults, and
              allergy notes. Add the east entrance, 3:50 pickup, our gift note, and calendar save.”
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#3c6c4f]">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Interactive card created
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-8 grid gap-6">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[var(--birthday-accent)] shadow-sm">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-[var(--birthday-ink)]">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--birthday-muted)]">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[44rem] overflow-hidden rounded-[2.5rem]">
          <Image
            src={birthdayInvitationBackdrop}
            alt="Colorful birthday party prepared at a park pavilion"
            fill
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/48 via-black/8 to-transparent" />
          <div className="absolute inset-x-4 bottom-4 sm:bottom-8 sm:left-auto sm:right-8 sm:w-[25rem]">
            <BirthdayInvitationDemo primaryHref={primaryHref} />
          </div>
        </div>
      </div>
    </section>
  );
}

function HostDashboard({ primaryHref }: { primaryHref: string }) {
  return (
    <section className="bg-[var(--birthday-green)] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-10">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <BirthdaySectionIntro
            eyebrow="The host view"
            title="Know the count before you order the pizza."
            body="No spreadsheet. No notes-app tally. No searching the group chat for who still has not replied."
            inverse
          />
          <Link
            href={primaryHref}
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--birthday-yellow)] px-6 py-3 text-sm font-bold text-[var(--birthday-green)] transition hover:-translate-y-0.5"
          >
            Create your guest list
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.07] shadow-[0_32px_80px_rgba(7,18,12,0.2)]">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7">
            <div>
              <p className="text-sm font-bold">Host bar</p>
              <p className="mt-1 text-xs text-white/80">Maya&apos;s Rainbow Park Party</p>
            </div>
            <span className="rounded-full bg-[#dff5e7] px-3 py-1 text-[10px] font-bold text-[#267247]">
              LIVE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
            {birthdayHostStats.map((stat) => (
              <div key={stat.label} className="bg-[var(--birthday-green)] p-5">
                <p className="text-3xl font-semibold">{stat.value}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/80">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_0.7fr]">
            <div className="overflow-hidden rounded-2xl bg-white text-[var(--birthday-ink)]">
              {birthdayGuestRows.map((guest, index) => (
                <div
                  key={guest.family}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    index ? "border-t border-[#eadfd8]" : ""
                  }`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff1e8] text-xs font-bold text-[var(--birthday-accent)]">
                    {guest.family.at(4)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{guest.family}</p>
                    <p className="text-xs text-[#66564d]">{guest.count}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                      guest.status === "Going"
                        ? "bg-[#e6f3e9] text-[#2e6a48]"
                        : "bg-[#fff1d6] text-[#8a6322]"
                    }`}
                  >
                    {guest.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl bg-[#fff1e8] p-4 text-[var(--birthday-ink)]">
                <Utensils className="h-5 w-5 text-[var(--birthday-accent)]" aria-hidden="true" />
                <p className="mt-4 text-xl font-semibold">4 food notes</p>
                <p className="mt-1 text-xs text-[#66564d]">Ready to review</p>
              </div>
              <div className="rounded-2xl bg-[var(--birthday-yellow)] p-4 text-[var(--birthday-green)]">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                <p className="mt-4 text-xl font-semibold">7 reminders</p>
                <p className="mt-1 text-xs text-[var(--birthday-green)]">For pending families</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MilestoneBirthdays() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <BirthdaySectionIntro
          eyebrow="Birthdays grow up too"
          title="Playful for eight. Polished for eighty."
          body="The same thoughtful guest experience adapts to sweet sixteens, cocktail nights, surprise dinners, and landmark family celebrations."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {birthdayMilestones.map((milestone) => (
            <Link
              key={milestone.title}
              href={milestone.href}
              className="group relative min-h-[34rem] overflow-hidden rounded-[2.25rem] bg-[var(--birthday-ink)]"
            >
              <Image
                src={milestone.image}
                alt={milestone.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition duration-700 motion-safe:group-hover:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/12 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ffd9bf]">
                  {milestone.eyebrow}
                </p>
                <h3 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.04em]">
                  {milestone.title}
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-7 text-white/72">{milestone.body}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold">
                  Create this celebration
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function StartWays() {
  return (
    <section
      id="birthday-start"
      className="scroll-mt-20 bg-[#fff1e8] px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <BirthdaySectionIntro
          eyebrow="Start your way"
          title="Describe the idea, SNAP what you have, or tell Concierge."
          body="You do not need to rebuild the party by hand. Begin with as much—or as little—as you already know."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[2rem] bg-white p-6 shadow-[0_18px_50px_rgba(73,48,34,0.08)] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff1e8] text-[var(--birthday-accent)]">
                <Camera className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--birthday-accent)]">
                  SNAP the invite
                </p>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--birthday-ink)]">
                  Already have an invitation?
                </h3>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-[var(--birthday-muted)]">
              Photograph a card or upload a screenshot. Envitefy reads the date, time, and place,
              then gives you a draft to approve.
            </p>
            <div className="mt-6 rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#806d62]">
                Found on the invitation
              </p>
              <div className="mt-3 grid gap-2">
                {[
                  ["Party", "Maya's Rainbow Party"],
                  ["When", "May 16 · 2–4 PM"],
                  ["Where", "Oak Pavilion"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-xl bg-white px-3 py-2.5 text-sm"
                  >
                    <span className="text-[#806d62]">{label}</span>
                    <span className="text-right font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link
              href="/snap?auth=signup"
              className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--birthday-accent)] underline decoration-[#d9a48a] underline-offset-8"
            >
              Try SNAP
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </article>

          <article className="rounded-[2rem] bg-[#302742] p-6 text-white shadow-[0_18px_50px_rgba(34,24,48,0.15)] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--birthday-yellow)] text-[var(--birthday-green)]">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#cfbfef]">
                  Envitefy Concierge
                </p>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] !text-white">
                  Describe the party in a message.
                </h3>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-white/68">
              Concierge asks for anything missing, then drafts the invitation, household RSVP, map,
              and gift notes for you.
            </p>
            <div className="mt-6 space-y-3">
              <div className="ml-8 rounded-2xl rounded-tr-md bg-white px-4 py-3 text-sm leading-6 text-[var(--birthday-ink)]">
                Maya is turning eight at Oak Pavilion, Saturday 2–4. Household RSVP, please.
              </div>
              <div className="mr-5 flex gap-2">
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--birthday-yellow)] text-[var(--birthday-green)]">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="rounded-2xl rounded-tl-md bg-white/10 px-4 py-3 text-sm leading-6 text-white/86">
                  I&apos;ll draft the page with kids/adults RSVP, directions, and gift notes.
                </div>
              </div>
            </div>
            <Link
              href="/chat"
              className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--birthday-yellow)] underline decoration-[#ffd66b]/40 underline-offset-8"
            >
              Ask Envitefy Concierge
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}

function SetupSteps() {
  return (
    <section className="bg-white px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <BirthdaySectionIntro
          eyebrow="From idea to invited"
          title="Three simple steps. Then cake."
          centered
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {birthdaySetupSteps.map((step) => (
            <article key={step.number} className="group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-700 motion-safe:group-hover:scale-[1.035]"
                />
                <span className="absolute left-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white text-sm font-bold text-[var(--birthday-accent)] shadow">
                  {step.number}
                </span>
              </div>
              <div className="px-2 pt-6">
                <h3 className="text-xl font-semibold tracking-[-0.02em] text-[var(--birthday-ink)]">
                  {step.label}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--birthday-muted)]">{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BirthdayFaq({ page }: { page: UseCasePage }) {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.65fr_1.35fr]">
        <div className="self-start lg:sticky lg:top-28">
          <BirthdaySectionIntro eyebrow="Good to know" title="Before you send the invitation." />
          <div className="mt-7 flex flex-wrap gap-2">
            {["No guest app", "Live updates", "Private link"].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#f3e9e2] px-3 py-1.5 text-xs font-bold text-[#65544b]"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="divide-y divide-[#dfd2ca] border-y border-[#dfd2ca]">
          {page.faqs.map((faq, index) => (
            <details key={faq.question} className="group" open={index === 0}>
              <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-5 py-5 text-base font-semibold marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--birthday-accent)]">
                {faq.question}
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#806d62] shadow-sm transition group-open:rotate-90">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </summary>
              <p className="max-w-2xl pb-6 text-sm leading-7 text-[var(--birthday-muted)]">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ page, primaryHref }: { page: UseCasePage; primaryHref: string }) {
  return (
    <section className="px-5 pb-24 sm:px-8 lg:px-10">
      <div className="relative mx-auto min-h-[32rem] max-w-7xl overflow-hidden rounded-[2.5rem]">
        <Image
          src={birthdayFinalImage}
          alt="Jungle safari birthday celebration"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/58" />
        <div className="relative flex min-h-[32rem] flex-col items-center justify-center px-6 py-14 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ffe099]">
            Make this birthday unmistakably theirs
          </p>
          <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.045em] !text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.65)] sm:text-6xl">
            The magic for them. The details handled for you.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 !text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] sm:text-base">
            Start with a prompt, an invitation photo, or a simple conversation.
          </p>
          <Link
            href={primaryHref}
            className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[var(--birthday-yellow)] px-7 py-4 text-sm font-bold text-[var(--birthday-green)] shadow-lg transition hover:-translate-y-0.5"
          >
            {page.primaryCta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function BirthdayEditorialSections({
  page,
  primaryHref,
}: {
  page: UseCasePage;
  primaryHref: string;
}) {
  return (
    <>
      <PromptCreation primaryHref={primaryHref} />
      <InvitationExperience primaryHref={primaryHref} />
      <HostDashboard primaryHref={primaryHref} />
      <MilestoneBirthdays />
      <StartWays />
      <SetupSteps />
      <BirthdayFaq page={page} />
      <FinalCta page={page} primaryHref={primaryHref} />
    </>
  );
}
