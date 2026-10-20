"use client";

import { useState, type ReactNode } from "react";
import { websitePhotoUrl } from "@/lib/discovery/event-website";
import styles from "./event-place-card.module.css";

/** Shared by imported event pages; an unavailable photo never hides the place's details. */
export default function EventPlaceCard({
  name, imageUrl, title, eyebrow, body, highlights, details, action,
}: {
  name: string;
  imageUrl?: string | null;
  title?: ReactNode;
  eyebrow?: ReactNode;
  body?: ReactNode;
  highlights?: ReactNode;
  details?: ReactNode;
  action?: ReactNode;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const photo = websitePhotoUrl(imageUrl || "");
  return (
    <article className={styles.card} data-place-card data-has-photo={Boolean(photo && failedImage !== photo)}>
      {photo && failedImage !== photo ? (
        <div className={styles.photo}>
          {/* Source photos retain their original colors and proportions. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt={name} width={720} height={450} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailedImage(photo)} />
        </div>
      ) : null}
      <div className={styles.content}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h4 className={styles.title}>{title ?? name}</h4>
        {body ? <div className={styles.description}>{body}</div> : null}
        {highlights ? <dl className={styles.highlights}>{highlights}</dl> : null}
        {details ? <dl className={styles.details}>{details}</dl> : null}
        {action ? <div className={styles.action}>{action}</div> : null}
      </div>
    </article>
  );
}
