import styles from "./CelebrationLanding.module.css";

type CelebrationPreviewProps = {
  title: string;
  meta: string;
  rows?: ReadonlyArray<{ label: string; value: string }>;
  chips?: readonly string[];
};

/** Authored stationery stays cream in both app appearances. All values are sample content. */
export default function CelebrationPreview({
  title,
  meta,
  rows = [],
  chips = ["RSVP", "Directions", "Calendar"],
}: CelebrationPreviewProps) {
  return (
    <aside
      className={styles.preview}
      data-appearance-scope="authored"
      aria-label="Sample guest page"
    >
      <p className={styles.previewLabel}>A little preview of your page</p>
      <h2 className={styles.previewTitle}>{title}</h2>
      <p className={styles.previewMeta}>{meta}</p>
      {rows.map((row) => (
        <div key={row.label} className={styles.previewRow}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
      <div className={styles.previewChips}>
        {chips.map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>
      <p className={styles.previewNote}>Sample page · Your details make it yours.</p>
    </aside>
  );
}
