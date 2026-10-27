"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";
import { landingCategoryMedia } from "@/lib/landing-category-media";
import { landingCategoryCards } from "../landing-data";
import styles from "./LandingCategoryCollection.module.css";

const categoryColors = [
  "#482b3e",
  "#853652",
  "#e9b7c9",
  "#eedcd8",
  "#b9cddf",
  "#e8ddcc",
  "#8b9e8b",
  "#6f8d9b",
];

export default function LandingCategoryCollection() {
  const [fragmentTargeted, setFragmentTargeted] = useState(false);

  useEffect(() => {
    // Client routing can mount this collection after pushState without setting CSS :target.
    const syncFragment = () =>
      setFragmentTargeted(
        window.location.hash === "#categories" || window.location.hash === "#examples",
      );
    syncFragment();
    window.addEventListener("hashchange", syncFragment);
    window.addEventListener("popstate", syncFragment);
    return () => {
      window.removeEventListener("hashchange", syncFragment);
      window.removeEventListener("popstate", syncFragment);
    };
  }, []);

  return (
    <section
      id="examples"
      className={styles.collection}
      aria-labelledby="template-heading"
      data-category-collection
      data-category-targeted={fragmentTargeted ? "true" : undefined}
      data-motion-scene
      data-motion-range="contain"
    >
      <span id="categories" className={styles.anchor} aria-hidden="true" />
      <div className={styles.stage} data-category-stage>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Made for your kind of gathering</p>
            <h2 id="template-heading" className={styles.heading}>
              Find a design that feels like you.
            </h2>
          </div>
          <p className={styles.introduction}>
            Big milestones, little get-togethers and everything worth bringing people together for.
          </p>
        </div>
        <div className={styles.grid}>
          {landingCategoryCards.map((card, index) => {
            const artwork = landingCategoryMedia[card.id];
            return (
              <Link
                key={card.id}
                href={card.href}
                className={styles.card}
                data-category={card.id}
                data-motion-scene
                data-motion-range="read"
                aria-label={card.cta}
                style={
                  {
                    "--category-index": index,
                    "--category-color": categoryColors[index],
                  } as CSSProperties
                }
              >
                <div className={styles.window}>
                  <div className={styles.arch} data-category-arch>
                    <Image
                      src={artwork.src}
                      alt={artwork.alt}
                      fill
                      sizes="(min-width: 1280px) 13vw, (min-width: 600px) 25vw, 112px"
                      className={styles.image}
                      style={{
                        objectPosition: artwork.objectPosition ?? "center",
                      }}
                    />
                    <span className={styles.cover} data-category-cover aria-hidden="true" />
                  </div>
                </div>
                <div className={styles.copy}>
                  <div className={styles.labelRow}>
                    <h3 className={styles.title}>{card.label}</h3>
                    <ArrowRight size={16} aria-hidden="true" />
                  </div>
                  <p className={styles.description}>{card.promise}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
