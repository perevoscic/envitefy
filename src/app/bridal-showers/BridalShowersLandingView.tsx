"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  Feather,
  Gift,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useMemo, useState } from "react";
import LandingHeroMedia from "@/components/landing/LandingHeroMedia";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import { landingHeroGalleries } from "@/lib/landing-hero-galleries";
import styles from "./BridalShowersLandingView.module.css";

const features = [
  {
    number: "01",
    icon: Feather,
    title: "Bespoke invitation design",
    body: "Refined calligraphy, editorial serif pairings, and foil-inspired finishes set the tone before guests arrive.",
  },
  {
    number: "02",
    icon: LinkIcon,
    title: "One elegant guest link",
    body: "Share the invitation, RSVP, registry, map, calendar, and every host update in one polished place.",
  },
  {
    number: "03",
    icon: Users,
    title: "Effortless hosting",
    body: "Track replies, keep guest details together, and update the plan without sending a new invitation.",
  },
];

const themeOptions = {
  gold: {
    name: "Champagne Gold",
    eyebrow: "Timeless luxury",
    accent: "#9b7e55",
    ink: "#59442e",
    soft: "#f4ede3",
    script: "With love & joy",
  },
  sage: {
    name: "Botanical Sage",
    eyebrow: "Garden high tea",
    accent: "#617b68",
    ink: "#344c3b",
    soft: "#e9efe8",
    script: "Gather in the garden",
  },
  blush: {
    name: "Rose Quartz",
    eyebrow: "Modern romance",
    accent: "#b56772",
    ink: "#6f3842",
    soft: "#f8e7e9",
    script: "A toast to the bride",
  },
} as const;

type ThemeKey = keyof typeof themeOptions;

const collections: Array<{
  key: ThemeKey;
  label: string;
  title: string;
  name: string;
  note: string;
}> = [
  {
    key: "gold",
    label: "Timeless luxury",
    title: "Champagne Gold",
    name: "Sophia",
    note: "October Seventeenth",
  },
  {
    key: "sage",
    label: "Garden high tea",
    title: "Botanical Sage",
    name: "Madeline",
    note: "Brunch among the blooms",
  },
  {
    key: "blush",
    label: "Modern romance",
    title: "Rose Quartz",
    name: "Amelia",
    note: "Champagne & celebration",
  },
];

const testimonials = [
  {
    quote:
      "Our guests kept saying the invitation felt like opening a beautiful piece of stationery. Nearly every RSVP came in by the next morning.",
    initials: "CL",
    name: "Chloe Larson",
    role: "Maid of honor",
  },
  {
    quote:
      "The registry, directions, and brunch details finally lived in one place. It was genuinely the easiest part of planning the shower.",
    initials: "JS",
    name: "Jessica Sinclair",
    role: "Bride",
  },
  {
    quote:
      "It looked custom, felt thoughtful, and saved me from answering the same questions in five different group chats.",
    initials: "AM",
    name: "Amanda Miller",
    role: "Bride & host",
  },
];

function scrollToStudio() {
  document.getElementById("bridal-studio")?.scrollIntoView({ behavior: "smooth" });
}

export default function BridalShowersLandingView() {
  const [theme, setTheme] = useState<ThemeKey>("gold");
  const [name, setName] = useState("Sophia & Emma");
  const [date, setDate] = useState("October 17, 2026 · 11:00 AM");
  const [location, setLocation] = useState("The Rosewood Estate");
  const activeTheme = themeOptions[theme];
  const invitationTitle = useMemo(
    () => (name.trim() ? `${name.trim()}’s Bridal Brunch` : "A Bridal Brunch"),
    [name],
  );
  const previewStyle = {
    "--bridal-preview-accent": activeTheme.accent,
    "--bridal-preview-ink": activeTheme.ink,
    "--bridal-preview-soft": activeTheme.soft,
  } as CSSProperties;

  const selectCollection = (nextTheme: ThemeKey) => {
    setTheme(nextTheme);
    scrollToStudio();
  };

  return (
    <div className={styles.page}>
      <SignedOutPageChrome
        activeBottomNavLabel="Menu"
        brandHref="/"
        topNavVariant="transparent-dark"
      />

      <main>
        <section id="landing-hero" className={styles.hero} aria-labelledby="bridal-hero-title">
          <LandingHeroMedia images={landingHeroGalleries["bridal-showers"]} />
          <div className={styles.heroContent}>
            <p className={`${styles.eyebrow} ${styles.eyebrowLight}`}>
              Bridal shower invitations, beautifully hosted
            </p>
            <h1 id="bridal-hero-title" className={styles.heroTitle}>
              A beautiful beginning
              <span>before “I do.”</span>
            </h1>
            <p className={styles.heroCopy}>
              Turn a garden brunch, afternoon tea, or champagne celebration into one elegant
              guest experience—with the invitation, RSVP, registry, map, and every detail
              together.
            </p>
            <div className={styles.heroActions}>
              <Link className={`${styles.button} ${styles.buttonIvory}`} href="?auth=signup">
                Create your bridal shower
                <ArrowRight aria-hidden="true" />
              </Link>
              <a className={styles.heroTextLink} href="#bridal-collections">
                Explore the collections
              </a>
            </div>
            <div className={styles.heroAssurance}>
              <span>
                <Check aria-hidden="true" /> One shareable link
              </span>
              <span>
                <Check aria-hidden="true" /> Guest-ready in minutes
              </span>
              <span>
                <Check aria-hidden="true" /> No app required
              </span>
            </div>
          </div>
        </section>

        <section className={styles.intro} aria-labelledby="bridal-experience-title">
          <div className={styles.sectionShell}>
            <div className={styles.ornament} aria-hidden="true">
              <span />
              <Sparkles />
              <span />
            </div>
            <p className={styles.eyebrow}>Made for the moment before forever</p>
            <h2 id="bridal-experience-title" className={styles.sectionTitle}>
              Every detail, gathered beautifully.
            </h2>
            <p className={styles.introCopy}>
              Your shower deserves more than a static invitation. Envitefy turns the first
              impression into a living event page guests can return to—from the first RSVP to
              the final toast.
            </p>

            <div className={styles.featureGrid}>
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article className={styles.featureCard} key={feature.number}>
                    <div className={styles.featureTopline}>
                      <span>{feature.number}</span>
                      <i />
                    </div>
                    <div className={styles.featureIcon}>
                      <Icon aria-hidden="true" />
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="bridal-studio" className={styles.studio} aria-labelledby="studio-title">
          <div className={styles.sectionShell}>
            <div className={styles.splitHeading}>
              <div>
                <p className={styles.eyebrow}>The bespoke studio</p>
                <h2 id="studio-title" className={styles.sectionTitle}>
                  See your invitation come to life.
                </h2>
              </div>
              <p>
                Personalize the names, setting, and palette. Your guest-ready page keeps the
                refined feel while making every detail easy to act on.
              </p>
            </div>

            <div className={styles.studioGrid}>
              <form className={styles.studioForm} onSubmit={(event) => event.preventDefault()}>
                <div className={styles.formHeading}>
                  <span>Invitation details</span>
                  <em>Live preview</em>
                </div>

                <label>
                  Bride&apos;s name or names
                  <input value={name} onChange={(event) => setName(event.target.value)} />
                </label>

                <div className={styles.formRow}>
                  <label>
                    Date & time
                    <input value={date} onChange={(event) => setDate(event.target.value)} />
                  </label>
                  <label>
                    Location
                    <input value={location} onChange={(event) => setLocation(event.target.value)} />
                  </label>
                </div>

                <fieldset>
                  <legend>Select a color story</legend>
                  <div className={styles.themePicker}>
                    {(Object.keys(themeOptions) as ThemeKey[]).map((themeKey) => (
                      <button
                        key={themeKey}
                        type="button"
                        className={theme === themeKey ? styles.themeActive : undefined}
                        aria-pressed={theme === themeKey}
                        onClick={() => setTheme(themeKey)}
                      >
                        <span style={{ backgroundColor: themeOptions[themeKey].accent }} />
                        {themeOptions[themeKey].name}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className={styles.formFooter}>
                  <p>Everything stays editable after sharing.</p>
                  <Link className={`${styles.button} ${styles.buttonDark}`} href="?auth=signup">
                    Create guest link
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </form>

              <div className={styles.previewStage} style={previewStyle}>
                <article className={styles.invitationCard}>
                  <p className={styles.invitationEyebrow}>{activeTheme.eyebrow}</p>
                  <div className={styles.monogram}>S</div>
                  <p className={styles.invitationIntro}>Please join us for</p>
                  <h3>{invitationTitle}</h3>
                  <p className={styles.invitationScript}>{activeTheme.script}</p>
                  <div className={styles.invitationRule} aria-hidden="true">
                    <span />
                    <b>◇</b>
                    <span />
                  </div>
                  <div className={styles.invitationDetails}>
                    <p>
                      <CalendarDays aria-hidden="true" />
                      {date || "Date to be announced"}
                    </p>
                    <p>
                      <MapPin aria-hidden="true" />
                      {location || "Location to be announced"}
                    </p>
                  </div>
                  <div className={styles.invitationActions}>
                    <button type="button">RSVP</button>
                    <button type="button">Registry</button>
                    <button type="button">Details</button>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section
          id="bridal-collections"
          className={styles.collections}
          aria-labelledby="collections-title"
        >
          <div className={styles.sectionShell}>
            <div className={styles.centerHeading}>
              <p className={styles.eyebrow}>Curated design suites</p>
              <h2 id="collections-title" className={styles.sectionTitle}>
                Find the feeling of your celebration.
              </h2>
              <p>
                From softly gilded luncheons to garden-grown romance, every suite is designed
                to feel considered from the first open.
              </p>
            </div>

            <div className={styles.collectionGrid}>
              {collections.map((collection) => (
                <article
                  className={`${styles.collectionCard} ${styles[`collection${collection.key}`]}`}
                  key={collection.key}
                >
                  <div className={styles.collectionVisual}>
                    {collection.key === "sage" ? (
                      <>
                        <i className={`${styles.sprig} ${styles.sprigLeft}`} />
                        <i className={`${styles.sprig} ${styles.sprigRight}`} />
                      </>
                    ) : null}
                    <div className={styles.collectionPaper}>
                      <span>{collection.label}</span>
                      <b>{collection.name}</b>
                      <em>{collection.note}</em>
                    </div>
                  </div>
                  <div className={styles.collectionBody}>
                    <div>
                      <p>{collection.label}</p>
                      <h3>{collection.title}</h3>
                    </div>
                    <button type="button" onClick={() => selectCollection(collection.key)}>
                      Explore suite <ArrowRight aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.guestFlow} aria-labelledby="guest-flow-title">
          <div className={styles.sectionShell}>
            <div className={styles.guestFlowGrid}>
              <div>
                <p className={styles.eyebrow}>One link, every answer</p>
                <h2 id="guest-flow-title" className={styles.sectionTitle}>
                  Beautiful for guests. Practical for hosts.
                </h2>
                <p className={styles.guestFlowCopy}>
                  Guests get a polished mobile experience. You get a calm command center for
                  replies, links, and last-minute updates.
                </p>
                <Link className={`${styles.button} ${styles.buttonDark}`} href="?auth=signup">
                  Start your invitation <ArrowRight aria-hidden="true" />
                </Link>
              </div>
              <div className={styles.guestFlowList}>
                <article>
                  <Upload aria-hidden="true" />
                  <div>
                    <span>01</span>
                    <h3>Start with what you have</h3>
                    <p>Upload an invitation or begin with a beautifully guided blank page.</p>
                  </div>
                </article>
                <article>
                  <Gift aria-hidden="true" />
                  <div>
                    <span>02</span>
                    <h3>Add every useful detail</h3>
                    <p>Registry, host note, directions, dress guidance, and calendar actions.</p>
                  </div>
                </article>
                <article>
                  <MessageCircle aria-hidden="true" />
                  <div>
                    <span>03</span>
                    <h3>Share once, update anytime</h3>
                    <p>The same guest link stays current from the first RSVP to brunch day.</p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.testimonials} aria-labelledby="testimonial-title">
          <div className={styles.sectionShell}>
            <div className={styles.centerHeading}>
              <p className={styles.eyebrow}>Celebrated stories</p>
              <h2 id="testimonial-title" className={styles.sectionTitle}>
                Loved by brides and their favorite people.
              </h2>
            </div>
            <div className={styles.testimonialGrid}>
              {testimonials.map((testimonial, index) => (
                <figure key={testimonial.name}>
                  <span className={styles.quoteMark} aria-hidden="true">
                    “
                  </span>
                  <blockquote>{testimonial.quote}</blockquote>
                  <figcaption>
                    <span>{testimonial.initials}</span>
                    <div>
                      <b>{testimonial.name}</b>
                      <small>{testimonial.role}</small>
                    </div>
                  </figcaption>
                  <em>0{index + 1}</em>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-cta-title">
          <div className={styles.finalGlow} />
          <div className={styles.sectionShell}>
            <p className={`${styles.eyebrow} ${styles.eyebrowLight}`}>
              Your celebration starts here
            </p>
            <h2 id="final-cta-title" className={styles.sectionTitle}>
              Make the invitation feel as special as the day.
            </h2>
            <p>
              Create a beautiful bridal shower page in minutes, then share one link guests will
              actually want to open.
            </p>
            <div className={styles.finalActions}>
              <Link className={`${styles.button} ${styles.buttonIvory}`} href="?auth=signup">
                Begin your invitation <ArrowRight aria-hidden="true" />
              </Link>
              <Link className={styles.finalTextLink} href="/snap">
                Upload an existing invite
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
