import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { landingCategoryMedia } from "@/lib/landing-category-media";
import styles from "./LandingArtCollage.module.css";

const artwork = {
  birthdays: {
    title: "Birthdays",
    href: "/birthdays/templates",
    image: landingCategoryMedia.birthdays,
  },
  weddings: {
    title: "Weddings",
    href: "/weddings/templates",
    image: landingCategoryMedia.weddings,
  },
  gender: {
    title: "Gender reveals",
    href: "/gender-reveal/templates",
    image: landingCategoryMedia["gender-reveal"],
  },
  bridal: {
    title: "Bridal showers",
    href: "/bridal-showers/templates",
    image: landingCategoryMedia["bridal-showers"],
  },
  community: {
    title: "Community",
    href: "/signup-forms/templates",
    image: landingCategoryMedia["signup-forms"],
  },
  baby: {
    title: "Baby showers",
    href: "/baby-showers/templates",
    image: landingCategoryMedia["baby-showers"],
  },
  sports: {
    title: "Sports & teams",
    href: "/sport-events/templates",
    image: landingCategoryMedia.sports,
  },
} as const;

// Offsets locate each final cell relative to the board center, in grid units.
const tiles = [
  { area: "birthdays", art: "birthdays", x: 2, y: 1, tilt: -4 },
  { area: "memories", art: null, x: 0.5, y: 0.5, tilt: 3 },
  { area: "weddings", art: "weddings", x: -0.5, y: 0.5, tilt: -3 },
  { area: "people", art: null, x: -1.5, y: 1, tilt: 4 },
  { area: "gender", art: "gender", x: -2.5, y: 0.5, tilt: -4 },
  { area: "bridal", art: "bridal", x: 2.5, y: 0, tilt: 3 },
  { area: "date", art: null, x: 1.5, y: 0, tilt: -3 },
  { area: "community", art: "community", x: -1.5, y: -0.5, tilt: 4 },
  { area: "good", art: null, x: 2, y: -1, tilt: -4 },
  { area: "together", art: null, x: 0.5, y: -1, tilt: 3 },
  { area: "baby", art: "baby", x: -0.5, y: -1, tilt: -3 },
  { area: "sports", art: "sports", x: -2.5, y: -1, tilt: 4 },
] as const;

function TypeTile({ area }: { area: string }) {
  if (area === "memories")
    return (
      <div className={`${styles.typeTile} ${styles.memories}`} data-appearance-scope="authored">
        <p>
          <span>make</span> <strong>memories.</strong>
        </p>
      </div>
    );
  if (area === "people")
    return (
      <div className={`${styles.typeTile} ${styles.people}`} data-appearance-scope="authored">
        <p>
          Your <em>people.</em>
          <br />
          Your <strong>place.</strong>
        </p>
      </div>
    );
  if (area === "date")
    return (
      <div className={`${styles.typeTile} ${styles.date}`} data-appearance-scope="authored">
        <p>Save the date</p>
      </div>
    );
  if (area === "good")
    return (
      <div className={`${styles.typeTile} ${styles.good}`} data-appearance-scope="authored">
        <p>
          Good times <strong>start here.</strong>
        </p>
        <span>A little less planning. A lot more together.</span>
      </div>
    );
  return (
    <div className={`${styles.typeTile} ${styles.together}`} data-appearance-scope="authored">
      <p>
        A little
        <br />
        <strong>more together.</strong>
      </p>
    </div>
  );
}

export default function LandingArtCollage({ className = "" }: { className?: string }) {
  return (
    <section
      className={`${styles.section} ${className}`}
      aria-labelledby="landing-art-collage-title"
      data-art-mosaic
      data-motion-scene
      data-motion-range="contain"
    >
      <div className={styles.stage} data-mosaic-stage>
        <div className={styles.header}>
          <div className={styles.headingGroup}>
            <p className={styles.eyebrow}>A page for the occasion. A place for your people.</p>
            <h2 className={styles.heading} id="landing-art-collage-title">
              Every kind of <em>together.</em>
            </h2>
          </div>
          <p className={styles.intro}>
            Big milestones, little gatherings, and all the moments in between. Find a design that
            feels like your kind of day.
          </p>
        </div>
        <div className={styles.board} data-mosaic-grid>
          {tiles.map((tile, index) => {
            const card = tile.art ? artwork[tile.art] : null;
            return (
              <div
                key={tile.area}
                className={styles.tile}
                data-mosaic-tile={tile.area}
                data-motion-reveal
                style={
                  {
                    gridArea: tile.area,
                    "--gather-x": tile.x,
                    "--gather-y": tile.y,
                    "--tile-tilt": `${tile.tilt}deg`,
                    "--tile-delay": (tiles.length - 1 - index) * 0.02,
                    "--motion-index": index % 3,
                  } as CSSProperties
                }
              >
                {card ? (
                  <Link
                    href={card.href}
                    className={styles.artwork}
                    aria-label={`Browse ${card.title.toLowerCase()} designs`}
                    data-appearance-scope="authored"
                    data-collage-card={tile.art}
                  >
                    <Image
                      src={card.image.src}
                      alt={card.image.alt}
                      fill
                      loading="lazy"
                      sizes={
                        tile.area === "birthdays"
                          ? "(min-width: 1100px) 40vw, (min-width: 600px) 68vw, 100vw"
                          : "(min-width: 1100px) 32vw, (min-width: 600px) 45vw, 65vw"
                      }
                      className={styles.image}
                      style={{ objectPosition: card.image.objectPosition ?? "center" }}
                    />
                    <span className={styles.caption}>
                      {card.title}
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </span>
                  </Link>
                ) : (
                  <TypeTile area={tile.area} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
