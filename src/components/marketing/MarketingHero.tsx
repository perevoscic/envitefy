import { ArrowDownRight, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import PublicCreationLink from "./PublicCreationLink";
import styles from "./marketing.module.css";

export type MarketingHeroProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  image?: string;
  imageAlt?: string;
  primaryHref: string;
  primaryLabel: string;
  primaryRequiresAccount?: boolean;
  secondaryHref?: string;
  secondaryLabel?: string;
  children?: ReactNode;
  id?: string;
};

export default function MarketingHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt = "",
  primaryHref,
  primaryLabel,
  primaryRequiresAccount = false,
  secondaryHref,
  secondaryLabel,
  children,
  id = "landing-hero",
}: MarketingHeroProps) {
  return (
    <section id={id} className={styles.hero} data-marketing-hero>
      <div className={styles.heroCopy} data-motion-reveal>
        <p className={styles.eyebrow}>
          <span aria-hidden="true" />
          {eyebrow}
        </p>
        <h1 className={styles.heroTitle}>{title}</h1>
        <p className={styles.heroDescription}>{description}</p>
        <div className={styles.heroActions}>
          {primaryRequiresAccount ? (
            <PublicCreationLink href={primaryHref} className={styles.primaryAction}>
              {primaryLabel}
              <ArrowRight size={17} aria-hidden="true" />
            </PublicCreationLink>
          ) : (
            <Link href={primaryHref} className={styles.primaryAction}>
              {primaryLabel}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          )}
          {secondaryHref && secondaryLabel && (
            <Link href={secondaryHref} className={styles.secondaryAction}>
              {secondaryLabel}
              <ArrowDownRight size={17} aria-hidden="true" />
            </Link>
          )}
        </div>
        <p className={styles.heroFootnote}>Made to share. Easy to open.</p>
      </div>
      {(image || children) && (
        <div className={styles.heroVisual} data-motion-reveal>
          {image && (
            <div className={styles.heroImage}>
              <Image
                src={image}
                alt={imageAlt}
                fill
                priority
                sizes="(min-width: 900px) 44vw, 90vw"
              />
            </div>
          )}
          {children && <div className={styles.heroPreview}>{children}</div>}
          <div className={styles.visualMark} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
    </section>
  );
}
