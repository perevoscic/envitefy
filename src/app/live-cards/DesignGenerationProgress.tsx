import { GENERATION_STAGE_LABELS, type GenerationStage } from "@/lib/studio/generation-progress";
import styles from "./design-generation-progress.module.css";

export default function DesignGenerationProgress({
  stage,
  compact = false,
  title = "Creating your design",
  description = "Keep adding your event details.",
  statusText,
  mockTitle,
  mockOpeningLine,
}: {
  stage: GenerationStage;
  compact?: boolean;
  title?: string;
  description?: string;
  statusText?: string;
  mockTitle?: string;
  mockOpeningLine?: string;
}) {
  const stageLabel = statusText || GENERATION_STAGE_LABELS[stage];
  return (
    <section className={compact ? styles.compact : styles.panel} aria-label="Design generation">
      {mockTitle && <div className={styles.mockWording} role="group" aria-label="Temporary wording preview">
        <small>Temporary wording preview</small>
        {mockOpeningLine?.trim() && <p>{mockOpeningLine}</p>}
        <strong>{mockTitle}</strong>
      </div>}
      {!compact && (
        <>
          <div className={styles.cardStack} aria-hidden="true">
            <div className={styles.backCard} />
            <div className={styles.frontCard}>
              <div className={styles.cardArt}>
                <span className={styles.cardSun} />
                <span className={styles.cardCurve} />
              </div>
              <div className={styles.cardLines}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
          <div className={styles.copy}>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </>
      )}
      <div className={styles.progress}>
        <div
          className={styles.track}
          role="progressbar"
          aria-label={title}
          aria-valuetext={stageLabel}
        >
          <span className={styles.sweep} />
        </div>
        <p role="status" className={styles.stage}>
          {stageLabel}
        </p>
      </div>
    </section>
  );
}
