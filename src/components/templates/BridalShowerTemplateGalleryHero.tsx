import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import "@/components/birthdays/redesign/birthday-fonts.css";
import { getThemedEventDesign } from "@/lib/event-page-themed-designs";
import type { PublicTemplate } from "@/lib/public-template-shared";
import { templateEditorHref } from "@/lib/template-categories";
import { trackTemplateEvent } from "@/lib/template-tracking";
import styles from "./BridalShowerTemplateGalleryHero.module.css";

const heroDesigns = [
  {
    id: "bridal-showers--v2-vintage-shower-heirloom-rose-painting",
    heading: "Petals & promises",
    name: "Olivia Martin",
    occasion: "A bridal shower for",
  },
  {
    id: "bridal-showers--v2-vintage-shower-ribbon-at-the-gate",
    heading: "She said yes!",
    name: "Emily Carter",
    occasion: "A bridal shower for",
  },
  {
    id: "bridal-showers--v2-garden-tea-greenhouse-welcome",
    heading: "Love in bloom",
    name: "Sophia Bennett",
    occasion: "Celebrating the bride-to-be",
  },
];

/** App chrome follows appearance; each selectable design retains its authored artwork and colors. */
export default function BridalShowerTemplateGalleryHero({
  templates,
  children,
}: {
  templates: PublicTemplate[];
  children?: ReactNode;
}) {
  const designs = heroDesigns.flatMap((sample) => {
    const design = getThemedEventDesign(sample.id);
    return design && templates.some((template) => template.id === sample.id)
      ? [{ design, sample }]
      : [];
  });

  return (
    <header className={styles.hero} data-bridal-shower-template-hero>
      <Image
        className={`${styles.backdrop} ${styles.lightBackdrop}`}
        src="/images/bridal-showers/templates-hero/bridal-shower-still-life-light.webp"
        alt=""
        fill
        priority
        sizes="100vw"
      />
      <Image
        className={`${styles.backdrop} ${styles.darkBackdrop}`}
        src="/images/bridal-showers/templates-hero/bridal-shower-still-life-dark.webp"
        alt=""
        fill
        sizes="100vw"
      />
      <div className={styles.heroInner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Bridal shower templates</p>
          <h1 id="bridal-shower-templates-title" className={styles.title}>
            A beautiful beginning
            <br />
            for the bride-to-be.
          </h1>
          <p className={styles.description}>
            Share her style, your shower theme, and the special details.
            <br className={styles.desktopBreak} /> Generate a celebration page made just for her.
          </p>
          <div className={styles.actions}>{children}</div>
        </div>
        <div
          className={styles.previews}
          role="group"
          aria-label="Featured bridal shower template designs"
        >
          {designs.map(({ design, sample }, index) => (
            <Link
              key={design.id}
              className={styles.previewCard}
              href={templateEditorHref("bridal-showers", design.id)}
              prefetch={false}
              aria-label={`Customize ${design.name}`}
              data-bridal-shower-hero-template={design.id}
              onClick={() => trackTemplateEvent("template_selected", "bridal-showers", design.id)}
              style={
                {
                  "--preview-paper": design.background,
                  "--preview-ink": design.ink,
                  "--preview-accent": design.accent,
                  "--preview-font": design.font,
                } as CSSProperties
              }
            >
              <div
                className={styles.previewContent}
                data-appearance-scope="authored"
                aria-hidden="true"
              >
                <div className={styles.previewNavigation}>
                  <span>{sample.heading}</span>
                  <span>Details</span>
                  <span>Registry</span>
                  <span>RSVP</span>
                </div>
                {index === 2 && (
                  <div className={styles.invitationIntro}>
                    <p className={styles.invitationHeading}>{sample.heading}</p>
                    <p className={styles.invitationOccasion}>{sample.occasion}</p>
                    <p className={styles.invitationName}>{sample.name}</p>
                  </div>
                )}
                <div className={styles.invitationArtwork}>
                  <Image
                    src={design.artwork}
                    alt=""
                    fill
                    priority={index === 1}
                    sizes="(min-width: 1600px) 310px, (min-width: 700px) 23vw, 47vw"
                  />
                </div>
                {index !== 2 && (
                  <div className={styles.invitationIntro}>
                    <p className={styles.invitationHeading}>{sample.heading}</p>
                    <p className={styles.invitationOccasion}>{sample.occasion}</p>
                    <p className={styles.invitationName}>{sample.name}</p>
                  </div>
                )}
                <div className={styles.invitationDetails}>
                  <span className={styles.invitationRule} />
                  <p>You&apos;re invited to celebrate</p>
                  <p>Love, laughter & happily ever after</p>
                  <span className={styles.invitationHeart}>♡</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
