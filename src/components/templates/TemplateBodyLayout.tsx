"use client";
import { Children, type CSSProperties, Fragment, isValidElement, type ReactNode } from "react";
import EventPageSections, { eventPageSectionEntries } from "@/components/events/EventPageSections";
import { useEventPageComposition } from "@/components/events/EventPageCompositionContext";
import { celebrationMaterialStyle, getCelebrationDirection } from "./celebration-materials";
import materialStyles from "./celebration-materials.module.css";
import styles from "./template-body-layout.module.css";

export type BodyPresentation = {
  layout:
    | "editorial"
    | "stagger"
    | "columns"
    | "poster"
    | "mosaic"
    | "ledger"
    | "gallery"
    | "path"
    | "book"
    | "terraces"
    | "rail"
    | "islands";
  surface:
    | "arch"
    | "ticket"
    | "frame"
    | "petal"
    | "cut"
    | "capsule"
    | "ruled"
    | "bracket"
    | "offset"
    | "double"
    | "wave"
    | "bound"
    | "oval"
    | "notch"
    | "terrace"
    | "scallop"
    | "pennant"
    | "stone"
    | "facet"
    | "outline";
  heading: "masthead" | "side" | "ribbon" | "caption" | "number" | "underline";
  flow: "invitation" | "memories" | "practical" | "people";
  borderRadius?: string;
  spacing?: "airy" | "compact" | "balanced";
  surfaceTone?: "paper" | "dark" | "tinted";
};

export type BodySection = { id: string; content: ReactNode; label?: string; editorId?: string };

const flows: Record<BodyPresentation["flow"], string[]> = {
  invitation: [
    "story",
    "details",
    "schedule",
    "hosts",
    "notes",
    "gallery",
    "map",
    "registry",
    "rsvp",
  ],
  memories: [
    "gallery",
    "story",
    "details",
    "hosts",
    "schedule",
    "map",
    "notes",
    "registry",
    "rsvp",
  ],
  practical: [
    "details",
    "schedule",
    "map",
    "story",
    "notes",
    "hosts",
    "gallery",
    "registry",
    "rsvp",
  ],
  people: ["story", "hosts", "gallery", "details", "schedule", "notes", "map", "registry", "rsvp"],
};

const spacing = {
  airy: { gap: "clamp(2rem, 4cqi, 4rem)", padding: "clamp(1.5rem, 4cqi, 3rem)" },
  balanced: { gap: "clamp(1.5rem, 3cqi, 3rem)", padding: "clamp(1.25rem, 3cqi, 2.25rem)" },
  compact: { gap: "clamp(1.125rem, 2cqi, 2rem)", padding: "clamp(1rem, 2cqi, 1.5rem)" },
};
const surfaceTint = {
  paper: "color-mix(in srgb, currentColor 2%, transparent)",
  dark: "color-mix(in srgb, currentColor 6%, transparent)",
  tinted: "color-mix(in srgb, currentColor 10%, transparent)",
};

function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flatten(child.props.children)
      : [child],
  );
}

/** Layout only: keep the existing content, controls, IDs and guest behaviour. */
export default function TemplateBodyLayout({
  presentation,
  design,
  sections,
  children,
  className = "",
  fallbackClassName,
  style,
}: {
  presentation?: BodyPresentation;
  design?: { category: string; id?: string | null };
  sections?: BodySection[];
  children?: ReactNode;
  className?: string;
  fallbackClassName?: string;
  style?: CSSProperties;
}) {
  const composition = useEventPageComposition();
  const direction = design && getCelebrationDirection(design.category, design.id);
  const activePresentation: BodyPresentation | undefined = direction
    ? {
        layout: direction.layout,
        surface: "outline" as const,
        heading: "masthead" as const,
        flow: presentation?.flow || ("invitation" as const),
      }
    : presentation;
  const composed = Boolean(composition?.onChange || composition?.value);
  const items: BodySection[] =
    sections ||
    (composed
      ? eventPageSectionEntries(children)
      : flatten(children).map((content, index) => ({
          id: isValidElement<{ id?: string }>(content)
            ? content.props.id || `section-${index}`
            : `section-${index}`,
          content,
        })));
  const visible = items.filter(
    (item) => item.content !== null && item.content !== undefined && item.content !== false,
  );
  if (!activePresentation) {
    if (composition?.onChange || composition?.value)
      return (
        <EventPageSections
          sections={sections || eventPageSectionEntries(children)}
          className={className}
        />
      );
    const content = visible.map((item) => <Fragment key={item.id}>{item.content}</Fragment>);
    return fallbackClassName ? <div className={fallbackClassName}>{content}</div> : content;
  }
  const order = flows[activePresentation.flow];
  const rank = (id: string) => {
    const index = order.indexOf(id === "photos" ? "gallery" : id === "updates" ? "notes" : id);
    return index === -1 ? order.indexOf("registry") - 0.5 : index;
  };
  const ordered = [...visible].sort((a, b) => rank(a.id) - rank(b.id));
  const templateLayout = !composition?.value?.layout;
  if (!ordered.length && !composed) return null;
  const panel = (item: BodySection, index: number, layoutItem = false) => (
    <div
      className={`${styles.panel} ${layoutItem ? styles.item : ""}`}
      data-body-section={item.id}
      key={item.id}
    >
      <span className={styles.index} aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
      {item.content}
    </div>
  );
  const bodyStyle = {
    ...style,
    ...(activePresentation.borderRadius
      ? { "--body-panel-radius": activePresentation.borderRadius }
      : {}),
    ...(activePresentation.spacing
      ? {
          "--body-gap": spacing[activePresentation.spacing].gap,
          "--body-panel-padding": spacing[activePresentation.spacing].padding,
        }
      : {}),
    ...(activePresentation.surfaceTone
      ? { "--body-tint": surfaceTint[activePresentation.surfaceTone] }
      : {}),
    ...(direction ? celebrationMaterialStyle(direction) : {}),
  } as CSSProperties;
  return (
    <div
      className={`${styles.body} ${direction ? materialStyles.body : ""} ${className}`}
      style={bodyStyle}
      data-template-body-layout={templateLayout ? activePresentation.layout : "custom"}
      data-body-surface={activePresentation.surface}
      data-body-heading={activePresentation.heading}
      data-body-radius={activePresentation.borderRadius}
      data-body-spacing={activePresentation.spacing}
      data-body-tone={activePresentation.surfaceTone}
      data-celebration-design={direction && design ? `${design.category}/${design.id}` : undefined}
      data-celebration-heading={direction?.heading}
    >
      {composed ? (
        <EventPageSections
          sections={ordered.map((item) => ({
            ...item,
            label: item.label || eventPageSectionEntries(item.content)[0]?.label,
            editorId: item.editorId || item.id,
          }))}
          canvasClassName={
            templateLayout ? `${styles.sections} ${styles.composedSections}` : undefined
          }
          itemClassName={templateLayout ? styles.item : undefined}
          renderSection={(item, index) => panel(item, index)}
        />
      ) : (
        <div className={styles.sections} data-body-sections>
          {ordered.map((item, index) => panel(item, index, true))}
        </div>
      )}
    </div>
  );
}
