"use client";

import { useId, type ReactNode } from "react";
import type { GymMeetDiscoveryBlock, GymMeetDiscoverySection } from "./types";
import { orderGymnasticsSections, type GymnasticsPresentation } from "./gymnasticsPresentations";
import styles from "./gymnastics-program.module.css";
import type { GymnasticsPageText, GymnasticsPageTextChange } from "@/lib/gymnastics-page-text";
import { useGymnasticsPageText } from "./useGymnasticsPageText";
import { EventSectionCanvas, useEventSectionBuilder, type EventSectionEntry } from "@/components/events/EventSectionBuilder";
import { gymnasticsSectionEditor, orderEventSections, type EventSectionLayout } from "@/lib/event-section-layout";

export default function GymnasticsProgram({
  sections,
  presentation,
  renderBlock,
  pageTextOverrides,
  onPageTextChange,
  sectionLayout,
  additionalSections = [],
}: {
  sections: GymMeetDiscoverySection[];
  presentation: GymnasticsPresentation;
  renderBlock: (block: GymMeetDiscoveryBlock) => ReactNode;
  pageTextOverrides?: GymnasticsPageText;
  onPageTextChange?: GymnasticsPageTextChange;
  sectionLayout?: EventSectionLayout;
  additionalSections?: EventSectionEntry[];
}) {
  const pageText = useGymnasticsPageText(pageTextOverrides, onPageTextChange);
  const instanceId = useId();
  const builder = useEventSectionBuilder();
  const ordered = orderGymnasticsSections(sections, presentation.flow);
  const navigation = orderEventSections([
    ...ordered.map(({ id, label, navLabel }) => ({ id, label, navLabel })),
    ...additionalSections.map(({ id, label }) => ({ id, label, navLabel: label })),
  ], sectionLayout);
  // useId keeps links local even when multiple previews are mounted together.
  const sectionId = (id: string) => `${instanceId}-program-${id}`;
  if (!ordered.length && !additionalSections.length && !builder) return null;

  return (
    <div className={styles.program}>
      {navigation.length > 1 && !builder ? (
        <nav className={styles.navigation} aria-label="Meet information sections">
          <span className={styles.indexLabel}>{pageText("programIndex", "Inside the meet")}</span>
          <div className={styles.navLinks}>
            {navigation.map((section, index) =>
              pageText(
                `section:${encodeURIComponent(section.id)}:label`,
                section.navLabel || section.label,
                `${section.label} navigation label`,
                (text) => (
                  <a href={`#${sectionId(section.id)}`} aria-label={text || section.label}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    {text || section.navLabel || section.label}
                  </a>
                ),
              ),
            )}
          </div>
        </nav>
      ) : null}
      <EventSectionCanvas className={styles.chapters} layout={sectionLayout} sections={[
        ...ordered.map((section, index) => ({
          id: section.id,
          label: section.label,
          editorId: gymnasticsSectionEditor(section.id, section.kind),
          content: (
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
              <span className={styles.chapterNumber} aria-hidden="true" hidden={Boolean(builder || sectionLayout)}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 id={`${sectionId(section.id)}-title`}>
                {section.hideSectionHeading
                  ? (pageTextOverrides?.[`section:${encodeURIComponent(section.id)}:label`] ??
                    section.label)
                  : pageText(
                      `section:${encodeURIComponent(section.id)}:label`,
                      section.label,
                      `${section.label} section heading`,
                    )}
              </h2>
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
          ),
        })),
        ...additionalSections.map((section) => ({ ...section, content: <div id={sectionId(section.id)}>{section.content}</div> })),
      ]} />
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
