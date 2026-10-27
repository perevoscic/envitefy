"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  Link2,
  MapPinned,
  Palette,
  Share2,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { type CSSProperties, useEffect, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import MarketingPage from "@/components/marketing/MarketingPage";
import styles from "@/components/marketing/ProductSportsLanding.module.css";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import PublicConciergeWidget from "@/components/navigation/PublicConciergeWidget";
import { GradientBackgroundLayer } from "@/components/ui/gradient-backgrounds";
import { marketingPageNavLinks } from "@/config/navigation";
import hero from "./GymnasticsEditorialHero.module.css";
import GymnasticsLandingFaq from "./GymnasticsLandingFaq";
import MeetPreview from "./GymnasticsMeetDemo";
import showcase from "./GymnasticsMeetShowcase.module.css";
import GymnasticsMeetTransformation from "./GymnasticsMeetTransformation";
import product from "./GymnasticsProductLanding.module.css";
import useGymnasticsHeroEntrance from "./useGymnasticsHeroEntrance";

const features = [
  {
    icon: CalendarDays,
    label: "The schedule",
    title: "Less searching. More cheering.",
    copy: "Give families a clear view of sessions, check-in, warm-ups and awards. The important times, together and easy to find.",
    example: "schedule",
  },
  {
    icon: MapPinned,
    label: "Venue & travel",
    title: "Arrive with a plan.",
    copy: "Put the venue, parking, entrances and hotel links beside the schedule. Help everyone get ready before they leave home.",
    example: "venue",
  },
  {
    icon: Link2,
    label: "Sharing & updates",
    title: "One link. Still the right link.",
    copy: "Share your published page by text, email or team chat. Save changed details to that same page when the plan moves.",
    example: "sharing",
  },
  {
    icon: Palette,
    label: "Your meet’s identity",
    title: "Make the welcome yours.",
    copy: "Choose a gymnastics design, change the artwork and wording, and arrange the sections around your meet.",
    example: "design",
  },
];

function UsageNumber({ value, onComplete }: { value: string; onComplete?: () => void }) {
  return (
    <strong>
      <span className="sr-only">{value}</span>
      <span className={hero.countGlyphs} aria-hidden="true">
        {Array.from(value, (character, index) => (
          <span
            key={`${index}-${character}`}
            className={/\d/.test(character) ? hero.countDigit : undefined}
            style={{ "--digit-order": index } as CSSProperties}
            onAnimationEnd={index === value.length - 2 ? onComplete : undefined}
          >
            {character}
          </span>
        ))}
      </span>
    </strong>
  );
}

function FeatureExample({ kind }: { kind: string }) {
  return (
    <div className={product.featureExample} role="group" aria-label="Illustrative product example">
      {kind === "schedule" && (
        <>
          <span className={product.exampleLabel}>Session 3 · Saturday</span>
          <div className={product.exampleRow}>
            <span>Check-in</span>
            <strong>7:20 AM</strong>
          </div>
          <div className={product.exampleRow}>
            <span>Warm-up</span>
            <strong>7:45 AM</strong>
          </div>
        </>
      )}
      {kind === "venue" && (
        <>
          <MapPinned className={product.exampleIcon} aria-hidden="true" />
          <strong>Aurora Convention Hall</strong>
          <span>East entrance · Parking in lots B &amp; C</span>
        </>
      )}
      {kind === "sharing" && (
        <>
          <span className={product.exampleLabel}>Your published page</span>
          <div className={product.linkExample}>
            <Link2 aria-hidden="true" />
            <span>One shareable meet link</span>
          </div>
          <span className={product.savedExample}>
            <Check aria-hidden="true" />
            Updated details, same destination
          </span>
        </>
      )}
      {kind === "design" && (
        <>
          <div className={product.swatches} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <strong>Your colors. Your details.</strong>
          <span>Artwork, wording &amp; page sections</span>
        </>
      )}
    </div>
  );
}

export default function GymnasticsLanding() {
  const { heroRef, navigationRef, motion: heroMotion } = useGymnasticsHeroEntrance();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [countsComplete, setCountsComplete] = useState(false);
  useEffect(() => {
    if (isAuthenticated) return;
    const auth = searchParams?.get("auth");
    if (auth === "signup" || auth === "login") {
      setAuthMode(auth);
      setAuthModalOpen(true);
    }
  }, [isAuthenticated, searchParams]);
  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };
  const startAction = isAuthenticated ? (
    <Link href="/event/gymnastics" className={styles.primary}>
      Create your meet page <ArrowRight aria-hidden="true" />
    </Link>
  ) : (
    <button className={styles.primary} type="button" onClick={() => openAuth("signup")}>
      Create your meet page <ArrowRight aria-hidden="true" />
    </button>
  );
  return (
    <MarketingPage tone="sports" className={`${styles.editorial} ${hero.page}`}>
      <GradientBackgroundLayer className={hero.background} />
      <div ref={navigationRef} className={hero.navigation} data-hero-motion={heroMotion}>
        <HeroTopNav
          editorialTone="sports"
          navLinks={marketingPageNavLinks("/gymnastics")}
          variant="transparent-light"
          primaryCtaLabel="Browse templates"
          authenticatedPrimaryHref="/gymnastics/templates"
          guestPrimaryHref="/gymnastics/templates"
          brandHref="/"
          loginSuccessRedirectUrl="/"
          onGuestLoginAction={() => openAuth("login")}
          onGuestSignupAction={() => openAuth("signup")}
          onGuestPrimaryAction={() => openAuth("signup")}
        />
      </div>
      <main>
        <section
          ref={heroRef}
          id="hero"
          className={hero.section}
          aria-labelledby="gymnastics-hero-title"
          data-hero-motion={heroMotion}
        >
          <div className={hero.canvas}>
            <p className={hero.eyebrow}>GYMNASTICS MEET PAGES</p>
            <div className={hero.stage}>
              <div className={hero.visualStage}>
                <h1 id="gymnastics-hero-title" className={hero.title}>
                  <span>Less </span>
                  <span>planning. </span>
                  <span className={hero.secondPhrase}>More </span>
                  <span>cheering.</span>
                </h1>
                <div className={hero.artwork}>
                  <span className={hero.circle} aria-hidden="true" />
                  <div className={hero.portraitWindow}>
                    <img
                      src="/images/gymnastics/gymnast-editorial-hero-v2.webp"
                      alt="Black-and-white upper-body portrait of an adult gymnast with braided brown hair, a rhinestone competition leotard, and both hands resting together at her waist"
                      width="1086"
                      height="1448"
                      fetchPriority="high"
                      className={hero.portrait}
                    />
                  </div>
                </div>
              </div>
              <div className={hero.copy}>
                <p className={hero.lead}>
                  Everything for meet day.
                  <br />
                  All in one place.
                </p>
                <p className={hero.description}>
                  Schedules, locations, hotels, and important updates—all on one page you can share
                  with every family.
                </p>
                <div className={hero.actions}>
                  <Link href="/gymnastics/templates" className={hero.primary}>
                    Create your meet page <ArrowRight aria-hidden="true" />
                  </Link>
                  <a href="#meet-demo" className={hero.sampleLink}>
                    See a sample meet <ArrowRight aria-hidden="true" />
                  </a>
                </div>
                <p className={hero.note}>One link. Everything families need.</p>
              </div>
            </div>
          </div>
        </section>
        <div
          className={hero.community}
          data-motion-reveal
          data-counts-complete={countsComplete ? "true" : undefined}
        >
          <ul className={hero.audiences} aria-label="Illustrative usage figures">
            <li>
              <UsageNumber value="1,537+" />
              <span>Parents</span>
            </li>
            <li>
              <UsageNumber value="783+" />
              <span>Coaches</span>
            </li>
            <li>
              <UsageNumber value="517+" onComplete={() => setCountsComplete(true)} />
              <span>Gyms</span>
            </li>
          </ul>
        </div>
        <section
          id="meet-demo"
          className={showcase.section}
          aria-labelledby="gymnastics-demo-title"
        >
          <div className={showcase.layout}>
            <div className={showcase.intro}>
              <p className={showcase.eyebrow}>The family view</p>
              <h2 id="gymnastics-demo-title" className={showcase.title}>
                A clear plan.<em>A calmer meet day.</em>
              </h2>
              <p className={showcase.description}>
                From the first check-in to the last award, give every family one place to find the
                details.
              </p>
              <Link href="/gymnastics/templates" className={showcase.action}>
                Create your meet page <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className={showcase.preview}>
              <MeetPreview />
            </div>
          </div>
        </section>
        <section
          id="features"
          className={product.section}
          aria-labelledby="gymnastics-benefits-title"
        >
          <div className={product.sectionHeader}>
            <div data-motion-reveal>
              <p className={styles.eyebrow}>Built around the people showing up</p>
              <h2 id="gymnastics-benefits-title" className={product.heading}>
                Less meet-day admin.<strong>More being there.</strong>
              </h2>
            </div>
            <p className={product.headerIntro} data-motion-reveal>
              A meet page should do more than look good. It should help a parent find the right
              time, a coach share the plan, and an organizer keep everyone together.
            </p>
          </div>
          <div className={product.benefits}>
            {features.map(({ icon: Icon, label, title, copy, example }, index) => (
              <article key={title} className={product.benefitWrap} data-motion-reveal>
                <div className={product.benefitCard}>
                  <div className={product.cardIdentity}>
                    <span aria-hidden="true">0{index + 1}</span>
                    <Icon aria-hidden="true" />
                  </div>
                  <p className={product.cardLabel}>{label}</p>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <FeatureExample kind={example} />
                </div>
              </article>
            ))}
          </div>
        </section>
        <GymnasticsMeetTransformation />
        <section
          id="how-it-works"
          className={`${product.section} ${product.stepsSection}`}
          aria-labelledby="gymnastics-steps-title"
        >
          <div className={product.stepsIntro}>
            <p className={styles.eyebrow}>From the first detail to the final link</p>
            <h2 id="gymnastics-steps-title" className={product.heading}>
              Bring the packet.<strong>Make it a page.</strong>
            </h2>
            <p className={product.headerIntro}>
              Keep your meet’s information. Give it a home that’s easier to read, personalize and
              share.
            </p>
            <Link href="/gymnastics/templates" className={product.textLink}>
              Find your starting design <ArrowRight aria-hidden="true" />
            </Link>
            <div className={product.typeTile} aria-hidden="true">
              <span>Your meet.</span>
              <strong>
                Beautifully
                <br />
                together.
              </strong>
              <span>Packet → Page → People</span>
            </div>
          </div>
          <ol className={product.steps}>
            {[
              {
                icon: Upload,
                title: "Start with what you have.",
                copy: "Upload your meet packet or schedule, or begin with a gymnastics design. Bring your source details into the editor and build from there.",
                tags: ["Meet packets", "Schedules", "Designs"],
              },
              {
                icon: Palette,
                title: "Make it work for your meet.",
                copy: "Review dates and sessions, add venue and hotel information, and make the artwork and wording yours. Preview the page before publishing.",
                tags: ["Review details", "Arrange sections", "Preview"],
              },
              {
                icon: Share2,
                title: "Share once. Keep it current.",
                copy: "Save a private draft while you prepare. Publish when you’re ready, share the guest link, and save future changes to that same page.",
                tags: ["Save draft", "Publish", "Share your link"],
              },
            ].map(({ icon: Icon, title, copy, tags }, index) => (
              <li key={title} className={product.step} data-motion-reveal>
                <div className={product.stepTop}>
                  <span>0{index + 1}</span>
                  <Icon aria-hidden="true" />
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
                <ul>
                  {tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
        <section
          id="use-cases"
          className={product.audiences}
          aria-labelledby="gymnastics-audiences-title"
        >
          <div>
            <p className={product.lightEyebrow}>One meet. A lot of people.</p>
            <h2 id="gymnastics-audiences-title">
              For the people in the stands.<strong>And behind the scenes.</strong>
            </h2>
          </div>
          <div className={product.audienceRows}>
            {[
              {
                title: "Families",
                copy: "Open the link, find the session, check where to go. Keep the weekend close at hand.",
              },
              {
                title: "Coaches",
                copy: "Give your team one place for the schedule, arrival notes and meet information.",
              },
              {
                title: "Organizers",
                copy: "Bring the details together, publish when ready and keep the page current as plans change.",
              },
            ].map(({ title, copy }) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          id="why-envitefy"
          className={product.section}
          aria-labelledby="gymnastics-tools-title"
        >
          <div className={product.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>The thoughtful extras</p>
              <h2 id="gymnastics-tools-title" className={product.heading}>
                The little things.<strong>Already considered.</strong>
              </h2>
            </div>
            <p className={product.headerIntro}>
              Choose the tools that fit your meet, from saving the date to getting a little help
              with the planning.
            </p>
          </div>
          <div className={product.tools}>
            {[
              {
                icon: CalendarDays,
                title: "A place on their calendar.",
                copy: "With a valid event date, families can choose Google Calendar, Outlook or an Apple-compatible calendar file. Each guest chooses to add the meet.",
              },
              {
                icon: ClipboardList,
                title: "A clearer team headcount.",
                copy: "Enable attendance for a meet with a team roster so families can confirm a listed athlete’s attendance. Keep the replies with your meet.",
              },
              {
                icon: Users,
                title: "A co-host by your side.",
                copy: "Start from a design, then invite a co-host to help edit the page, publish and manage responses. You keep control of who has access.",
              },
            ].map(({ icon: Icon, title, copy }) => (
              <article key={title}>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
          <div className={product.signupCallout}>
            <div>
              <p className={styles.eyebrow}>A little help around the meet</p>
              <h3>Snack duty? Volunteer shifts? Team meals?</h3>
              <p>
                Pair your meet page with a separate Sign-up Form for roles, supplies or time slots.
              </p>
            </div>
            <Link href="/signup-forms" className={styles.secondary}>
              Explore Sign-up Forms <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
        <GymnasticsLandingFaq />
        <section className={`${styles.closing} ${product.closing}`}>
          <p className={styles.eyebrow}>Your next meet, together</p>
          <h2 className={styles.sectionTitle}>
            Less coordinating.
            <br />
            More cheering them on.
          </h2>
          <p className={styles.intro}>Make the page. Share the plan. Be there for the moment.</p>
          <div className={styles.actions}>
            {startAction}
            <Link href="/snap" className={styles.secondary}>
              Explore Snap
            </Link>
          </div>
        </section>
      </main>
      <PublicConciergeWidget onSignupSelect={() => openAuth("signup")} />
      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        signupSource="gymnastics"
        successRedirectUrl={authMode === "signup" ? "/event/gymnastics" : "/"}
      />
    </MarketingPage>
  );
}
