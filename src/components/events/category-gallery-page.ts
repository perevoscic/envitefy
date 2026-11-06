import styles from "./category-gallery-page.module.css";
import { resolveGalleryCategory } from "./category-gallery-themes";

/** Keep stable category markers on galleries sharing the application canvas. */
export function categoryGalleryPageClassName(category: string): string {
  return `${styles.page} ${styles[resolveGalleryCategory(category)]}`;
}
