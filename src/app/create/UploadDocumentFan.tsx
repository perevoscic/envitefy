import styles from "./upload-document-fan.module.css";

const examples = ["birthday", "wedding", "football", "gymnastics"] as const;

/** Illustrative source files only; these never become intake or event data. */
export default function UploadDocumentFan() {
  return (
    <>
      <p className={styles.eyebrow}>Example uploads</p>
      <h2 className={styles.heading}>Start with what you have</h2>
      <div className={styles.fan} data-upload-document-fan aria-hidden="true">
        {examples.map((example) => (
          // The adjacent caption names the examples without reading sample facts.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={example}
            className={styles.document}
            data-upload-document-example={example}
            src={`/images/create/upload-examples/${example}.webp`}
            alt=""
            width={1060}
            height={1484}
            draggable={false}
            decoding="async"
          />
        ))}
      </div>
      <p className={styles.caption}>
        Birthday flyers · Wedding invitations · Football schedules · Meet packets
      </p>
      <p className={styles.intro}>We’ll read the details and open your editor.</p>
    </>
  );
}
