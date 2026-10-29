import { createRoot } from "react-dom/client";
import GalleryAppCanvas from "./GalleryAppCanvas";
import PublicTemplateGalleryContents from "../../src/components/templates/PublicTemplateGalleryContents";
import TemplateGalleryLayout from "../../src/components/templates/TemplateGalleryLayout";
import { getTemplates } from "../../src/lib/public-template-catalogs/bridal-showers";
import { applyAppearance } from "../../src/lib/appearance";
import { writeTemplateDraft } from "../../src/lib/template-draft-storage";

declare global {
  interface Window {
    __setBridalShowerGalleryAppearance: (theme: "light" | "dark") => void;
  }
}

const query = new URLSearchParams(location.search);
window.__setBridalShowerGalleryAppearance = (theme) => applyAppearance(theme, false);
window.__setBridalShowerGalleryAppearance(query.get("theme") === "light" ? "light" : "dark");

async function start() {
  const templates = getTemplates();
  if (query.has("draft")) {
    await writeTemplateDraft({
      version: 1,
      id: "bridal-gallery-draft",
      category: "bridal-showers",
      templateId: templates[0].id,
      updatedAt: Date.now(),
      snapshot: { title: "Olivia’s bridal shower" },
      assets: {},
    });
  }
  createRoot(document.getElementById("root")!).render(
    <GalleryAppCanvas>
      <TemplateGalleryLayout category="bridal-showers">
        <PublicTemplateGalleryContents
          category="bridal-showers"
          templates={templates}
          featured={query.has("featured")}
        />
      </TemplateGalleryLayout>
    </GalleryAppCanvas>,
  );
}
void start();

