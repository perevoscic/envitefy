"use client";
import { ArrowRight, CalendarDays, MapPin, Share2, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MarketingPage from "@/components/marketing/MarketingPage";
import styles from "@/components/marketing/ProductSportsLanding.module.css";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import PublicTemplateGallery from "@/components/templates/PublicTemplateGallery";
import {
  getSportEventPreset,
  SPORT_EVENT_PRESETS,
  type SportEventPreset,
} from "@/lib/sport-event-presets";

const styleOptions = [
  {
    id: "stadium",
    label: "Stadium",
    description: "Big-game contrast and Friday-night energy.",
  },
  {
    id: "club",
    label: "Club",
    description: "A clean team hub for families and players.",
  },
  {
    id: "tournament",
    label: "Tournament",
    description: "Built around schedules, venues, and updates.",
  },
] as const;

const sportsStories = [
  {
    src: "/images/landing/sports/sports-editorial-football.webp",
    alt: "Youth football game under stadium lights",
    label: "Game nights",
    title: "Turn the matchup into a moment",
    body: "Kickoff, tickets, parking, arrival notes, and the latest update—all before families leave home.",
  },
  {
    src: "/images/landing/sports/sports-editorial-basketball.webp",
    alt: "Community basketball game in a packed gym",
    label: "Indoor events",
    title: "Get everyone to the right door",
    body: "Share gym entrances, tipoff times, livestreams, team notes, and last-minute changes.",
  },
  {
    src: "/images/landing/sports/sports-editorial-baseball.webp",
    alt: "Youth baseball game at sunset",
    label: "Season schedules",
    title: "Keep every field in reach",
    body: "Give families one dependable place for field maps, weather notes, schedules, and calendar saves.",
  },
] as const;

const sportsFaqs = [
  {
    question: "Can I use Envitefy for a full season?",
    answer:
      "Yes. Build a season page with the schedule, venues, team notes, calendar actions, and updates in one shareable link.",
  },
  {
    question: "Can I upload a flyer or schedule?",
    answer:
      "Yes. Start from an image, screenshot, PDF, or existing schedule instead of retyping every detail.",
  },
  {
    question: "Can families RSVP or mark player availability?",
    answer:
      "Yes. Collect attendance and availability while keeping event details on the same public page.",
  },
  {
    question: "What happens when a time or field changes?",
    answer:
      "Update the published page so the same team link always carries the current plan, then send an update or reminder.",
  },
  {
    question: "Does Envitefy support tournaments and multi-game days?",
    answer:
      "Yes. Use the tournament direction for schedules, multiple locations, parking, admissions, and day-of updates.",
  },
] as const;

function GameDayPreview({ sport }: { sport: SportEventPreset }) {
  return (
    <div className={styles.sample} data-authored-preview data-appearance-scope="authored">
      <p className={styles.sampleLabel}>Sample game-day page</p>
      <h2>Hawthorne {sport.shortLabel}</h2>
      <p className={styles.sampleMeta}>{sport.opponentPlaceholder} · Saturday evening</p>
      <div className={styles.sampleTabs}>
        {["Game day", "Venue", "Team notes"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className={styles.sampleRows}>
        {[
          ["Players arrive", "6:30 PM"],
          ["Game begins", "7:30 PM"],
          ["Venue", sport.venuePlaceholder],
        ].map(([label, value]) => (
          <div className={styles.sampleRow} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p className={styles.sampleFooter}>
        East entrance · Bring your team colors.
        <br />
        The plan, easy to find before you leave.
      </p>
    </div>
  );
}
export default function SportsLandingPage() {
  const search = useSearchParams();
  const selectedSport = getSportEventPreset(search?.get("sport"));
  const selectedStyle = search?.get("style") || "stadium";
  const primaryHref = "#templates";
  return (
    <MarketingPage tone="sports" className={styles.editorial}>
      <SignedOutPageChrome
        activeBottomNavLabel="Create"
        brandHref="/"
        topNavVariant="transparent-light"
      />
      <main>
        <section id="hero" className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>For teams, families & fans</p>
            <h1 className={styles.title}>
              Your team. <em>One clear plan.</em>
            </h1>
            <p className={styles.description}>
              Every game-day detail in one familiar link. Bring schedules, venues, attendance and
              team notes together so everyone arrives ready.
            </p>
            <div className={styles.actions}>
              <Link href={primaryHref} className={styles.primary}>
                Browse templates <ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/snap?auth=signup" className={styles.secondary}>
                Upload a schedule
              </Link>
            </div>
            <p className={styles.note}>For the whole season, or one big game.</p>
          </div>
          <figure className={styles.visual}>
            <GameDayPreview sport={selectedSport} />
            <figcaption className={styles.caption}>
              Illustrative game details · Built around your sport.
            </figcaption>
          </figure>
        </section>
        <PublicTemplateGallery category="sport-events" featured />
        <section id="features" className={styles.section}>
          <p className={styles.eyebrow}>More time for the team</p>
          <h2>Keep the focus on the game.</h2>
          <p className={styles.intro}>
            When families have the current plan in one place, finding the time, field and parking is
            a little easier.
          </p>
          <div className={styles.grid}>
            {[
              {
                icon: CalendarDays,
                title: "The season, together",
                copy: "Keep matchups, start times and venues in one useful schedule.",
              },
              {
                icon: MapPin,
                title: "An easier arrival",
                copy: "Share field directions, gym entrances, parking and ticket links.",
              },
              {
                icon: Users,
                title: "Your people, in the loop",
                copy: "Keep team notes, attendance and updates beside the event information.",
              },
            ].map(({ icon: Icon, title, copy }) => (
              <article className={styles.item} key={title}>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={styles.section}>
          <p className={styles.eyebrow}>Any field. Any court.</p>
          <h2>A home for every game.</h2>
          <div className={styles.grid}>
            {sportsStories.map((story) => (
              <article key={story.label}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-[45%] rounded-b-2xl">
                  <Image
                    src={story.src}
                    alt={story.alt}
                    fill
                    sizes="(max-width: 767px) 90vw, 30vw"
                    className="object-cover"
                  />
                </div>
                <div className={styles.item}>
                  <p className={styles.eyebrow}>{story.label}</p>
                  <h3>{story.title}</h3>
                  <p>{story.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section id="how-it-works" className={styles.section}>
          <div className={styles.split}>
            <div>
              <p className={styles.eyebrow}>Start with your sport</p>
              <h2>Make it feel like your team.</h2>
              <p className={styles.intro}>
                Explore sports and visual directions, then choose a template and add the details
                your people need. Your choices here only change this preview.
              </p>
              <nav className={styles.actions} aria-label="Sports">
                {SPORT_EVENT_PRESETS.map((sport) => (
                  <Link
                    key={sport.key}
                    href={
                      "/sports?sport=" +
                      sport.key +
                      "&style=" +
                      encodeURIComponent(selectedStyle) +
                      "#how-it-works"
                    }
                    className={sport.key === selectedSport.key ? styles.primary : styles.secondary}
                    aria-current={sport.key === selectedSport.key ? "true" : undefined}
                  >
                    {sport.shortLabel}
                  </Link>
                ))}
              </nav>
            </div>
            <div>
              <p className={styles.eyebrow}>Choose a direction</p>
              <div className={styles.faq}>
                {styleOptions.map((style) => (
                  <Link
                    className={`${styles.item} block py-5`}
                    href={`/sports?sport=${selectedSport.key}&style=${style.id}#how-it-works`}
                    key={style.id}
                    aria-current={style.id === selectedStyle ? "true" : undefined}
                  >
                    <span className="font-semibold">
                      {style.label}
                      {style.id === selectedStyle ? " · Selected" : ""}
                    </span>
                    <p>{style.description}</p>
                  </Link>
                ))}
              </div>
              <div className={styles.actions}>
                <a href={primaryHref} className={styles.primary}>
                  Choose your design <ArrowRight aria-hidden="true" />
                </a>
                <Link href="/gymnastics" className={styles.secondary}>
                  Gymnastics meet pages
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className={styles.section}>
          <p className={styles.eyebrow}>From idea to game day</p>
          <h2>Bring the plan. Share the season.</h2>
          <ol className={styles.grid}>
            {[
              [
                "Choose your design",
                "Find the look for your team, then make the artwork and wording your own.",
              ],
              [
                "Add the details",
                "Upload a schedule or enter the games, locations and team notes. Check everything before saving.",
              ],
              [
                "Publish and share",
                "Give your team one link. Save later changes to that same page as plans move.",
              ],
            ].map(([title, copy], index) => (
              <li className={styles.item} key={title}>
                <span className={styles.number}>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </section>
        <section id="faq" className={styles.section}>
          <p className={styles.eyebrow}>Before the whistle</p>
          <h2>Sports pages, explained.</h2>
          <div className={styles.faq}>
            {sportsFaqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className={styles.closing}>
          <Share2 className="mx-auto mb-5 h-6 w-6" aria-hidden="true" />
          <h2 className={styles.sectionTitle}>Give your team a place to come together.</h2>
          <div className={styles.actions}>
            <a href={primaryHref} className={styles.primary}>
              Browse templates <ArrowRight aria-hidden="true" />
            </a>
            <Link href="/snap?auth=signup" className={styles.secondary}>
              Upload an existing schedule
            </Link>
          </div>
        </section>
      </main>
    </MarketingPage>
  );
}
