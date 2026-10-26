"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Link2,
  MapPin,
  Play,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import EnvitefyBrandImage from "@/components/branding/EnvitefyBrandImage";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";
import { ENVITEFY_BRAND_ASSETS } from "@/lib/brand-assets";
import styles from "./ProductLandingHero.module.css";

type SampleAction = "rsvp" | "directions" | "calendar" | null;
type SampleReply = "Going" | "Maybe" | "Can’t make it" | null;

function SampleEventPage() {
  const [action, setAction] = useState<SampleAction>(null);
  const [reply, setReply] = useState<SampleReply>(null);

  const toggleAction = (nextAction: SampleAction) => {
    setAction((current) => (current === nextAction ? null : nextAction));
  };

  return (
    <div
      className={styles.visual}
      role="group"
      aria-label="An example of an Envitefy guest event page"
    >
      <p className={styles.previewLabel}>
        <span aria-hidden="true" />A little preview of your next gathering
      </p>
      <article className={styles.eventCard} data-appearance-scope="authored">
        <div className={styles.browserBar}>
          <Link2 size={12} aria-hidden="true" />
          <span>One link for every detail</span>
          <span className={styles.sampleBadge}>Sample</span>
        </div>
        <div className={styles.artwork}>
          <Image
            src="/images/landing/hero/garden-brunch-desktop.webp"
            alt="A sunlit garden table with flowers and a place set for brunch"
            fill
            priority
            sizes="(min-width: 1024px) 392px, (min-width: 600px) 400px, calc(100vw - 56px)"
            className={styles.artworkImage}
          />
        </div>
        <div className={styles.eventContent}>
          <p className={styles.eventEyebrow}>You’re invited</p>
          <h2 className={styles.eventTitle}>
            A little brunch,
            <br />a lovely bunch.
          </h2>
          <div className={styles.eventDetails}>
            <p>
              <CalendarDays size={15} aria-hidden="true" />
              Saturday · 11:00 AM
            </p>
            <p>
              <MapPin size={15} aria-hidden="true" />
              Willow Garden · Austin, TX
            </p>
          </div>
          <button
            type="button"
            className={styles.rsvpButton}
            onClick={() => toggleAction("rsvp")}
            aria-expanded={action === "rsvp"}
            aria-controls="landing-sample-action"
          >
            {reply ? (
              <>
                <Check size={16} aria-hidden="true" />
                {reply} · Change sample reply
              </>
            ) : (
              "RSVP to the brunch"
            )}
          </button>
          <div className={styles.guestActions}>
            <button
              type="button"
              onClick={() => toggleAction("directions")}
              aria-expanded={action === "directions"}
              aria-controls="landing-sample-action"
            >
              <MapPin size={14} aria-hidden="true" />
              Directions
            </button>
            <button
              type="button"
              onClick={() => toggleAction("calendar")}
              aria-expanded={action === "calendar"}
              aria-controls="landing-sample-action"
            >
              <CalendarDays size={14} aria-hidden="true" />
              Add to calendar
            </button>
          </div>
          <div id="landing-sample-action" className={styles.samplePanel} hidden={!action}>
            <div className={styles.samplePanelHeading}>
              <p>
                {action === "rsvp"
                  ? "Try a sample reply"
                  : action === "directions"
                    ? "The way to your gathering"
                    : "A place on their calendar"}
              </p>
              <button
                type="button"
                onClick={() => setAction(null)}
                aria-label="Close sample details"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
            {action === "rsvp" ? (
              <>
                <div className={styles.replyOptions} role="group" aria-label="Sample RSVP choices">
                  {(["Going", "Maybe", "Can’t make it"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={reply === option}
                      onClick={() => setReply(option)}
                    >
                      {reply === option && <Check size={13} aria-hidden="true" />}
                      {option}
                    </button>
                  ))}
                </div>
                <p className={styles.sampleHelp} role="status">
                  {reply
                    ? `Sample reply: ${reply}. Nothing has been sent.`
                    : "Guests reply right on your page. Try it here — this is just a sample."}
                </p>
              </>
            ) : (
              <p className={styles.sampleHelp}>
                {action === "directions"
                  ? "On your event page, guests open your venue’s address in Maps with a tap. This sample venue is illustrative."
                  : "Guests can add your event’s date, time and location to their calendar, straight from the invitation."}
              </p>
            )}
          </div>
          <div className={styles.eventBranding}>
            <span>Made with</span>
            <EnvitefyWordmark scaled={false} appearance="fixed" className={styles.smallWordmark} />
          </div>
        </div>
      </article>
      <aside className={styles.hostNote} aria-label="Sample host response view">
        <p className={styles.hostEyebrow}>For the host · Sample</p>
        <p className={styles.hostTitle}>See who’s coming.</p>
        <div className={styles.hostReply}>
          <span className={styles.avatar} aria-hidden="true">
            JL
          </span>
          <div>
            <strong>Jamie L.</strong>
            <span>
              <Check size={12} aria-hidden="true" />
              Going to your brunch
            </span>
          </div>
        </div>
      </aside>
      <p className={styles.visualCaption}>A lovely invitation. A useful event page.</p>
    </div>
  );
}

export default function ProductLandingHero({ onCreate }: { onCreate: () => void }) {
  const openingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opening = openingRef.current;
    const hero = opening?.querySelector<HTMLElement>("#landing-hero");
    const seed = opening?.querySelector<HTMLElement>("[data-opening-seed]");
    if (!opening || !hero || !seed) return;
    let frame = 0;
    let disposed = false;
    const measure = () => {
      frame = 0;
      if (disposed) return;
      const heroRect = hero.getBoundingClientRect();
      const seedRect = seed.getBoundingClientRect();
      const width = heroRect.width;
      if (!width || !heroRect.height || !seedRect.width || !seedRect.height) return;
      const viewport = Math.max(1, window.innerHeight);
      const tail = Math.max(0, heroRect.bottom - seedRect.bottom);
      const desktop = window.matchMedia("(min-width: 720px)").matches;
      // Desktop waits for the actual seed baseline, then gives the expansion
      // more travel. The final edge clears the native section-anchor inset.
      const range = {
        motionExitStart: desktop ? String(0.85 + tail / viewport) : "1",
        motionExitEnd: desktop ? String(Math.max(0.1, 96 / viewport)) : "0.3",
      };
      for (const [property, value] of Object.entries(range)) {
        if (opening.dataset[property] !== value) opening.dataset[property] = value;
      }
      const values: Record<string, string> = {
        "--opening-width": `${width}px`,
        "--opening-dome-height": `${viewport * (desktop ? 0.58 : 0.44)}px`,
        "--opening-tail": `${tail}px`,
        "--opening-seed-left": `${seedRect.left - heroRect.left}px`,
        "--opening-seed-right": `${heroRect.right - seedRect.right}px`,
        "--opening-seed-width": `${seedRect.width}px`,
        "--opening-seed-height": `${seedRect.height}px`,
      };
      for (const [property, value] of Object.entries(values)) {
        if (opening.style.getPropertyValue(property) !== value)
          opening.style.setProperty(property, value);
      }
      opening.setAttribute("data-opening-ready", "true");
    };
    const schedule = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(hero);
    observer.observe(seed);
    window.addEventListener("resize", schedule, { passive: true });
    measure();
    void document.fonts?.ready.then(schedule);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div
      ref={openingRef}
      className={styles.opening}
      data-landing-opening
      data-motion-scene
      data-motion-range="exit"
      data-motion-target="[data-opening-hero]"
    >
      <section
        id="landing-hero"
        className={styles.hero}
        aria-labelledby="landing-product-title"
        data-opening-hero
      >
        <div className={styles.expandingArch} data-opening-arch aria-hidden="true" />
        <div className={styles.brandDisplay} data-landing-wordmark aria-hidden="true">
          <EnvitefyBrandImage
            src={ENVITEFY_BRAND_ASSETS.wordmark.color}
            whiteSrc={ENVITEFY_BRAND_ASSETS.wordmark.white}
            alt=""
            width={1198}
            height={401}
            priority
            className={styles.displayWordmark}
          />
        </div>
        <div className={styles.brandCaption}>
          <span aria-hidden="true">Your people</span>
          <p>A beautiful beginning to getting together</p>
          <span aria-hidden="true">Your plans</span>
        </div>
        <div className={styles.heroInner}>
          <div className={styles.copy}>
            <h1 id="landing-product-title" className={styles.title}>
              <span>Beautiful invites.</span>
              <span>
                All the details. <em>One link.</em>
              </span>
            </h1>
            <p className={styles.intro}>
              Create a page guests can open to RSVP, get directions, check the schedule and see your
              latest updates.
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.primaryButton} onClick={onCreate}>
                Create your event
                <ArrowRight size={19} aria-hidden="true" />
              </button>
              <a href="#showcase" className={styles.secondaryButton}>
                <Play size={16} aria-hidden="true" />
                See an example
              </a>
            </div>
            <div className={styles.reassurance}>
              <p>
                <CheckCircle2 size={14} aria-hidden="true" />
                No app needed for guests
              </p>
              <span aria-hidden="true">·</span>
              <p>Update details after sharing</p>
            </div>
            <p className={styles.startNote}>
              Start with a design, upload a flyer or paste an event link.
            </p>
          </div>
          <div className={styles.heroPortrait}>
            <Image
              src="/images/landing/hero/garden-brunch-desktop.webp"
              alt="A flower-filled garden table, ready for everyone to arrive"
              fill
              priority
              sizes="(max-width: 600px) 44vw, 24vw"
            />
            <span className={styles.portraitCaption}>Good things start with an invitation.</span>
          </div>
          <div className={styles.seedArches} aria-hidden="true">
            {Array.from({ length: 7 }, (_, index) => (
              <span key={index} data-opening-seed={index === 3 ? "" : undefined} />
            ))}
          </div>
        </div>
      </section>
      <LandingGatheringNote />
    </div>
  );
}

export function LandingGatheringNote() {
  const sceneRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const stage = scene?.querySelector<HTMLElement>("[data-gathering-stage]");
    const copy = scene?.querySelector<HTMLElement>("[data-gathering-copy]");
    if (!scene || !stage || !copy) return;
    let frame = 0;
    let disposed = false;
    const measure = () => {
      frame = 0;
      if (disposed) return;
      const viewport = Math.max(1, window.innerHeight);
      // Layout offsets stay stable while the complete stage scales. Start at
      // the copy's bottom, including its link, rather than the section padding.
      const clearance = Math.max(
        0,
        scene.offsetHeight - stage.offsetTop - copy.offsetTop - copy.offsetHeight,
      );
      const range = {
        motionExitStart: String(1 + clearance / viewport),
        motionExitEnd: String(0.25 + clearance / viewport),
      };
      for (const [property, value] of Object.entries(range)) {
        if (scene.dataset[property] !== value) scene.dataset[property] = value;
      }
      scene.setAttribute("data-gathering-ready", "true");
    };
    const schedule = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(scene);
    observer.observe(copy);
    window.addEventListener("resize", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule, { passive: true });
    measure();
    void document.fonts?.ready.then(schedule);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <section
      ref={sceneRef}
      id="gathering-note"
      className={styles.gatheringScene}
      aria-labelledby="gathering-title"
      data-motion-scene
      data-motion-range="exit"
    >
      <div className={styles.gatheringStage} data-gathering-stage>
        <div className={styles.gatheringCopy} data-gathering-copy>
          <p className={styles.noteEyebrow}>
            <span />
            The reason we gather
            <span />
          </p>
          <h2
            id="gathering-title"
            className={styles.gatheringTitle}
            aria-label="The best part of any plan is the people."
            data-motion-scene
            data-motion-range="read"
          >
            The best part of any plan is{" "}
            <strong className={styles.peopleEmphasis}>
              {["the", "people."].map((word, index) => (
                <span key={word}>
                  {index > 0 && " "}
                  <span className={styles.peopleWord}>
                    <span className={styles.peopleWordMeasure} aria-hidden="true">
                      {word}
                    </span>
                    <span className={styles.peopleWordInk} data-gathering-word={word}>
                      {word}
                    </span>
                  </span>
                </span>
              ))}
            </strong>
          </h2>
          <div className={styles.noteBody}>
            <p>
              The big yes. Another birthday. A team worth cheering for. A table with room for one
              more.
            </p>
            <p>
              Beautiful invitations are just the beginning. Collect RSVPs, share schedules and
              directions, and keep guests up to date through one link. From wedding weekends to
              school events and volunteer sign-ups, give every gathering a place to come together.
            </p>
          </div>
          <a href="#examples">
            Find your kind of gathering <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

export function LandingGuestPreview() {
  return (
    <section
      id="landing-guest-preview"
      className={styles.guestPreview}
      aria-labelledby="guest-preview-title"
    >
      <div className={styles.guestPreviewCopy} data-motion-reveal>
        <p className={styles.sectionEyebrow}>More than a beautiful invitation</p>
        <h2 id="guest-preview-title">
          A little page.
          <br />
          <em>A lot taken care of.</em>
        </h2>
        <p>
          One place for the invitation, the replies and all the useful little details. Take a look
          around — this sample is yours to try.
        </p>
        <a href="#how-it-works">
          See how it comes together <ArrowRight size={17} aria-hidden="true" />
        </a>
      </div>
      <div data-motion-reveal>
        <SampleEventPage />
      </div>
    </section>
  );
}

const occasions = [
  { label: "Weddings", href: "/weddings" },
  { label: "Birthdays", href: "/birthdays" },
  { label: "Gymnastics", href: "/gymnastics" },
  { label: "Baby showers", href: "/baby-showers" },
  { label: "Anniversaries", href: "/anniversaries" },
  { label: "Teams & schools", href: "/sport-events" },
];

export function LandingOccasionLinks() {
  return (
    <nav className={styles.occasions} aria-label="Find your event type">
      <div className={styles.occasionInner}>
        <p>A page for your</p>
        <ul>
          {occasions.map((occasion) => (
            <li key={occasion.label}>
              <Link href={occasion.href}>{occasion.label}</Link>
            </li>
          ))}
          <li>
            <Link href="#examples" className={styles.exploreLink}>
              Explore all
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

const steps = [
  {
    title: "Start your way",
    description: "Pick a design, upload a flyer or paste an event link.",
    detail:
      "Bring the invitation you already have, or find a design that feels like your occasion. Keep the artwork and the practical details together from the start.",
    highlights: ["Ready-made invitation designs", "Flyer and screenshot uploads", "Details from an event link"],
    image: "/images/marketing/birthday-step-theme.png",
    imagePosition: "50% 50%",
  },
  {
    title: "Make it yours",
    description: "Add your details, your style and the sections you need.",
    detail:
      "Give guests the information they’ll look for: when to arrive, where to go and what to bring. Add the response and sign-up sections your gathering needs.",
    highlights: ["Schedules and directions", "RSVPs and guest questions", "Potluck and volunteer sign-ups"],
    image: "/images/marketing/birthday-step-details.png",
    imagePosition: "34% 50%",
  },
  {
    title: "Share one link",
    description: "Guests RSVP and find the plan. You keep everything current.",
    detail:
      "Send your event page in a text, email or group chat. Guests can open the link without installing an app, and return to the same page for updates.",
    highlights: ["One page to come back to", "Responses in one place", "Updates on the same link"],
    image: "/images/marketing/birthday-step-share.png",
    imagePosition: "48% 50%",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className={styles.howItWorks} aria-labelledby="landing-how-title">
      <div className={styles.howInner}>
        <div className={styles.howIntro}>
          <div data-motion-reveal>
            <h2 id="landing-how-title">
              <span>Less planning.</span>
              <strong>More celebrating.</strong>
            </h2>
            <a href="#showcase" className={styles.howLink}>
              See an example <ArrowRight size={15} aria-hidden="true" />
            </a>
            <p className={styles.howStatement} data-how-statement>
              <span className={styles.howStatementWords}>
                <span>From idea</span>{" "}
                <strong>to invited.</strong>
              </span>
            </p>
          </div>
        </div>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.title} data-motion-reveal>
              <span className={styles.stepMedia} aria-hidden="true">
                <Image
                  src={step.image}
                  alt=""
                  fill
                  sizes="(max-width: 599px) 104px, (max-width: 800px) 168px, (max-width: 1100px) 144px, 200px"
                  className={styles.stepImage}
                  style={{ objectPosition: step.imagePosition }}
                />
                <span className={styles.stepNumber}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <p className={styles.stepDetail}>{step.detail}</p>
                <ul className={styles.stepHighlights}>
                  {step.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
