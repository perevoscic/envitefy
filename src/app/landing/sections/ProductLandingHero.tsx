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
import { useState } from "react";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";
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
  return (
    <section id="landing-hero" className={styles.hero} aria-labelledby="landing-product-title">
      <div className={styles.heroInner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            <span aria-hidden="true" />
            Invitations &amp; event pages
          </p>
          <h1 id="landing-product-title" className={styles.title}>
            <span>Beautiful invites.</span>
            <span>All the details.</span>
            <em>One link.</em>
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
        <SampleEventPage />
      </div>
    </section>
  );
}

const occasions = [
  { label: "Weddings", href: "/weddings" },
  { label: "Birthdays", href: "/birthdays" },
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
  { title: "Start your way", description: "Pick a design, upload a flyer or paste an event link." },
  {
    title: "Make it yours",
    description: "Add your details, your style and the sections you need.",
  },
  {
    title: "Share one link",
    description: "Guests RSVP and find the plan. You keep everything current.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className={styles.howItWorks} aria-labelledby="landing-how-title">
      <div className={styles.howInner}>
        <div className={styles.howIntro}>
          <p className={styles.sectionEyebrow}>Less planning. More celebrating.</p>
          <h2 id="landing-how-title">
            From idea
            <br className={styles.desktopBreak} /> to invited.
          </h2>
        </div>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className={styles.stepNumber} aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
