import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { landingHeroGalleries } from "@/lib/landing-hero-galleries";
import { landingCategoryCards } from "../landing-data";
import styles from "./CategoryDirectory.module.css";

const tileImageSizes = {
  weddings: "(min-width: 1536px) 712px, (min-width: 640px) 50vw, 100vw",
  birthdays: "(min-width: 1536px) 712px, (min-width: 640px) 50vw, 100vw",
  "baby-showers":
    "(min-width: 1536px) 348px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  "bridal-showers":
    "(min-width: 1536px) 348px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  "gender-reveal":
    "(min-width: 1536px) 348px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  "signup-forms": "(min-width: 1536px) 590px, (min-width: 1024px) 42vw, 100vw",
  sports: "(min-width: 1536px) 469px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  gymnastics: "(min-width: 1536px) 955px, (min-width: 1024px) 67vw, (min-width: 640px) 50vw, 100vw",
};

export function HeroCategoryStrip() {
  return (
    <nav aria-label="Event categories" className="mt-6">
      <Link
        href="#categories"
        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-md border border-white/28 bg-black/24 px-4 text-xs font-semibold text-white backdrop-blur transition hover:border-white/45 hover:bg-white/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#21170e] motion-reduce:transition-none sm:hidden"
      >
        Browse event types
      </Link>
      <ul className="hidden flex-wrap gap-2 sm:flex">
        {landingCategoryCards.map((card) => (
          <li key={card.id}>
            <Link
              href={card.href}
              className="inline-flex h-9 cursor-pointer items-center rounded-full border border-white/22 bg-black/28 px-3.5 text-[11px] font-semibold tracking-[0.04em] text-white backdrop-blur transition hover:border-white/45 hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
            >
              {card.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function CategoryDirectory() {
  return (
    <section
      id="categories"
      className="scroll-mt-0 border-b border-[#ded2bd] bg-[#fcfbf7] px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24"
    >
      <div className="mx-auto max-w-[90rem]">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#765524]">
            Event types
          </p>
          <h2
            className="mt-4 text-4xl font-light leading-tight text-[#201a23] sm:text-5xl"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Pick the gathering. We will make the page guests actually use.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[#665d68]">
            Every category has its own invitation page, RSVP flow, and host tools. Start where you
            are hosting, then share one link.
          </p>
        </div>

        <div className={styles.mosaic}>
          {landingCategoryCards.map((card) => {
            const image = landingHeroGalleries[card.id][0];
            if (!image) return null;

            return (
              <Link key={card.id} href={card.href} data-category={card.id} className={styles.tile}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes={tileImageSizes[card.id]}
                  className={styles.artwork}
                  style={{
                    objectPosition: "objectPosition" in image ? image.objectPosition : "center",
                  }}
                />
                <div className={styles.scrim} aria-hidden="true" />
                <div className={styles.content}>
                  <p className={styles.eyebrow}>Event page</p>
                  <h3 className={styles.title}>{card.label}</h3>
                  <p className={styles.promise}>{card.promise}</p>
                  <span className={styles.cta}>
                    {card.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
