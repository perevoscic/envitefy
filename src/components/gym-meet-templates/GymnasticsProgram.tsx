"use client";

import { useId, type ReactNode } from "react";
import type { GymMeetDiscoveryBlock, GymMeetDiscoverySection } from "./types";
import { orderGymnasticsSections, type GymnasticsPresentation } from "./gymnasticsPresentations";
import styles from "./gymnastics-program.module.css";

export default function GymnasticsProgram({
  sections,
  presentation,
  renderBlock,
}: {
  sections: GymMeetDiscoverySection[];
  presentation: GymnasticsPresentation;
  renderBlock: (block: GymMeetDiscoveryBlock) => ReactNode;
}) {
  const instanceId = useId();
  const ordered = orderGymnasticsSections(sections, presentation.flow);
  // useId keeps links local even when multiple previews are mounted together.
  const sectionId = (id: string) => `${instanceId}-program-${id}`;
  if (!ordered.length) return null;

  return (
    <div className={styles.program}>
      {ordered.length > 1 ? (
        <nav className={styles.navigation} aria-label="Meet information sections">
          <span className={styles.indexLabel}>Inside the meet</span>
          <div className={styles.navLinks}>
            {ordered.map((section, index) => (
              <a key={section.id} href={`#${sectionId(section.id)}`}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                {section.navLabel || section.label}
              </a>
            ))}
          </div>
        </nav>
      ) : null}
      <div className={styles.chapters}>
        {ordered.map((section, index) => (
          <section
            key={section.id}
            id={sectionId(section.id)}
            className={styles.chapter}
            data-section-kind={section.kind}
            aria-labelledby={`${sectionId(section.id)}-title`}
            tabIndex={-1}
          >
            <header
              className={`${styles.chapterHeading} ${section.hideSectionHeading ? styles.srOnly : ""}`}
            >
              <span className={styles.chapterNumber} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 id={`${sectionId(section.id)}-title`}>{section.label}</h2>
              <span className={styles.headingRule} aria-hidden="true" />
            </header>
            <div className={styles.blocks}>
              {section.blocks.map((block) => (
                <div key={block.id} className={styles.block} data-block-type={block.type}>
                  {renderBlock(block)}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function GymnasticsPageBody({
  presentation,
  discovery,
  team,
  support,
  attendance,
  footer,
}: {
  presentation: GymnasticsPresentation;
  discovery: ReactNode;
  team: ReactNode;
  support: ReactNode;
  attendance: ReactNode;
  footer: ReactNode;
}) {
  const response = attendance ? <div className={styles.attendance}>{attendance}</div> : null;
  return (
    <main className={styles.body}>
      {presentation.attendance === "opening" ? response : null}
      <div className={styles.bodyColumns} data-has-attendance={Boolean(attendance)}>
        <div className={styles.information}>{discovery}</div>
        {presentation.attendance === "sidebar" ? response : null}
      </div>
      {team || support ? (
        <div className={styles.teamSupport}>
          {team}
          {support}
        </div>
      ) : null}
      {presentation.attendance === "closing" || presentation.attendance === "invitation"
        ? response
        : null}
      {footer}
    </main>
  );
}
