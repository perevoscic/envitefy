import { Check } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import styles from "./template-masonry-gallery.module.css";

function tileStyle(id: string): CSSProperties & { "--tile-ratio": number } {
  let hash = 0;
  for (const character of id) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  // Stable design heights avoid repeating cycles that line up across columns.
  return { "--tile-ratio": 0.64 + ((hash % 997) / 997) * 0.6 };
}

export function TemplateMasonryGrid({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <div data-template-masonry-grid data-compact={compact || undefined} className={styles.masonry}>
      {children}
    </div>
  );
}

type CardProps = {
  designId: string;
  name: string;
  children: ReactNode;
  controls?: ReactNode;
  selected?: boolean;
} & (
  | { href: string; onClick?: MouseEventHandler<HTMLAnchorElement> }
  | { onSelect: () => void; disabled?: boolean }
);

export function TemplateMasonryCard(props: CardProps) {
  const { designId, name, children, controls, selected = false } = props;
  return (
    <article
      data-template-masonry-card={designId}
      data-selected={selected || undefined}
      className={styles.tile}
      style={tileStyle(designId)}
    >
      {"href" in props ? (
        <Link
          prefetch={false}
          href={props.href}
          onClick={props.onClick}
          aria-label={`Customize ${name}`}
          className={styles.action}
        />
      ) : (
        <button
          type="button"
          onClick={props.onSelect}
          disabled={props.disabled}
          aria-label={`Select ${name}`}
          aria-pressed={selected}
          className={styles.action}
        />
      )}
      <div className={styles.preview}>{children}</div>
      {selected ? (
        <span className={styles.selected} aria-hidden="true">
          <Check size={18} />
        </span>
      ) : null}
      {controls ? <div className={styles.controls}>{controls}</div> : null}
    </article>
  );
}
