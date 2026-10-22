import { LockKeyhole, Sparkles } from "lucide-react";
import { type CreateGuess, customCategoryForGuess } from "@/lib/create/create-intent";
import {
  type CreationPresentation,
  getCreationPresentation,
} from "@/lib/create/creation-presentation";
import styles from "./create-workspace.module.css";

const neutralPresentation: CreationPresentation = {
  artwork: null,
  description: "A place for your event details",
  previewHeading: "Your event. Beautifully brought together.",
  previewCategory: "Your event page",
  previewTitle: "Something Worth Sharing",
  previewDetails: "Your details, your design, all in one place",
  previewAction: "Event details",
  previewLinks: ["Details", "Location", "Info"],
};

export type CreationInspirationProps = { guess?: CreateGuess | null };

/** A display-only example, using an event type the parent has already authorized. */
export default function CreationInspiration({ guess }: CreationInspirationProps) {
  const presentation = guess ? getCreationPresentation(guess) : neutralPresentation;

  return (
    <aside
      className={styles.previewPane}
      aria-label="Event page design inspiration"
      data-creation-preview-category={guess ? customCategoryForGuess(guess) : undefined}
    >
      <div className={styles.previewCaption}>
        <p className={styles.previewEyebrow}>Made for your moment</p>
        <h2 className={styles.previewTitle}>{presentation.previewHeading}</h2>
      </div>
      <div className={styles.previewScene}>
        <div className={styles.previewBrowser} data-appearance-scope="authored" data-creation-example>
          <div className={styles.previewBrowserBar} aria-hidden="true">
            <span className={styles.previewBrowserDots}>
              <span />
              <span />
              <span />
            </span>
            <span className={styles.previewBrowserAddress}>
              <LockKeyhole size={10} /> envitefy.com
            </span>
          </div>
          <div className={styles.previewHero}>
            {presentation.artwork ? (
              // Native artwork is decorative here; this is an explicitly labeled example.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={presentation.artwork} alt="" loading="lazy" decoding="async" />
            ) : (
              <div className={styles.previewPlaceholder} aria-hidden="true">
                <Sparkles size={40} strokeWidth={1} />
              </div>
            )}
            <span className={styles.previewSampleLabel}>Example event page</span>
          </div>
          <div className={styles.previewBody}>
            <p className={styles.previewCategory}>{presentation.previewCategory}</p>
            <h3 className={styles.previewEventTitle}>{presentation.previewTitle}</h3>
            <p className={styles.previewEventMeta}>{presentation.previewDetails}</p>
            <div className={styles.previewBrowserFooter} aria-hidden="true">
              <span className={styles.previewExampleAction}>{presentation.previewAction}</span>
              <span className={styles.previewExampleLinks}>
                {presentation.previewLinks.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>
      <p className={styles.previewNote}>
        <Sparkles size={14} aria-hidden="true" /> Make it yours. Change the design anytime.
      </p>
    </aside>
  );
}
