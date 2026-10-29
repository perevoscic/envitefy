import { createRoot } from "react-dom/client";
import GalleryAppCanvas from "./GalleryAppCanvas";
import PublicTemplateGalleryContents from "../../src/components/templates/PublicTemplateGalleryContents";
import TemplateGalleryLayout from "../../src/components/templates/TemplateGalleryLayout";
import { applyAppearance } from "../../src/lib/appearance";
import { getTemplates } from "../../src/lib/public-template-catalogs/signup-forms";
import { writeTemplateDraft } from "../../src/lib/template-draft-storage";

declare global {
  interface Window {
    __setSignupGalleryAppearance: (theme: "light" | "dark") => void;
  }
}

const query = new URLSearchParams(location.search);
window.__setSignupGalleryAppearance = (theme) => applyAppearance(theme, false);
window.__setSignupGalleryAppearance(query.get("theme") === "light" ? "light" : "dark");

async function start() {
  const templates = getTemplates();
  if (query.has("draft")) {
    await writeTemplateDraft({
      version: 1,
      id: "signup-gallery-draft",
      category: "signup-forms",
      templateId: templates[0].id,
      updatedAt: Date.now(),
      snapshot: { title: "Neighborhood potluck" },
      assets: {},
    });
  }
  createRoot(document.getElementById("root")!).render(
    <GalleryAppCanvas>
      <TemplateGalleryLayout category="signup-forms">
        <PublicTemplateGalleryContents
          category="signup-forms"
          templates={templates}
          featured={query.has("featured")}
          customThemeRequested={query.has("customTheme")}
          customThemeExpired={query.has("expired")}
        />
      </TemplateGalleryLayout>
    </GalleryAppCanvas>,
  );
}
void start();
