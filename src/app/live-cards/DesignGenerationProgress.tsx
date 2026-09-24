import { GENERATION_STAGE_LABELS, type GenerationStage } from "@/lib/studio/generation-progress";
import styles from "./design-generation-progress.module.css";

export default function DesignGenerationProgress({
  stage,
  compact = false,
}: {
  stage: GenerationStage;
  compact?: boolean;
}) {
  const stageLabel = GENERATION_STAGE_LABELS[stage];
  return (
    <section className={compact ? styles.compact : styles.panel} aria-label="Design generation">
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
            <h3>Creating your design</h3>
            <p>Keep adding your event details.</p>
          </div>
        </>
      )}
      <div className={styles.progress}>
        <div
          className={styles.track}
          role="progressbar"
          aria-label="Creating your design"
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
