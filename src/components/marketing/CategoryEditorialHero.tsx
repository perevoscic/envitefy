import { ArrowDownRight, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import styles from "./CategoryEditorialHero.module.css";
import { categoryLandingThemes, type EditorialCategory } from "./category-landing-themes";
import type { MarketingHeroProps } from "./MarketingHero";
import PublicCreationLink from "./PublicCreationLink";

/** Shared editorial rhythm, with a different photographic and stationery treatment per occasion. */
export default function CategoryEditorialHero({
  category,
  lead,
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  primaryHref,
  primaryLabel,
  primaryRequiresAccount,
  secondaryHref,
  secondaryLabel,
  children,
  id = "landing-hero",
}: MarketingHeroProps & { category: EditorialCategory }) {
  const theme = categoryLandingThemes[category];
  const artwork = image ? { src: image, alt: imageAlt || "" } : theme.artwork;
  const PrimaryLink = primaryRequiresAccount ? PublicCreationLink : Link;

  return (
    <>
      <section
        id={id}
        className={styles.hero}
        data-marketing-hero
        data-category-hero={category}
        aria-labelledby={`${id}-title`}
      >
        <div className={styles.shell}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <div className={styles.stage}>
            <h1 id={`${id}-title`} className={styles.title} data-motion-reveal>
              {title}
            </h1>
            <div className={styles.media} data-motion-reveal>
              <div className={styles.colorField} aria-hidden="true" />
              <div className={styles.photo}>
                <Image
                  src={theme.photo.src}
                  alt={theme.photo.alt}
                  fill
                  priority
                  sizes="(min-width: 1100px) 36vw, (min-width: 720px) 48vw, 85vw"
                  style={{ objectPosition: theme.photo.objectPosition }}
                />
              </div>
              {artwork && (
                <div className={styles.artwork}>
                  <Image
                    src={artwork.src}
                    alt={artwork.alt}
                    fill
                    sizes="(min-width: 1100px) 14vw, (min-width: 720px) 20vw, 34vw"
                  />
                </div>
              )}
            </div>
            <div className={styles.copy} data-motion-reveal>
              <p className={styles.lead}>{lead || theme.lead}</p>
              <p className={styles.description}>{description}</p>
              <div className={styles.actions}>
                <PrimaryLink href={primaryHref} className={styles.primary}>
                  {primaryLabel}
                  <ArrowRight size={17} aria-hidden="true" />
                </PrimaryLink>
                {secondaryHref && secondaryLabel && (
                  <Link href={secondaryHref} className={styles.secondary}>
                    {secondaryLabel}
                    <ArrowDownRight size={17} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          </div>
          <ul className={styles.details} aria-label="At a glance">
            {theme.details.map((detail, index) => (
              <li key={detail}>
                <span aria-hidden="true">0{index + 1}</span>
                {detail}
              </li>
            ))}
          </ul>
        </div>
      </section>
      {children && (
        <section className={styles.preview} data-category-preview={category}>
          <div className={styles.previewShell}>
            <div className={styles.previewCopy} data-motion-reveal>
              <p className={styles.eyebrow}>{theme.previewLabel}</p>
              <h2>{theme.previewTitle}</h2>
              <p>{theme.previewDescription}</p>
            </div>
            <div className={styles.previewStage} data-motion-reveal>
              {children}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
