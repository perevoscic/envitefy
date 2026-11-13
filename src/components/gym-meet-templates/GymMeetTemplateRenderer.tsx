"use client";
import { activeImportedTheme, importedThemeStyle } from "@/lib/imported-event-design";
import "@/components/event-create/imported-event-theme.css";
import { templateAccentColorCombinations, readImportedEventTheme, importedEventAccentPalette } from "@/lib/imported-event-theme";
import type { CSSProperties } from "react";

import GymnasticsScene, { gymnasticsDesignStyle } from "./GymnasticsScene";
import { getGymMeetTemplateMeta, resolveGymMeetTemplateId } from "./registry";
import MeetPageContent from "./renderers/MeetPageContent";
import type { GymMeetPageTemplateMeta, GymMeetTemplateRendererProps } from "./types";
import gymnasticsStyles from "./gymnastics-collection.module.css";
import programStyles from "./gymnastics-program.module.css";
import { GYMNASTICS_PRESENTATIONS } from "./gymnasticsPresentations";
import { GymnasticsHeroActions } from "./FloatingActionStrip";

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
  const theme = readImportedEventTheme(props.model.importedTheme);
  const choice = theme?.templateColorCombination;
  const combination = choice?.templateId === design.id && choice.index > 0
    ? templateAccentColorCombinations(importedEventAccentPalette(design, theme))[choice.index] : undefined;
  const accentStyle = combination ? {
    "--gym-ui-button": combination.button,
    "--gym-ui-on-button": combination.onButton,
    "--gym-ui-heading": combination.heading,
    "--gym-ui-inverse-heading": combination.inverseHeading,
    "--gym-ui-link": combination.link,
  } as CSSProperties : undefined;

  return (
    <div
      style={{ position: "relative", ...gymnasticsDesignStyle(design), ...importedThemeStyle(theme), ...accentStyle }}
      data-text-canvas=""
      data-gym-color-combination={combination?.index}
      data-generated-event={props.model.generatedFromDiscovery || undefined}
      data-imported-theme={activeImportedTheme(props.model.importedTheme)?.id}
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
            heroActions={!props.suppressActionStrip ? (
              <GymnasticsHeroActions
                onShare={props.onShare}
                calendarLinks={props.calendarLinks}
              />
            ) : null}
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
