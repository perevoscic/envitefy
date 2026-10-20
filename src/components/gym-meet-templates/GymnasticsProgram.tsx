"use client";

import ResponsiveEventNavigation from "@/components/events/ResponsiveEventNavigation";
import { useId, useRef, useState, type ReactNode } from "react";
import type { GymMeetDiscoveryBlock, GymMeetDiscoverySection } from "./types";
import { orderGymnasticsSections, type GymnasticsPresentation } from "./gymnasticsPresentations";
import styles from "./gymnastics-program.module.css";
import type { GymnasticsPageText, GymnasticsPageTextChange } from "@/lib/gymnastics-page-text";
import { useGymnasticsPageText } from "./useGymnasticsPageText";
import {
  EventSectionCanvas,
  useEventSectionBuilder,
  type EventSectionEntry,
} from "@/components/events/EventSectionBuilder";
import {
  gymnasticsSectionEditor,
  orderEventSections,
  type EventSectionLayout,
} from "@/lib/event-section-layout";
import { useEventPageComposition } from "@/components/events/EventPageCompositionContext";
import { eventInformationTabs } from "@/lib/event-information-tabs";

function ProgramPanel({
  tabbed,
  id,
  labelledBy,
  children,
}: {
  tabbed: boolean;
  id: string;
  labelledBy: string;
  children: ReactNode;
}) {
  return tabbed ? (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={labelledBy}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: Tab panels starting with prose need a keyboard focus stop.
      tabIndex={0}
      className={styles.tabPanel}
    >
      {children}
    </div>
  ) : (
    <div className={styles.tabPanel}>{children}</div>
  );
}

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
  const composition = useEventPageComposition();
  const [selectedTab, setSelectedTab] = useState("overview");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const ordered = orderGymnasticsSections(sections, presentation.flow);
  const navigation = orderEventSections(
    [
      ...ordered.map(({ id, label, navLabel }) => ({ id, label, navLabel })),
      ...additionalSections.map(({ id, label }) => ({ id, label, navLabel: label })),
      ...(composition?.value?.sections || []).map(({ id, title }) => ({
        id,
        label: title,
        navLabel: title,
      })),
    ],
    sectionLayout,
  );
  const availableTabs = eventInformationTabs(navigation, sectionLayout);
  const tabbed =
    availableTabs.length > 1 &&
    sections.some((section) =>
      ["schedule-availability", "participating-clubs", "attractions"].includes(section.id),
    );
  const activeTab = availableTabs.find((tab) => tab.id === selectedTab) || availableTabs[0];
  // useId keeps links local even when multiple previews are mounted together.
  const sectionId = (id: string) => `${instanceId}-program-${id}`;
  if (!ordered.length && !additionalSections.length && !builder) return null;

  return (
    <div className={styles.program} data-tabbed={tabbed || undefined}>
      {tabbed ? (
        <ResponsiveEventNavigation
          items={availableTabs.map(tab => ({ ...tab, panelId: `${instanceId}-tab-panel` }))}
          activeId={activeTab?.id}
          onSelect={setSelectedTab}
          tabbed
          ariaLabel="Event information"
          background="var(--gym-paper)"
          foreground="var(--gym-ink)"
        >
          <div className={styles.tabs} role="tablist" aria-label="Event information">
            {availableTabs.map((tab, index) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`${instanceId}-tab-${tab.id}`}
                aria-controls={`${instanceId}-tab-panel`}
                aria-label={tab.label}
                aria-selected={activeTab?.id === tab.id}
                tabIndex={activeTab?.id === tab.id ? 0 : -1}
                ref={(node) => {
                  tabRefs.current[tab.id] = node;
                }}
                onClick={() => setSelectedTab(tab.id)}
                onKeyDown={(event) => {
                  const next =
                    event.key === "ArrowRight"
                      ? (index + 1) % availableTabs.length
                      : event.key === "ArrowLeft"
                        ? (index + availableTabs.length - 1) % availableTabs.length
                        : event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? availableTabs.length - 1
                            : -1;
                  if (next < 0) return;
                  event.preventDefault();
                  setSelectedTab(availableTabs[next].id);
                  tabRefs.current[availableTabs[next].id]?.focus();
                  tabRefs.current[availableTabs[next].id]?.scrollIntoView({
                    block: "nearest",
                    inline: "nearest",
                  });
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </ResponsiveEventNavigation>
      ) : navigation.length > 1 && !builder ? (
        <ResponsiveEventNavigation
          items={navigation.map(section => ({ id: section.id, label: pageTextOverrides?.[`section:${encodeURIComponent(section.id)}:label`] ?? section.navLabel ?? section.label, href: `#${sectionId(section.id)}` }))}
          ariaLabel="Meet information sections"
          background="var(--gym-paper)"
          foreground="var(--gym-ink)"
          renderItem={(item, control) => {
            const source = navigation.find(section => section.id === item.id);
            return pageText(
              `section:${encodeURIComponent(item.id)}:label`, source?.navLabel || source?.label || item.label,
              `${source?.label || item.label} navigation label`, () => control,
            );
          }}
        >
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
        </ResponsiveEventNavigation>
      ) : null}
      <ProgramPanel
        tabbed={tabbed}
        id={`${instanceId}-tab-panel`}
        labelledBy={`${instanceId}-tab-${activeTab?.id}`}
      >
        <EventSectionCanvas
          className={styles.chapters}
          cellClassName={styles.sectionColumn}
          layout={sectionLayout}
          visibleSectionIds={tabbed ? activeTab?.sectionIds : undefined}
          sections={[
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
                    <span
                      className={styles.chapterNumber}
                      aria-hidden="true"
                      hidden={Boolean(builder || sectionLayout)}
                    >
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
            ...additionalSections.map((section) => ({
              ...section,
              content: <div id={sectionId(section.id)}>{section.content}</div>,
            })),
          ]}
        />
      </ProgramPanel>
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
