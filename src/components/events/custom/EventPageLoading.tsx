import styles from "./custom-event.module.css";

// Mirrors the editor toolbar and the event page hero/sections while a saved page loads.
export default function EventPageLoading() {
  return (
    <main className={styles.editor} aria-busy="true">
      <p role="status" className={styles.srOnly}>
        Opening your event page…
      </p>
      <div className={styles.loading} aria-hidden="true">
        <div className={styles.loadingToolbar}>
          <div className={styles.loadingHeading}>
            <span className={styles.bone} style={{ width: 88, height: 12 }} />
            <span className={styles.bone} style={{ width: 210, height: 28 }} />
          </div>
          <div className={styles.loadingActions}>
            <span className={styles.bonePill} style={{ width: 170 }} />
            <span className={styles.bonePill} style={{ width: 104 }} />
            <span className={styles.bonePill} style={{ width: 112 }} />
            <span className={`${styles.bonePill} ${styles.bonePrimary}`} style={{ width: 108 }} />
          </div>
        </div>
        <div className={styles.loadingPage}>
          <div className={styles.loadingHero}>
            <span className={`${styles.bone} ${styles.loadingArtwork}`} />
            <div className={styles.loadingIntro}>
              <span className={styles.bone} style={{ width: "34%", height: 11 }} />
              <span className={styles.bone} style={{ width: "88%", height: 44 }} />
              <span className={styles.bone} style={{ width: "62%", height: 44 }} />
              <span className={styles.bone} style={{ width: "40%", height: 14, marginTop: 12 }} />
              <span className={styles.bone} style={{ width: "52%", height: 16 }} />
              <span
                className={`${styles.bonePill} ${styles.bonePrimary}`}
                style={{ width: 132, marginTop: 16 }}
              />
            </div>
          </div>
          <div className={styles.loadingSections}>
            {[0, 1].map((index) => (
              <div key={index} className={styles.loadingSection}>
                <span className={styles.bone} style={{ width: 180, height: 24 }} />
                <span className={styles.bone} style={{ width: "100%", height: 12 }} />
                <span className={styles.bone} style={{ width: "92%", height: 12 }} />
                <span className={styles.bone} style={{ width: "70%", height: 12 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
