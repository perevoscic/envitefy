"use client";

import { useState, type RefObject } from "react";
import TemplateArtworkThumbnail, {
  artworkComposition,
} from "@/components/events/TemplateArtworkThumbnail";
import TemplateAutoLoader from "@/components/events/TemplateAutoLoader";
import {
  TemplateMasonryCard,
  TemplateMasonryGrid,
} from "@/components/events/TemplateMasonryGallery";
import CategoryTemplateThumbnail from "@/components/templates/CategoryTemplateThumbnail";
import type { CreationTemplate } from "@/lib/create/creation-template";
import type { TemplateArtwork } from "@/components/events/template-artwork";
import dynamic from "next/dynamic";

const FootballCreationThumbnail = dynamic(() => import("./FootballCreationThumbnail"));
import { getTemplateCategory } from "@/lib/template-categories";

type CreationTemplateGalleryProps = {
  templates: CreationTemplate[];
  previews?: Record<string, TemplateArtwork>;
  onSelect: (template: CreationTemplate) => void;
  compact?: boolean;
  selectedTemplateId?: string;
  scrollRoot?: RefObject<HTMLElement | null>;
};

function CreationTemplatePreview({ template, preview }: { template: CreationTemplate; preview?: TemplateArtwork }) {
  if (preview) return <TemplateArtworkThumbnail design={preview} />;
  if (template.family === "football") return <FootballCreationThumbnail templateId={template.id} />;
  const category = getTemplateCategory(template.category);
  if (category && (template.family === "native" || template.family === "signup")) {
    return (
      <CategoryTemplateThumbnail
        category={category.slug}
        template={{ id: template.id, name: template.title, heroImage: template.imageUrl }}
      />
    );
  }
  return (
    <TemplateArtworkThumbnail
      design={{
        id: template.id,
        name: template.title,
        artwork: template.imageUrl,
        label: template.style || "Event Page",
        background: "#f7f2fa",
        ink: "#342d38",
        accent: "#5f4380",
        font: '"Playfair Display", Georgia, serif',
        composition: artworkComposition(`${template.style} ${template.description}`),
      }}
    />
  );
}

function CreationTemplateGalleryContents({
  templates,
  previews,
  onSelect,
  compact,
  selectedTemplateId,
  scrollRoot,
}: CreationTemplateGalleryProps) {
  const [visibleCount, setVisibleCount] = useState(12);
  return (
    <>
      <TemplateMasonryGrid compact={compact}>
        {templates.slice(0, visibleCount).map((template) => (
          <TemplateMasonryCard
            key={template.id}
            designId={template.id}
            name={template.title}
            selected={template.id === selectedTemplateId}
            onSelect={() => onSelect(template)}
          >
            <CreationTemplatePreview template={template} preview={previews?.[template.id]} />
          </TemplateMasonryCard>
        ))}
      </TemplateMasonryGrid>
      <TemplateAutoLoader
        visibleCount={visibleCount}
        totalCount={templates.length}
        setVisibleCount={setVisibleCount}
        scrollRoot={scrollRoot}
      />
    </>
  );
}

/** Reuse category covers and the original masonry when browsing imported event designs. */
export default function CreationTemplateGallery(props: CreationTemplateGalleryProps) {
  const catalogKey = props.templates
    .map((template) => `${template.family}:${template.category}:${template.id}`)
    .join("|");
  return <CreationTemplateGalleryContents key={catalogKey} {...props} />;
}
