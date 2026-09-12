import type { CSSProperties } from "react";
import CategoryGalleryArtwork from "./CategoryGalleryArtwork";
import { CATEGORY_GALLERY_THEMES, resolveGalleryCategory } from "./category-gallery-themes";
import styles from "./category-gallery-backdrop.module.css";

type BackdropStyle = CSSProperties & {
  "--gallery-base": string;
  "--gallery-fade": string;
  "--gallery-wash": string;
  "--gallery-glow": string;
  "--gallery-ink": string;
  "--gallery-accent": string;
};

/** Decorative header layer only; its parent must be relative and content must sit above it. */
export default function CategoryGalleryBackdrop({
  category,
  baseColor = "var(--category-gallery-background, #fffcfa)",
  fadeColor = "var(--category-gallery-background, #fbf8f5)",
}: {
  category: string;
  baseColor?: string;
  fadeColor?: string;
}) {
  const key = resolveGalleryCategory(category);
  const theme = CATEGORY_GALLERY_THEMES[key];
  const style: BackdropStyle = {
    // Keep artwork out of document flow while its CSS module loads during navigation.
    position: "absolute",
    inset: 0,
    zIndex: 0,
    overflow: "hidden",
    pointerEvents: "none",
    "--gallery-base": baseColor,
    "--gallery-fade": fadeColor,
    "--gallery-wash": theme.wash,
    "--gallery-glow": theme.glow,
    "--gallery-ink": theme.ink,
    "--gallery-accent": theme.accent,
  };

  return (
    <div className={styles.backdrop} style={style} data-gallery-category={key} aria-hidden="true">
      <div className={styles.wash} />
      <CategoryGalleryArtwork kind={theme.artwork} className={styles.artwork} />
      <div className={styles.fade} />
    </div>
  );
}
