"use client";
import { CalendarDays, Camera, MapPinned, Share2, Upload, Users } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import {
  TemplateMasonryCard,
  TemplateMasonryGrid,
} from "@/components/events/TemplateMasonryGallery";
import FootballThumbnail from "@/components/football-season-templates/FootballThumbnail";
import { FOOTBALL_GALLERY_DESIGNS } from "@/components/football-season-templates/footballGallery";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingPage from "@/components/marketing/MarketingPage";
import styles from "@/components/marketing/ProductSportsLanding.module.css";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import editorial from "@/components/sports-landing/SportsEditorialSections.module.css";
import ArrowFillLink from "@/components/ui/ArrowFillLink";

const features = [
  {
    icon: CalendarDays,
    title: "Every game, one schedule",
    copy: "Keep upcoming matchups, kickoff times and stadiums together. Past games have their own place, with scores when available.",
  },
  {
    icon: MapPinned,
    title: "Ready for the road",
    copy: "Share away-game directions, parking notes, hotel details and ticket links so families can plan before leaving home.",
  },
  {
    icon: Users,
    title: "Your whole team, in sync",
    copy: "Bring team details, rosters, practices, attendance and updates into the same shareable season page.",
  },
];
const steps = [
  {
    title: "Choose your team’s look",
    copy: "Start with a football design, then make the colors, wording and hero image your own.",
  },
  {
    title: "Bring in the schedule",
    copy: "Upload a schedule, paste a public website link, or add your games yourself. Review the details before saving.",
  },
  {
    title: "Share the season",
    copy: "Publish when you’re ready and give players and families one link for the latest plan.",
  },
];
const faqs = [
  {
    question: "Can I create a single game or a full season?",
    answer:
      "Yes. Start with the same football designs for a game-day page or a season schedule. Add only the sections your team needs.",
  },
  {
    question: "Can I upload a schedule I already have?",
    answer:
      "Yes. In the football editor, use Upload / URL & Prefill to import a file or public website into the selected design. Review the imported details and explicitly save when you’re ready.",
  },
  {
    question: "Will my account start with football tools?",
    answer:
      "Yes. Sign up from the football page or gallery and Football becomes your default creation option. Your workspace starts with football, while Snap, Upload and sign-up forms stay available. You can add other categories in Settings.",
  },
  {
    question: "Can I still snap or upload an invitation?",
    answer:
      "Yes. Snap and Upload remain available for every account, whether you organize football, gymnastics or another kind of event.",
  },
];

function SeasonPreview() {
  return (
    <div className={styles.sample} data-authored-preview data-appearance-scope="authored">
      <div className="relative -mx-2 -mt-2 mb-5 aspect-[16/7] overflow-hidden rounded-t-[5rem] rounded-b-xl">
        <Image
          src="/images/landing/football/friday-night-team.webp"
          alt="A football team on the sideline under stadium lights"
          fill
          sizes="(max-width: 767px) 85vw, 40vw"
          className="object-cover"
        />
      </div>
      <p className={styles.sampleLabel}>Sample season page</p>
      <h2>Friday nights, together.</h2>
      <p className={styles.sampleMeta}>Hawthorne Football · Your season at a glance</p>
      <div className={styles.sampleRows}>
        {[
          ["SEP 05 · 7:30 PM", "vs Central High"],
          ["SEP 12 · 7:00 PM", "at Northside"],
          ["SEP 19 · 7:30 PM", "vs West Valley"],
        ].map(([time, team]) => (
          <div className={styles.sampleRow} key={time}>
            <span>{time}</span>
            <strong>{team}</strong>
          </div>
        ))}
      </div>
      <p className={styles.sampleFooter}>
        Schedule · Venues · Team notes
        <br />
        One familiar link for players and families.
      </p>
    </div>
  );
}
export default function FootballLanding() {
  const { status } = useSession();
  const [destination, setDestination] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  return (
    <MarketingPage
      tone="sports"
      className={`${styles.editorial} ${editorial.page} ${editorial.football}`}
    >
      <SignedOutPageChrome topNavVariant="transparent-light" />
      <main>
        <MarketingHero
          category="football"
          id="hero"
          eyebrow="Football pages for teams & families"
          title={
            <>
              One team. <em>A whole season together.</em>
            </>
          }
          description="Every matchup, away-game direction and team note in one link. Give players and families a familiar place for the latest plan."
          primaryHref="#templates"
          primaryLabel="Start your football page"
          secondaryHref="#how-it-works"
          secondaryLabel="See how it works"
        >
          <SeasonPreview />
        </MarketingHero>
        <section id="features" className={`${styles.section} ${editorial.features}`}>
          <p className={styles.eyebrow}>Built around your team</p>
          <h2>
            From the first kickoff <strong>to the final whistle.</strong>
          </h2>
          <div className={editorial.benefits}>
            {features.map(({ icon: Icon, title, copy }, index) => (
              <div className={editorial.benefitWrap} key={title} data-motion-reveal>
                <article className={editorial.benefit}>
                  <div className={editorial.identity} aria-hidden="true">
                    <span>0{index + 1}</span>
                    <Icon />
                  </div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              </div>
            ))}
          </div>
        </section>
        <section id="templates" aria-label="Featured football templates" className={styles.section}>
          <p className={styles.eyebrow}>Football designs</p>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2>Make it your team’s.</h2>
              <p className={styles.intro}>
                Choose a design, then add your schedule and team details.
              </p>
            </div>
            <ArrowFillLink
              href="/football/templates"
              className={styles.secondary}
              label={`Browse all ${FOOTBALL_GALLERY_DESIGNS.length} designs`}
            />
          </div>
          <TemplateMasonryGrid>
            {FOOTBALL_GALLERY_DESIGNS.slice(0, 8).map((design) => (
              <TemplateMasonryCard
                key={design.id}
                designId={design.id}
                name={design.name}
                href={`/event/football/customize?templateId=${encodeURIComponent(design.id)}`}
                onClick={(event) => {
                  if (status === "authenticated") return;
                  event.preventDefault();
                  setAuthMode("signup");
                  setDestination(event.currentTarget.href);
                }}
              >
                <FootballThumbnail design={design} />
              </TemplateMasonryCard>
            ))}
          </TemplateMasonryGrid>
        </section>
        <section id="how-it-works" className={styles.section}>
          <p className={styles.eyebrow}>A clear way to get started</p>
          <h2>Your next season starts here.</h2>
          <ol className={styles.grid}>
            {steps.map((step, index) => (
              <li className={styles.item} key={step.title}>
                <span className={styles.number}>0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className={styles.section}>
          <div className={styles.split}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-[42%] rounded-b-2xl">
              <Image
                src="/images/landing/football/sideline-families.webp"
                alt="Families cheering for their local football team"
                fill
                sizes="(max-width: 767px) 90vw, 45vw"
                className="object-cover"
              />
            </div>
            <div>
              <div className="mb-6 flex gap-4" aria-hidden="true">
                <Camera />
                <Upload />
                <Share2 />
              </div>
              <p className={styles.eyebrow}>Football first</p>
              <h2>Room for the rest of life.</h2>
              <p className={styles.intro}>
                Start with the tools your team needs. Snap invitations, upload schedules and create
                sign-up forms from the same account. Add other event categories in Settings whenever
                you need them.
              </p>
              <div className={styles.actions}>
                <ArrowFillLink href="/snap" className={styles.secondary} label="Explore Snap" />
              </div>
            </div>
          </div>
        </section>
        <section id="faq" className={styles.section}>
          <p className={styles.eyebrow}>Before the season</p>
          <h2>A few things to know.</h2>
          <div className={styles.faq}>
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className={styles.closing}>
          <h2 className={styles.sectionTitle}>Give your team a home for the season.</h2>
          <div className={styles.actions}>
            <ArrowFillLink
              href="/football/templates"
              className={styles.primary}
              label="Choose your football design"
            />
          </div>
        </section>
      </main>
      <AuthModal
        open={Boolean(destination)}
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={() => setDestination(null)}
        successRedirectUrl={destination || "/event/football"}
        signupIntent="football"
        description={
          authMode === "signup" ? "Create your account to customize your Football page." : undefined
        }
      />
    </MarketingPage>
  );
}
