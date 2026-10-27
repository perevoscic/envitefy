import { createRoot } from "react-dom/client";
import PublicTemplateGalleryContents from "../../src/components/templates/PublicTemplateGalleryContents";
import TemplateGalleryLayout from "../../src/components/templates/TemplateGalleryLayout";
import { getTemplates as weddingTemplates } from "../../src/lib/public-template-catalogs/weddings";
import { getTemplates as birthdayTemplates } from "../../src/lib/public-template-catalogs/birthdays";
import { applyAppearance } from "../../src/lib/appearance";

declare global {
  interface Window {
    __setWeddingGalleryAppearance: (theme: "light" | "dark") => void;
  }
}

const query = new URLSearchParams(location.search);
const category = location.pathname.startsWith("/birthdays/") ? "birthdays" : "weddings";
window.__setWeddingGalleryAppearance = (theme) => applyAppearance(theme, false);
window.__setWeddingGalleryAppearance(query.get("theme") === "light" ? "light" : "dark");

createRoot(document.getElementById("root")!).render(
  <TemplateGalleryLayout category={category}>
    <PublicTemplateGalleryContents
      category={category}
      templates={category === "weddings" ? weddingTemplates() : birthdayTemplates()}
      featured={query.has("featured")}
    />
  </TemplateGalleryLayout>,
);
