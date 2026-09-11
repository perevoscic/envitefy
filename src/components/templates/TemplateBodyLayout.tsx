import { Children, Fragment, isValidElement, type CSSProperties, type ReactNode } from "react";
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
};

export type BodySection = { id: string; content: ReactNode };

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
  sections,
  children,
  className = "",
  fallbackClassName,
  style,
}: {
  presentation?: BodyPresentation;
  sections?: BodySection[];
  children?: ReactNode;
  className?: string;
  fallbackClassName?: string;
  style?: CSSProperties;
}) {
  const items =
    sections ||
    flatten(children).map((content, index) => ({
      id: isValidElement<{ id?: string }>(content)
        ? content.props.id || `section-${index}`
        : `section-${index}`,
      content,
    }));
  const visible = items.filter(
    (item) => item.content !== null && item.content !== undefined && item.content !== false,
  );
  if (!presentation) {
    const content = visible.map((item) => <Fragment key={item.id}>{item.content}</Fragment>);
    return fallbackClassName ? <div className={fallbackClassName}>{content}</div> : content;
  }
  const order = flows[presentation.flow];
  const rank = (id: string) => {
    const index = order.indexOf(id === "photos" ? "gallery" : id === "updates" ? "notes" : id);
    return index === -1 ? order.indexOf("registry") - 0.5 : index;
  };
  const ordered = [...visible].sort((a, b) => rank(a.id) - rank(b.id));
  if (!ordered.length) return null;
  return (
    <div
      className={`${styles.body} ${className}`}
      style={style}
      data-template-body-layout={presentation.layout}
      data-body-surface={presentation.surface}
      data-body-heading={presentation.heading}
    >
      <div className={styles.sections}>
        {ordered.map((item, index) => (
          <div className={styles.panel} data-body-section={item.id} key={item.id}>
            <span className={styles.index} aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}
