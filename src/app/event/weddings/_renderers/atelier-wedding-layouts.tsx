import type { CSSProperties, ReactNode } from "react";
import {
  buildWeddingLocationHref,
  Footer,
  type EventData,
  type ThemeConfig,
} from "./content-sections";
import styles from "./atelier-wedding-layouts.module.css";

export type AtelierWeddingLayoutId =
  | "tuscan-lemon-grove"
  | "delft-blue-estate"
  | "meadow-reverie"
  | "desert-modernism"
  | "chateau-toile"
  | "riviera-stripes"
  | "japanese-ink"
  | "disco-afterglow"
  | "palm-springs-mod"
  | "highland-romance"
  | "terracotta-courtyard"
  | "lake-como-letter"
  | "cherry-blossom-silk"
  | "french-patisserie"
  | "ocean-cyanotype"
  | "art-deco-soiree"
  | "prairie-wildflower"
  | "red-thread"
  | "moonstone-minimal"
  | "tropical-afterdark";

type Props = {
  layout: AtelierWeddingLayoutId;
  theme: ThemeConfig;
  event: EventData & { customHeroImage?: string };
};

const introductions: Record<AtelierWeddingLayoutId, string> = {
  "tuscan-lemon-grove": "La dolce vita, together",
  "delft-blue-estate": "A day to treasure",
  "meadow-reverie": "Love grows here",
  "desert-modernism": "A love without limits",
  "chateau-toile": "The pleasure of your company",
  "riviera-stripes": "Meet us by the sea",
  "japanese-ink": "A quiet kind of forever",
  "disco-afterglow": "All love. All night.",
  "palm-springs-mod": "Good times, great love",
  "highland-romance": "Where our hearts wander",
  "terracotta-courtyard": "Under a warmer sky",
  "lake-como-letter": "A love letter from the lake",
  "cherry-blossom-silk": "A season for us",
  "french-patisserie": "Life is sweeter together",
  "ocean-cyanotype": "Drawn to the same tide",
  "art-deco-soiree": "An extraordinary evening",
  "prairie-wildflower": "Wild hearts, wide skies",
  "red-thread": "It was always you",
  "moonstone-minimal": "Simply, us",
  "tropical-afterdark": "When the garden comes alive",
};

const programTitles: Record<AtelierWeddingLayoutId, string> = {
  "tuscan-lemon-grove": "The celebration",
  "delft-blue-estate": "Order of the day",
  "meadow-reverie": "A day in bloom",
  "desert-modernism": "The itinerary",
  "chateau-toile": "The programme",
  "riviera-stripes": "Your weekend, beautifully planned",
  "japanese-ink": "Moments to share",
  "disco-afterglow": "The lineup",
  "palm-springs-mod": "The good-time guide",
  "highland-romance": "Follow our path",
  "terracotta-courtyard": "Gather with us",
  "lake-como-letter": "Notes for your diary",
  "cherry-blossom-silk": "As the day unfolds",
  "french-patisserie": "A little taste of the day",
  "ocean-cyanotype": "The tide of the day",
  "art-deco-soiree": "The evening programme",
  "prairie-wildflower": "A day to keep",
  "red-thread": "One thing leads to another",
  "moonstone-minimal": "The essentials",
  "tropical-afterdark": "Into the evening",
};

function Names({ event }: { event: EventData }) {
  const title =
    event.headlineTitle ||
    [event.couple?.partner1, event.couple?.partner2].filter(Boolean).join(" & ") ||
    "Your Names";
  const names = title.split(/\s*&\s*/);
  return (
    <h1 className={styles.names}>
      {names.map((name, index) => (
        <span key={`${name}-${index}`}>
          {index > 0 && <em className={styles.ampersand}> & </em>}
          {name}
        </span>
      ))}
    </h1>
  );
}

function dateLabel(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
}

function Meta({ event }: { event: EventData }) {
  return (
    <div className={styles.meta}>
      {event.date && <p>{dateLabel(event.date)}</p>}
      {event.location && <p>{event.location}</p>}
    </div>
  );
}

function Art({
  src,
  className = "",
  position,
}: {
  src: string;
  className?: string;
  position?: string;
}) {
  return (
    <div className={`${styles.art} ${className}`}>
      {src && (
        <img className="template-hero-image"
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ objectPosition: position }}
        />
      )}
    </div>
  );
}

function Hero({
  layout,
  event,
  image,
}: {
  layout: AtelierWeddingLayoutId;
  event: EventData;
  image: string;
}) {
  const invitation = (
    <div className={styles.invitation}>
      <p className={styles.eyebrow}>{introductions[layout]}</p>
      <Names event={event} />
      <Meta event={event} />
      {event.tagline && <p className={styles.tagline}>{event.tagline}</p>}
    </div>
  );
  const art = <Art src={image} />;
  let composition: ReactNode;
  switch (layout) {
    case "tuscan-lemon-grove":
      composition = (
        <>
          <div className={styles.triptych}>
            <Art src={image} position="left" />
            <Art src={image} />
            <Art src={image} position="right" />
          </div>
          {invitation}

        </>
      );
      break;
    case "delft-blue-estate":
      composition = (
        <>
          <div className={styles.medallion}>{art}</div>
          {invitation}
          <div className={styles.ornament} aria-hidden="true">
            ✧
          </div>
        </>
      );
      break;
    case "meadow-reverie":
      composition = (
        <>
          {art}
          <div className={styles.floatingNote}>{invitation}</div>
        </>
      );
      break;
    case "desert-modernism":
      composition = (
        <>
          <span className={styles.edition} aria-hidden="true">
            THE
            <br />
            WEDDING
          </span>
          <div className={styles.offsetImage}>{art}</div>
          {invitation}

        </>
      );
      break;
    case "chateau-toile":
      composition = (
        <div className={styles.gatefold}>
          {art}
          <div className={styles.stationery}>{invitation}</div>
        </div>
      );
      break;
    case "riviera-stripes":
      composition = (
        <>
          <div className={styles.postcard}>
            {art}
            <p className={styles.caption}>{event.location || "With love, from us"}</p>
          </div>
          {invitation}
        </>
      );
      break;
    case "japanese-ink":
      composition = (
        <>
          <div className={styles.scrollArt}>{art}</div>
          <div className={styles.scrollNote}>{invitation}</div>
        </>
      );
      break;
    case "disco-afterglow":
      composition = (
        <>
          <div className={styles.spotlight}>
            {art}
            <span className={styles.star} aria-hidden="true">
              ✦
            </span>
          </div>
          {invitation}

        </>
      );
      break;
    case "palm-springs-mod":
      composition = (
        <>
          <div className={styles.poolPanel}>{art}</div>
          {invitation}
          <div className={styles.sun} aria-hidden="true" />
        </>
      );
      break;
    case "highland-romance":
      composition = (
        <>
          {art}
          <div className={styles.landscapeNote}>{invitation}</div>
          <p className={styles.landscapeCaption}>{event.location}</p>
        </>
      );
      break;
    case "terracotta-courtyard":
      composition = (
        <>
          <div className={styles.keyhole}>{art}</div>
          {invitation}
        </>
      );
      break;
    case "lake-como-letter":
      composition = (
        <>
          <div className={styles.letterhead}>{art}</div>
          <div className={styles.letter}>
            {invitation}
            <span className={styles.letterSeal} aria-hidden="true">
              &amp;
            </span>
          </div>
        </>
      );
      break;
    case "cherry-blossom-silk":
      composition = (
        <>
          <div className={styles.fan}>{art}</div>
          {invitation}

        </>
      );
      break;
    case "french-patisserie":
      composition = (
        <>
          <div className={styles.confection}>{art}</div>
          {invitation}
        </>
      );
      break;
    case "ocean-cyanotype":
      composition = (
        <>
          <div className={styles.specimen}>
            {art}
            <p className={styles.caption}>A study in togetherness</p>
          </div>
          {invitation}
        </>
      );
      break;
    case "art-deco-soiree":
      composition = (
        <>
          <div className={styles.decoPortal}>{art}</div>
          <div className={styles.marquee}>{invitation}</div>

        </>
      );
      break;
    case "prairie-wildflower":
      composition = (
        <>
          <div className={styles.patchwork}>
            <Art src={image} position="left" />
            <div className={styles.quiltSquare} aria-hidden="true">
              ✳
            </div>
            <Art src={image} position="right" />
          </div>
          {invitation}
        </>
      );
      break;
    case "red-thread":
      composition = (
        <>
          <div className={styles.threadImage}>{art}</div>
          {invitation}

          <p className={styles.runningTitle}>Together, from this day on.</p>
        </>
      );
      break;
    case "moonstone-minimal":
      composition = (
        <>
          <p className={styles.cornerNote}>The beginning of forever</p>
          <div className={styles.stoneCircle}>{art}</div>
          {invitation}
        </>
      );
      break;
    case "tropical-afterdark":
      composition = (
        <div className={styles.shutters}>
          <Art src={image} position="left" />
          {invitation}
          <Art src={image} position="right" />
        </div>
      );
      break;
  }
  return <header className={styles.hero}>{composition}</header>;
}

function Details({ layout, event }: { layout: AtelierWeddingLayoutId; event: EventData }) {
  const photos = event.photos?.length
    ? event.photos
    : (event.gallery || [])
        .map((photo) => photo.url || photo.src || photo.preview)
        .filter((src): src is string => Boolean(src));
  const locationHref = buildWeddingLocationHref(event);
  const configuredRsvpHref = event.rsvpLink || event.rsvp?.url;
  const rsvpHref = configuredRsvpHref?.startsWith("#") ? null : configuredRsvpHref;
  return (
    <div className={styles.details}>
      {event.guestTools}
      <div className={styles.storyAndSchedule}>
        {event.story && (
          <section id="atelier-story" className={styles.story}>
            <p className={styles.eyebrow}>A little about us</p>
            <h2>Our story</h2>
            <p className={styles.prose}>{event.story}</p>
          </section>
        )}
        {!!event.schedule?.length && (
          <section id="atelier-schedule" className={styles.program}>
            <p className={styles.eyebrow}>Join us for every moment</p>
            <h2>{programTitles[layout]}</h2>
            <ol className={styles.schedule}>
              {event.schedule.map((item, index) => (
                <li key={`${item.title}-${index}`}>
                  <span className={styles.number} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className={styles.time}>{item.time || item.date}</p>
                    <h3>{item.title}</h3>
                    <p className={styles.place}>{item.location}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
      {!!photos?.length && (
        <section id="atelier-photos" className={styles.photoSection} aria-label="Our photos">
          <p className={styles.eyebrow}>A few favourite memories</p>
          <div className={styles.photos}>
            {photos.map((src, index) => (
              <img
                key={`${src}-${index}`}
                src={src}
                alt={`Wedding memory ${index + 1}`}
                loading="lazy"
              />
            ))}
          </div>
        </section>
      )}
      <div className={styles.practical}>
        {!!event.party?.length && (
          <section>
            <p className={styles.eyebrow}>Our favourite people</p>
            <h2>Wedding party</h2>
            <ul className={styles.party}>
              {event.party.map((person, index) => (
                <li key={`${person.name}-${index}`}>
                  <h3>{person.name}</h3>
                  <p>{person.role}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
        {(event.travel || locationHref) && (
          <section id="atelier-travel">
            <p className={styles.eyebrow}>Make yourself at home</p>
            <h2>Getting here</h2>
            {event.travel && <p className={styles.prose}>{event.travel}</p>}
            {locationHref && (
              <a className={styles.textLink} href={locationHref} target="_blank" rel="noreferrer">
                Get directions <span aria-hidden="true">↗</span>
              </a>
            )}
          </section>
        )}
        {event.thingsToDo && (
          <section>
            <p className={styles.eyebrow}>Stay a little longer</p>
            <h2>Around town</h2>
            <p className={styles.prose}>{event.thingsToDo}</p>
          </section>
        )}
      </div>
      {(event.registry?.length || event.registryNote || event.rsvpEnabled) && (
        <section className={styles.guestActions} id="rsvp">
          <p className={styles.eyebrow}>We cannot wait to celebrate with you</p>
          {event.registryNote && <p className={styles.prose}>{event.registryNote}</p>}
          {event.rsvpEnabled && (
            <>
              <h2>Will you join us?</h2>
              {event.rsvp?.deadline && <p>Please reply by {dateLabel(event.rsvp.deadline)}.</p>}
              {rsvpHref ? (
                <a className={styles.button} href={rsvpHref}>
                  RSVP
                </a>
              ) : (
                <p>RSVP details will be shared here soon.</p>
              )}
            </>
          )}
          {!!event.registry?.length && (
            <div className={styles.registry}>
              {event.registry.map((item, index) => (
                <a
                  key={`${item.url}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.textLink}
                >
                  {item.label || "View registry"} <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default function AtelierWeddingLayout({ layout, theme, event }: Props) {
  const firstPhoto = event.gallery?.find((photo) => photo.url || photo.src || photo.preview);
  const image =
    event.customHeroImage ||
    firstPhoto?.url ||
    firstPhoto?.src ||
    firstPhoto?.preview ||
    theme.decorations?.heroImage ||
    "";
  const themeStyle = {
    "--paper": theme.colors.primary,
    "--ink": theme.colors.secondary,
    "--display": theme.fonts.headline,
    fontFamily: theme.fonts.body,
  } as CSSProperties;
  return (
    <div className={styles.website} data-atelier-layout={layout} style={themeStyle}>
      <nav className={styles.nav} aria-label="Wedding website">
        <span className={styles.navLabel}>Our wedding</span>
        {event.story && <a href="#atelier-story">Our story</a>}
        {!!event.schedule?.length && <a href="#atelier-schedule">The day</a>}
        {!!(event.photos?.length || event.gallery?.length) && <a href="#atelier-photos">Photos</a>}
        {(event.travel || buildWeddingLocationHref(event)) && <a href="#atelier-travel">Travel</a>}
        {event.rsvpEnabled && <a href="#rsvp">RSVP</a>}
      </nav>
      <Hero layout={layout} event={event} image={image} />
      <Details layout={layout} event={event} />
      <Footer theme={theme} event={event} backgroundColor={theme.colors.primary} />
    </div>
  );
}
