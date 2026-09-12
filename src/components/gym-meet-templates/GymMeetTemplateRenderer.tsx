"use client";

import GymnasticsScene, { gymnasticsDesignStyle } from "./GymnasticsScene";
import { getGymMeetTemplateMeta, resolveGymMeetTemplateId } from "./registry";
import MeetPageContent from "./renderers/MeetPageContent";
import type { GymMeetPageTemplateMeta, GymMeetTemplateRendererProps } from "./types";
import gymnasticsStyles from "./gymnastics-collection.module.css";
import programStyles from "./gymnastics-program.module.css";
import { GYMNASTICS_PRESENTATIONS } from "./gymnasticsPresentations";

function gymMeetPageVariant(design: GymMeetPageTemplateMeta) {
  return {
    pageClass: gymnasticsStyles.page,
    shellClass: gymnasticsStyles.shell,
    titleClass: gymnasticsStyles.title,
    titleStyle: { fontFamily: `"${design.displayFont}", Georgia, serif` },
    mutedClass: gymnasticsStyles.muted,
    heroPanelClass: gymnasticsStyles.heroPanel,
    chipClass: gymnasticsStyles.chip,
    navShellClass: gymnasticsStyles.navShell,
    navActiveClass: gymnasticsStyles.navActive,
    navIdleClass: gymnasticsStyles.navIdle,
    navFadeClass: "color-mix(in srgb, var(--gym-paper) 82%, transparent)",
    summaryCardClass: programStyles.detailCard,
    sectionClass: programStyles.panel,
    sectionMutedClass: gymnasticsStyles.sectionMuted,
    sectionTitleClass: gymnasticsStyles.sectionTitle,
    primaryButtonClass: gymnasticsStyles.primaryButton,
    secondaryButtonClass: gymnasticsStyles.secondaryButton,
    ledeClass: gymnasticsStyles.lede,
  };
}

export default function GymMeetTemplateRenderer(props: GymMeetTemplateRendererProps) {
  const design = getGymMeetTemplateMeta(resolveGymMeetTemplateId(props.model));
  const presentation = GYMNASTICS_PRESENTATIONS[design.id];

  return (
    <div
      style={gymnasticsDesignStyle(design)}
      className={programStyles.design}
      data-gym-body={design.bodyStyle}
      data-gym-design={design.id}
      data-layout={presentation.layout}
      data-surface={presentation.surface}
      data-heading={presentation.heading}
      data-cards={presentation.cards}
      data-navigation={presentation.navigation}
      data-attendance={presentation.attendance}
    >
      <MeetPageContent
        {...props}
        hero={
          <GymnasticsScene
            model={props.model}
            design={design}
            heroImageAction={props.heroImageAction}
            onHeroImagePositionChange={props.onHeroImagePositionChange}
            onPageTextChange={props.onPageTextChange}
          />
        }
        variant={gymMeetPageVariant(design)}
        presentation={presentation}
      />
    </div>
  );
}
