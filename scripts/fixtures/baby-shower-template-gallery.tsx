import { createRoot } from "react-dom/client";
import PublicTemplateGalleryContents from "../../src/components/templates/PublicTemplateGalleryContents";
import TemplateGalleryLayout from "../../src/components/templates/TemplateGalleryLayout";
import { getTemplates } from "../../src/lib/public-template-catalogs/baby-showers";
import { applyAppearance } from "../../src/lib/appearance";
import { writeTemplateDraft } from "../../src/lib/template-draft-storage";

declare global {
  interface Window {
    __setBabyShowerGalleryAppearance: (theme: "light" | "dark") => void;
  }
}

const query = new URLSearchParams(location.search);
window.__setBabyShowerGalleryAppearance = (theme) => applyAppearance(theme, false);
window.__setBabyShowerGalleryAppearance(query.get("theme") === "light" ? "light" : "dark");

async function start() {
  const templates = getTemplates();
  if (query.has("draft")) {
    await writeTemplateDraft({
      version: 1,
      id: "baby-gallery-draft",
      category: "baby-showers",
      templateId: templates[0].id,
      updatedAt: Date.now(),
      snapshot: { babyName: "Olive" },
      assets: {},
    });
  }
  createRoot(document.getElementById("root")!).render(
    <TemplateGalleryLayout category="baby-showers">
      <PublicTemplateGalleryContents
        category="baby-showers"
        templates={templates}
        featured={query.has("featured")}
      />
    </TemplateGalleryLayout>,
  );
}
void start();

