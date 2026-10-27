import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import "@/components/birthdays/redesign/birthday-fonts.css";
import { BABY_SHOWER_DESIGNS } from "@/lib/baby-shower-designs";
import type { PublicTemplate } from "@/lib/public-template-shared";
import { templateEditorHref } from "@/lib/template-categories";
import { trackTemplateEvent } from "@/lib/template-tracking";
import styles from "./BabyShowerTemplateGalleryHero.module.css";

const heroDesignIds = ["alpine-fawn", "cloud-nine-airmail", "peony-parasol"];

/** The collection's invitation artwork keeps its own paper and ink in either app theme. */
export default function BabyShowerTemplateGalleryHero({
  templates,
  children,
}: {
  templates: PublicTemplate[];
  children?: ReactNode;
}) {
  const designs = heroDesignIds.flatMap((id) => {
    const design = BABY_SHOWER_DESIGNS.find((item) => item.id === id);
    return design && templates.some((template) => template.id === id) ? [design] : [];
  });

  return (
    <header className={styles.hero} data-baby-shower-template-hero>
      <Image
        className={`${styles.backdrop} ${styles.lightBackdrop}`}
        src="/images/baby-showers/templates-hero/baby-shower-still-life-light.webp"
        alt=""
        fill
        priority
        sizes="100vw"
      />
      <Image
        className={`${styles.backdrop} ${styles.darkBackdrop}`}
        src="/images/baby-showers/templates-hero/baby-shower-still-life-dark.webp"
        alt=""
        fill
        sizes="100vw"
      />
      <div className={styles.heroInner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Baby showers</p>
          <h1 id="baby-shower-templates-title" className={styles.title}>
            A sweet welcome
            <br />
            for your little one.
          </h1>
          <p className={styles.description}>
            Share your theme, favorite colors, and special details.
            <br className={styles.desktopBreak} /> Generate a baby shower page made for this happy
            beginning.
          </p>
          <div className={styles.actions}>{children}</div>
        </div>
        <div
          className={styles.previews}
          role="group"
          aria-label="Featured baby shower template designs"
        >
          {designs.map((design, index) => (
            <Link
              key={design.id}
              className={styles.previewCard}
              href={templateEditorHref("baby-showers", design.id)}
              prefetch={false}
              aria-label={`Customize ${design.name}`}
              data-baby-shower-hero-template={design.id}
              onClick={() => trackTemplateEvent("template_selected", "baby-showers", design.id)}
              style={
                {
                  "--preview-paper": design.colors.background,
                  "--preview-ink": design.colors.text,
                  "--preview-accent": design.colors.accent,
                } as CSSProperties
              }
            >
              <div
                className={styles.previewContent}
                data-appearance-scope="authored"
                aria-hidden="true"
              >
                {index === 0 && (
                  <div className={styles.woodlandHeading}>
                    <p className={styles.invitationScript}>A</p>
                    <p className={styles.invitationHeading}>Baby shower</p>
                    <p className={styles.invitationSubheading}>for our little one</p>
                  </div>
                )}
                <div className={styles.invitationArtwork}>
                  <Image
                    src={design.heroImage}
                    alt=""
                    fill
                    priority={index === 1}
                    sizes="(min-width: 1536px) 330px, (min-width: 700px) 25vw, 48vw"
                  />
                </div>
                {index === 1 && <p className={styles.cloudHeading}>Oh, baby!</p>}
                {index === 2 && (
                  <div className={styles.floralHeading}>
                    <p className={styles.invitationHeading}>A little</p>
                    <p className={styles.invitationScript}>love</p>
                    <p className={styles.invitationHeading}>is on the way</p>
                  </div>
                )}
                <div className={styles.invitationDetails}>
                  {index === 1 && (
                    <p className={styles.invitationOccasion}>Join us for a baby shower</p>
                  )}
                  <span className={styles.invitationRule} />
                  <p className={styles.invitationDate}>
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    }).format(new Date(`${design.sample.date}T12:00:00Z`))}
                    <span aria-hidden="true"> | </span>
                    {new Intl.DateTimeFormat("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "UTC",
                    }).format(new Date(`${design.sample.date}T${design.sample.time}:00Z`))}
                  </p>
                  <p className={styles.invitationVenue}>{design.sample.venue}</p>
                  <p className={styles.invitationLocation}>
                    {design.sample.city}, {design.sample.state}
                  </p>
                  <span className={styles.invitationHeart} aria-hidden="true">
                    ♡
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
