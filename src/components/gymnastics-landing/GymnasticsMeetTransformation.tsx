import ArrowFillLink from "@/components/ui/ArrowFillLink";
import GymnasticsMeetComparison from "./GymnasticsMeetComparison";
import styles from "./GymnasticsMeetTransformation.module.css";

export default function GymnasticsMeetTransformation() {
  return (
    <section id="preview" className={styles.section} aria-labelledby="meet-preview-title">
      <div className={styles.layout} data-testid="gymnastics-transformation-layout">
        <div className={styles.copy} data-testid="gymnastics-transformation-copy">
          <p className={styles.eyebrow}>From packet to page</p>
          <h2 id="meet-preview-title" className={styles.title}>
            Same details.
            <em>A clearer plan.</em>
          </h2>
          <dl className={styles.explanation}>
            <div>
              <dt>
                <span>Before</span>A PDF to search through.
              </dt>
              <dd>
                Families zoom and scroll to find the date, the venue and the details that matter to
                them.
              </dd>
            </div>
            <div>
              <dt>
                <span>After</span>A page everyone can follow.
              </dt>
              <dd>
                Bring dates, directions and meet notes into clear sections. Review, publish and
                share one link. Save updates to that same page as plans change.
              </dd>
            </div>
          </dl>
          <ArrowFillLink
            href="/gymnastics/templates"
            className={styles.createLink}
            label="Create your meet page"
          />
        </div>
        <GymnasticsMeetComparison />
      </div>
    </section>
  );
}
