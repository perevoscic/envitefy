import styles from "./link-import-preview.module.css";

/** Illustrates the workflow without supplying sample facts to the source reader. */
export default function LinkImportPreview() {
  return (
    <div className={styles.introduction}>
      <p className={styles.eyebrow}>Start with a public link</p>
      <h2 className={styles.heading}>One link. Just the details you need.</h2>
      <div className={styles.preview} aria-hidden="true">
        <img
          className={styles.image}
          src="/images/create/link-import-example.webp"
          width={1536}
          height={1024}
          alt=""
        />
      </div>
    </div>
  );
}
