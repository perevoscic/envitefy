import { informationForCreation, creationComposition } from "./creation-information";
import { readTemplateDraft, writeTemplateDraft, type DraftValue, type EditorSnapshot, type TemplateDraft } from "../template-draft-storage";
import { getTemplateCategory } from "../template-categories";
import { discoveryTargetForSport } from "./create-intent";
import { writeCreationIntake, type CreationIntake } from "./creation-intake";
import type { CreationTemplate } from "./creation-template";

/** This prepares a browser draft only. Explicit editor Save/Publish owns server persistence. */
export async function prepareCreationEditor(intake: CreationIntake, template: CreationTemplate): Promise<string> {
  const guess = intake.guess || intake.classification;
  const changingFamily = intake.editorFamily && intake.editorFamily !== template.family;
  const current = await writeCreationIntake({ ...intake, phase: "editor", selectedTemplateId: template.id, editorFamily: template.family, ...(changingFamily ? { editorSnapshot: undefined, eventId: undefined } : {}) });
  if (["native", "football"].includes(template.family) && intake.discoveryEventId && guess?.category === "sports" && guess.sport) {
    const url = new URL(discoveryTargetForSport(guess.sport).builderHref(intake.discoveryEventId), "https://envitefy.local");
    url.searchParams.set("templateId", template.id);
    if (guess.sport !== "gymnastics" && guess.sport !== "football") url.searchParams.set("style", template.id.split("--")[1] || "stadium");
    url.searchParams.set("intake", current.id);
    return url.pathname + url.search;
  }
  const url = new URL(template.href, "https://envitefy.local");
  if (current.eventId) { url.searchParams.set("edit", current.eventId); return url.pathname + url.search; }
  url.searchParams.set("intake", current.id);
  if (template.family === "native" || template.family === "signup") {
    const category = getTemplateCategory(template.category);
    if (!category) throw new Error("This design could not be opened. Choose another design.");
    const previous = await readTemplateDraft(category.slug, current.id);
    if (previous?.ownerId && previous.ownerId !== current.ownerId) throw new Error("Sign in to the account that started this event.");
    const snapshot: EditorSnapshot = previous?.category === category.slug ? previous.snapshot : {};
    if (!previous) {
      snapshot.creationInformation = JSON.parse(JSON.stringify(informationForCreation(current))) as DraftValue;
      const composition = creationComposition(current.information);
      if (composition) snapshot.pageComposition = JSON.parse(JSON.stringify(composition)) as DraftValue;
      if (category.slug === "signup-forms") {
        const { creationSignupForm } = await import("./editor-handoff");
        snapshot.form = JSON.parse(JSON.stringify(creationSignupForm(current.information, template.id))) as DraftValue;
      }
    }
    const draft: TemplateDraft = { version: 1, id: current.id, ownerId: current.ownerId, category: category.slug, templateId: previous?.templateId || template.id, updatedAt: Date.now(), snapshot, assets: previous?.assets || {} };
    await writeTemplateDraft(draft);
    url.searchParams.set("draft", draft.id);
  }
  if (template.family === "custom" && !current.customPage) throw new Error("Create a design before opening this event page.");
  return url.pathname + url.search;
}

