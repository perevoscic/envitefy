"use client";

import type { ReactNode } from "react";
import styles from "./event-place-card.module.css";

/** Imported places keep their details and links without republishing source photography. */
export default function EventPlaceCard({
  name, title, eyebrow, body, highlights, details, action,
}: {
  name: string;
  title?: ReactNode;
  eyebrow?: ReactNode;
  body?: ReactNode;
  highlights?: ReactNode;
  details?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <article className={styles.card} data-place-card>
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
