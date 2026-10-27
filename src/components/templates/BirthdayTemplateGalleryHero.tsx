import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BIRTHDAY_SAMPLES } from "@/data/birthday-samples";
import type { PublicTemplate } from "@/lib/public-template-shared";
import { templateEditorHref } from "@/lib/template-categories";
import { trackTemplateEvent } from "@/lib/template-tracking";
import styles from "./BirthdayTemplateGalleryHero.module.css";

const heroDesignIds = ["dinosaur-dig-lab", "champagne-bow-soiree", "lavender-tea-sixty"];

export default function BirthdayTemplateGalleryHero({
  templates,
  children,
}: {
  templates: PublicTemplate[];
  children?: ReactNode;
}) {
  return (
    <header className={styles.hero} data-birthday-template-hero>
      <Image
        className={`${styles.backdrop} ${styles.lightBackdrop}`}
        src="/images/birthdays/templates-hero/blush-party-v1.webp"
        alt=""
        fill
        priority
        sizes="100vw"
      />
      <Image
        className={`${styles.backdrop} ${styles.darkBackdrop}`}
        src="/templates/birthdays/birthday-gallery-hero-v2.webp"
        alt=""
        fill
        sizes="100vw"
      />
      <div className={styles.heroInner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Birthday templates</p>
          <h1 className={styles.title}>
            Every birthday
            <br />
            deserves a little magic.
          </h1>
          <p className={styles.description}>
            Find a design that fits their personality,
            <br className={styles.desktopBreak} /> then make it your own.
          </p>
          <div className={styles.actions}>{children}</div>
        </div>
        <div
          className={styles.previews}
          role="group"
          aria-label="Featured birthday template designs"
        >
          {heroDesignIds.map((id, index) => {
            const design = templates.find((template) => template.id === id);
            const sample = BIRTHDAY_SAMPLES[id];
            if (!design || !sample) return null;
            return (
              <Link
                key={id}
                className={styles.previewCard}
                href={templateEditorHref("birthdays", id)}
                prefetch={false}
                aria-label={`Customize ${design.name}`}
                data-birthday-hero-template={id}
                onClick={() => trackTemplateEvent("template_selected", "birthdays", id)}
              >
                <div
                  className={styles.previewContent}
                  data-appearance-scope="authored"
                  aria-hidden="true"
                >
                  <div className={styles.invitationHeading}>
                    <p className={styles.invitationEyebrow}>
                      {index === 0
                        ? "Our little explorer is turning"
                        : index === 1
                          ? "Please join us for"
                          : "Cheers to"}
                    </p>
                    {index === 0 ? (
                      <p className={styles.playfulAge}>
                        {"EIGHT".split("").map((letter) => (
                          <span key={letter}>{letter}</span>
                        ))}
                      </p>
                    ) : index === 1 ? (
                      <>
                        <p className={styles.scriptName}>{sample.name}’s</p>
                        <p className={styles.invitationTitle}>
                          Birthday
                          <br />
                          soirée
                        </p>
                      </>
                    ) : (
                      <>
                        <p className={styles.milestone}>{sample.age}</p>
                        <p className={styles.scriptName}>Fabulous years</p>
                      </>
                    )}
                  </div>
                  <div className={styles.invitationPhoto}>
                    <Image
                      src={design.heroImage}
                      alt=""
                      fill
                      priority={index === 1}
                      sizes="(min-width: 1536px) 310px, (min-width: 700px) 24vw, 45vw"
                    />
                  </div>
                  <div className={styles.invitationFooter}>
                    <p className={styles.invitationName}>
                      {index === 1 ? "Good friends. Great drinks." : `${sample.name}’s`}
                      <br />
                      {index === 1
                        ? "Brighter days ahead."
                        : index === 0
                          ? "Birthday party"
                          : "60th birthday"}
                    </p>
                    <p className={styles.invitationVenue}>{sample.venue}</p>
                    <span className={styles.invitationRule} />
                    <p className={styles.invitationSignoff}>
                      {index === 0
                        ? "Dino-sized adventures"
                        : index === 1
                          ? "A little sparkle. A lot to celebrate."
                          : "Beautiful moments. So much more."}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
