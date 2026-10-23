import { ArrowRight, Check, Link2 } from "lucide-react";
import styles from "./link-import-preview.module.css";

/** Illustrates the workflow without supplying sample facts to the source reader. */
export default function LinkImportPreview() {
  return (
    <div className={styles.introduction}>
      <p className={styles.eyebrow}>Start with a public link</p>
      <h2 className={styles.heading}>One link. Just the details you need.</h2>
      <div className={styles.preview} aria-hidden="true">
        <div className={styles.sourcePage}>
          <div className={styles.addressBar}>
            <Link2 size={13} />
            <span>Public event page</span>
          </div>
          <div className={styles.sourceContent}>
            <span className={styles.sourceTitle}>All the information</span>
            <span className={styles.sourceDetail}><Check size={13} /> Event details</span>
            <span className={styles.extraDetail}>Full schedule</span>
            <span className={styles.sourceDetail}><Check size={13} /> Venue &amp; directions</span>
            <span className={styles.extraDetail}>More information</span>
          </div>
        </div>
        <ArrowRight className={styles.arrow} size={24} />
        <div className={styles.eventPage}>
          <span className={styles.eventLabel}>Your event page</span>
          <div className={styles.eventArtwork}><Link2 size={22} /></div>
          <span className={styles.eventTitle}>Your event</span>
          <span className={styles.eventDetail}>Date, time &amp; place</span>
          <span className={styles.keptDetails}><Check size={13} /> Details you keep</span>
        </div>
      </div>
      <p className={styles.intro}>
        Paste a public event page, schedule or document. We’ll read the details and
        open your editor.
      </p>
      <p className={styles.guidance} id="link-import-guidance">
        Lots of information in one link? Keep, edit or remove details in the editor
        so your page has only what you need.
      </p>
    </div>
  );
}
