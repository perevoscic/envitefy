"use client";

import type { CSSProperties, ReactNode } from "react";
import styles from "./event-place-card.module.css";

/** Keep substantial guidance together in one full-width card. */
export function contentCardNeedsFullWidth(card: { label?: string; body?: string; items?: string[] }): boolean {
  return (card.body || "").length + (card.items || []).join(" ").length > 480 ||
    (card.items || []).length > 4 || (card.label || "").length > 80;
}

/** Balance comparable information into rows, giving long copy more reading room. */
export function contentCardGridStyle(cards: Array<{ label?: string; body?: string; items?: string[] }>, kind = "details"): CSSProperties {
  const prose = Math.max(0, ...cards.map(card => (card.body || "").length + (card.items || []).join(" ").length));
  const label = Math.max(0, ...cards.map(card => (card.label || "").length));
  const minimum = prose > 600 || label > 65 ? 420 : prose > 240 || label > 36 ? 340 : kind === "attractions" ? 300 : 240;
  const maximum = minimum >= 340 || kind === "attractions" ? 3 : 4;
  let columns = Math.max(1, Math.min(maximum, cards.length));
  // Six short prices read as two balanced rows; five read as 3 + 2.
  if (cards.length > columns && cards.length % columns === 1 && columns > 2) columns--;
  if (cards.length === 6 && columns === 4) columns = 3;
  const gap = kind === "attractions" ? 24 : 16;
  return { gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, max(${minimum}px, calc((100% - ${(columns - 1) * gap}px) / ${columns}))), 1fr))` };
}

/** Give long place names and rate descriptions more reading room before adding a column. */
export function placeCardGridStyle(places: Array<{ name: string; values?: string[] }>): CSSProperties {
  const preferredWidth = places.reduce((width, place) => Math.max(
    width,
    place.name.length * 6.25,
    ...(place.values || []).map(value => value.length * 6.5),
  ), 340);
  return { "--place-card-min": `${Math.min(500, Math.ceil(preferredWidth))}px` } as CSSProperties;
}

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
