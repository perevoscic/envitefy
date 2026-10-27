import { createRoot } from "react-dom/client";
import PublicTemplateGalleryContents from "../../src/components/templates/PublicTemplateGalleryContents";
import TemplateGalleryLayout from "../../src/components/templates/TemplateGalleryLayout";
import { getTemplates } from "../../src/lib/public-template-catalogs/birthdays";
import { applyAppearance } from "../../src/lib/appearance";

declare global {
  interface Window {
    __setBirthdayGalleryAppearance: (theme: "light" | "dark") => void;
  }
}

const query = new URLSearchParams(location.search);
window.__setBirthdayGalleryAppearance = (theme) => applyAppearance(theme, false);
window.__setBirthdayGalleryAppearance(query.get("theme") === "light" ? "light" : "dark");

createRoot(document.getElementById("root")!).render(
  <TemplateGalleryLayout category="birthdays">
    <PublicTemplateGalleryContents
      category="birthdays"
      templates={getTemplates()}
      featured={query.has("featured")}
    />
  </TemplateGalleryLayout>,
);
