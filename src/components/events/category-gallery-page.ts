import styles from "./category-gallery-page.module.css";
import { resolveGalleryCategory } from "./category-gallery-themes";

/** Scope the category canvas to mounted galleries, including their navigation and safe areas. */
export function categoryGalleryPageClassName(category: string): string {
  return `${styles.page} ${styles[resolveGalleryCategory(category)]}`;
}
