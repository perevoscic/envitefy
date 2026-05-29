import type {
  AdStudioCampaign,
  ExportPackage,
  VeoPromptPackage,
} from "@/lib/admin/ad-studio/types";

function srtTime(second: number): string {
  const hours = Math.floor(second / 3600);
  const minutes = Math.floor((second % 3600) / 60);
  const seconds = Math.floor(second % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds,
  ).padStart(2, "0")},000`;
}

function buildCaptions(campaign: AdStudioCampaign): string {
  return campaign.script.scenes
    .map((scene, index) => {
      const start = campaign.veoPromptPackage?.timingMap[index]?.startSecond ?? index * 3;
      const end =
        campaign.veoPromptPackage?.timingMap[index]?.endSecond ?? start + scene.durationSeconds;
      return `${index + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${scene.voiceover}\n`;
    })
    .join("\n");
}

function buildMarkdownBrief(campaign: AdStudioCampaign): string {
  const brief = campaign.campaignBrief;
  return `# ${brief.campaignTitle}

## Summary
${brief.adSummary}

## Strategy
- Target audience: ${brief.targetAudience}
- Pain point: ${brief.painPoint}
- Emotional trigger: ${brief.emotionalTrigger}
- Benefit: ${brief.benefit}
- CTA: ${brief.cta}
- Suggested platform: ${brief.suggestedPlatform}
- Suggested length: ${brief.suggestedVideoLength} seconds

## Script
${campaign.script.scenes
  .map(
    (scene) =>
      `- ${scene.timestamp} ${scene.purpose}: ${scene.onScreenText} VO: ${scene.voiceover}`,
  )
  .join("\n")}
`;
}

function buildVeoPromptText(promptPackage: VeoPromptPackage): string {
  return [
    "# Master Veo Prompt",
    promptPackage.masterPrompt,
    "# Per-Scene Prompts",
    ...promptPackage.perScenePrompts.map(
      (scene) => `## Scene ${scene.sceneNumber}\n${scene.prompt}`,
    ),
    "# Format-Specific Prompts",
    `## Vertical 9:16\n${promptPackage.formatSpecificPrompts.vertical}`,
    `## Horizontal 16:9\n${promptPackage.formatSpecificPrompts.horizontal}`,
    `## Square 1:1\n${promptPackage.formatSpecificPrompts.square}`,
  ].join("\n\n");
}

export function buildExportPackage(campaign: AdStudioCampaign): ExportPackage {
  const campaignJsonSnapshot: AdStudioCampaign = { ...campaign, exportPackage: null };
  const promptPackage =
    campaign.veoPromptPackage ||
    ({
      masterPrompt: "",
      perScenePrompts: [],
      timingMap: [],
      transitionInstructions: "",
      cameraMotionInstructions: "",
      overlayCaptionInstructions: "",
      finalCtaInstructions: "",
      formatSpecificPrompts: { vertical: "", horizontal: "", square: "" },
    } satisfies VeoPromptPackage);
  return {
    campaignJson: JSON.stringify(campaignJsonSnapshot, null, 2),
    markdownBrief: buildMarkdownBrief(campaign),
    veoPromptText: buildVeoPromptText(promptPackage),
    voiceoverScript: campaign.script.voiceoverScript,
    captionsSrt: buildCaptions(campaign),
    captionFile: "exports/captions.srt",
    campaignJsonFile: "exports/campaign.json",
    markdownFile: "exports/campaign-brief.md",
    veoPromptFile: "exports/veo-prompts.txt",
    voiceoverFile: "exports/voiceover.txt",
    ctaCopy: campaign.campaignBrief.cta,
  };
}
