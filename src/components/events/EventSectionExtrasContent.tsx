import {
  normalizeEventSectionExtras,
  safeEventSectionLink,
  safeEventSectionPhotoUrl,
  type EventSectionExtras,
} from "@/lib/event-section-extras";
import styles from "./event-section-extras.module.css";

export default function EventSectionExtrasContent({ value }: { value: EventSectionExtras }) {
  const extras = normalizeEventSectionExtras(value);
  if (extras.kind === "photos" && extras.photos?.length) {
    return (
      <div className={styles.gallery}>
        {extras.photos.map((photo, index) => {
          const url = safeEventSectionPhotoUrl(photo.url);
          return url ? (
            <figure key={`${url}-${index}`}>
              <img
                src={url}
                alt={photo.caption || `Event photo ${index + 1}`}
                loading="lazy"
                decoding="async"
              />
              {photo.caption && <figcaption>{photo.caption}</figcaption>}
            </figure>
          ) : null;
        })}
      </div>
    );
  }
  if (extras.kind === "links") {
    const links = (extras.links || []).filter((link) => safeEventSectionLink(link.url));
    if (!links.length) return null;
    return (
      <ul className={styles.links}>
        {links.map((link, index) => (
          <li key={`${link.url}-${index}`}>
            <a href={safeEventSectionLink(link.url)} target="_blank" rel="noopener noreferrer">
              {link.label.trim() || link.url}
            </a>
          </li>
        ))}
      </ul>
    );
  }
  return null;
}
