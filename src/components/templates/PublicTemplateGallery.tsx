"use client";

import dynamic from "next/dynamic";
import type { TemplateCategory } from "@/lib/template-categories";
// Load the shared mosaic frame with the page, before a category's lazy preview
// chunk arrives. Otherwise its server-rendered cards can paint at full width.
import "@/components/events/template-masonry-gallery.module.css";

export type PublicTemplateGalleryProps = {
  category: TemplateCategory;
  featured?: boolean;
  customThemeRequested?: boolean;
  customThemeExpired?: boolean;
};

// Each gallery keeps server-rendered thumbnails while downloading only its category.
const galleries = {
  "weddings": dynamic(() => import("./category-galleries/weddings")),
  "birthdays": dynamic(() => import("./category-galleries/birthdays")),
  "anniversaries": dynamic(() => import("./category-galleries/anniversaries")),
  "baby-showers": dynamic(() => import("./category-galleries/baby-showers")),
  "bridal-showers": dynamic(() => import("./category-galleries/bridal-showers")),
  "gender-reveal": dynamic(() => import("./category-galleries/gender-reveal")),
  "gymnastics": dynamic(() => import("./category-galleries/gymnastics")),
  "sport-events": dynamic(() => import("./category-galleries/sport-events")),
  "signup-forms": dynamic(() => import("./category-galleries/signup-forms")),
};

export { default as PublicTemplatePreview } from "./CategoryTemplateThumbnail";

export default function PublicTemplateGallery(props: PublicTemplateGalleryProps) {
  const Gallery = galleries[props.category];
  return <Gallery {...props} />;
}
