import { Check } from "lucide-react";
import Link from "next/link";
import {
  Children,
  type CSSProperties,
  isValidElement,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import styles from "./template-masonry-gallery.module.css";

function tileRatio(id: string): number {
  let hash = 0;
  for (const character of id) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  // Stable design heights avoid repeating cycles that line up across columns.
  return 0.64 + ((hash % 997) / 997) * 0.6;
}

export function TemplateMasonryGrid({
  children,
  compact = false,
  alignBottoms = false,
  desktopColumns = 4,
}: {
  children: ReactNode;
  compact?: boolean;
  alignBottoms?: boolean;
  desktopColumns?: 4 | 5;
}) {
  const layouts = [2, 4, 5].map((columns) => ({
    columns,
    heights: Array<number>(columns).fill(0),
    counts: Array<number>(columns).fill(0),
  }));

  const items = Children.toArray(children);
  const placements = items.map(() => ({} as CSSProperties & Record<`--${string}`, number>));
  for (const layout of layouts) {
    const lastItems = Array<number>(layout.columns).fill(-1);
    items.forEach((child, index) => {
      if (!isValidElement<CardProps>(child)) return;
      // Keep the varied design heights and place each next card in the
      // shortest column, just as in the full template gallery.
      const column = layout.heights.indexOf(Math.min(...layout.heights));
      const placement = placements[index];
      placement[`--column-${layout.columns}`] = column + 1;
      placement[`--height-${layout.columns}`] = layout.heights[column];
      placement[`--count-${layout.columns}`] = layout.counts[column];
      layout.heights[column] += 1 / tileRatio(child.props.designId);
      layout.counts[column] += 1;
      lastItems[column] = index;
    });
    if (alignBottoms) {
      const height = Math.max(...layout.heights);
      const count = Math.max(...layout.counts);
      lastItems.forEach((index, column) => {
        if (index < 0) return;
        // Extend only the final artwork in each column. Include the border,
        // inset and gap difference when columns have different card counts.
        placements[index][`--extension-height-${layout.columns}`] = height - layout.heights[column];
        placements[index][`--extension-count-${layout.columns}`] = count - layout.counts[column];
      });
    }
  }

  return (
    <div data-template-masonry-grid data-compact={compact || undefined} data-align-bottoms={alignBottoms || undefined} data-desktop-columns={desktopColumns} className={styles.masonry}>
      {items.map((child, index) => {
        if (!isValidElement<CardProps>(child)) return child;
        // Calculate both responsive layouts before paint. Appending a batch
        // only adds below existing cards; CSS columns would rebalance them.
        return (
          <div key={child.key} className={styles.slot} style={placements[index]}>
            {child}
          </div>
        );
      })}
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
      style={{ "--tile-ratio": tileRatio(designId) } as CSSProperties}
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
