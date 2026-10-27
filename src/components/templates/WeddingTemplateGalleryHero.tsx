import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { artworkInk } from "@/components/events/template-artwork";
import type { PublicTemplate } from "@/lib/public-template-shared";
import { templateEditorHref } from "@/lib/template-categories";
import { trackTemplateEvent } from "@/lib/template-tracking";
import { weddingDesignCatalog } from "@/lib/wedding-designs";
import styles from "./WeddingTemplateGalleryHero.module.css";

const heroDesignIds = ["emerald-garden-vignette", "gilded-wedding", "rustic-boho"];

/** A wedding collection introduction; the complete, filterable catalog follows it. */
export default function WeddingTemplateGalleryHero({
  templates,
  children,
}: {
  templates: PublicTemplate[];
  children?: ReactNode;
}) {
  const designs = heroDesignIds.flatMap((id) => {
    const design = weddingDesignCatalog.find((item) => item.id === id);
    return design && templates.some((template) => template.id === id) ? [design] : [];
  });

  return (
    <header className={styles.hero} data-wedding-template-hero>
      <Image
        className={styles.backdrop}
        src="/images/weddings/templates-hero/plum-silk-garden.webp"
        alt=""
        fill
        priority
        sizes="100vw"
      />
      <div className={styles.heroInner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Wedding templates</p>
          <h1 id="wedding-templates-title" className={styles.title}>
            Your love story
            <br />
            starts here.
          </h1>
          <p className={styles.description}>
            Find a wedding website design that feels like you, then make it your own.
          </p>
          <div className={styles.actions}>{children}</div>
        </div>
        <div
          className={styles.previews}
          role="group"
          aria-label="Featured wedding template designs"
        >
          {designs.map((design, index) => (
            <Link
              key={design.id}
              href={templateEditorHref("weddings", design.id)}
              prefetch={false}
              aria-label={`Customize ${design.name}`}
              data-wedding-hero-template={design.id}
              className={styles.previewCard}
              onClick={() => trackTemplateEvent("template_selected", "weddings", design.id)}
              style={
                {
                  "--preview-paper": design.primaryColor,
                  "--preview-ink": artworkInk(design.primaryColor, design.secondaryColor),
                  "--preview-font": `"${design.headlineFont}", Georgia, serif`,
                } as CSSProperties
              }
            >
              <div
                className={styles.previewContent}
                data-appearance-scope="authored"
                aria-hidden="true"
              >
                <div className={styles.previewNav}>
                  <span>Our story</span>
                  <span>Details</span>
                  <span>RSVP</span>
                </div>
                <div className={styles.previewHeading}>
                  <p className={styles.monogram}>
                    {design.previewNames
                      .split(" & ")
                      .map((name) => name[0])
                      .join(" / ")}
                  </p>
                  <p className={styles.couple}>{design.previewNames}</p>
                  <p className={styles.date}>September 21, 2028</p>
                </div>
                <div className={styles.previewPhoto}>
                  <Image
                    src={design.heroImage}
                    alt=""
                    fill
                    priority={index === 1}
                    sizes="(min-width: 1100px) 25vw, (min-width: 700px) 36vw, 48vw"
                  />
                </div>
                <div className={styles.previewFoot}>
                  <p>
                    {index === 0
                      ? "Forever looks good on us."
                      : index === 1
                        ? "A brighter together."
                        : "Our next beautiful chapter."}
                  </p>
                  <span>
                    We’re so happy
                    <br />
                    you’re here
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
