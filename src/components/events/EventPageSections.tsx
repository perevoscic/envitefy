"use client";
import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { EventSectionCanvas, type EventSectionEntry } from "./EventSectionBuilder";
import { useEventPageComposition } from "./EventPageCompositionContext";
import styles from "./event-page-sections.module.css";

function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (isValidElement<{ children?: ReactNode }>(node)) return text(node.props.children);
  return Array.isArray(node) ? node.map(text).join(" ").trim() : "";
}
function heading(node: ReactNode): string {
  if (!isValidElement<{ children?: ReactNode; "aria-label"?: string }>(node)) return "";
  if (node.type === "h2" || node.type === "h3") return text(node.props.children);
  if (node.props["aria-label"]) return node.props["aria-label"];
  for (const child of Children.toArray(node.props.children)) {
    const found = heading(child);
    if (found) return found;
  }
  return "";
}
function componentSection(node: ReactNode): { id: string; label: string } | undefined {
  if (!isValidElement<{ children?: ReactNode; title?: string }>(node)) return;
  const id =
    typeof node.type === "function"
      ? (node.type as { eventSectionId?: string }).eventSectionId
      : undefined;
  if (id === "story") return { id, label: node.props.title || "Our story" };
  if (id === "schedule") return { id, label: "Schedule" };
  if (typeof node.type === "string") {
    for (const child of Children.toArray(node.props.children)) {
      const found = componentSection(child);
      if (found) return found;
    }
  }
}
function containsSection(node: ReactNode): boolean {
  if (!isValidElement<{ children?: ReactNode }>(node)) return false;
  if (node.type === "section" || componentSection(node)) return true;
  return (
    typeof node.type === "string" && Children.toArray(node.props.children).some(containsSection)
  );
}
function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return [child];
    if (child.type === Fragment) return flatten(child.props.children);
    if (
      (child.type === "div" || child.type === "main") &&
      Children.toArray(child.props.children).some(containsSection)
    )
      return flatten(child.props.children);
    return [child];
  });
}
export function eventPageSectionEntries(children: ReactNode): EventSectionEntry[] {
  return flatten(children).map((content, index) => {
    const element = isValidElement<{
      id?: string;
      "data-event-section"?: string;
      "data-editor-id"?: string;
    }>(content)
      ? content
      : null;
    const component = componentSection(content);
    const label = heading(content) || component?.label || `Section ${index + 1}`;
    const id =
      element?.props.id ||
      element?.props["data-event-section"] ||
      component?.id ||
      (heading(content)
        ? heading(content)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
        : `body:${String(element?.key || index).replace(/[^a-zA-Z0-9:_-]/g, "_")}`);
    return { id, label, editorId: element?.props["data-editor-id"] || id, content };
  });
}
/** Native section contents keep their controls, links and theme; composition adds only page structure. */
export default function EventPageSections({
  children,
  sections,
  className = "",
}: {
  children?: ReactNode;
  sections?: Array<{ id: string; content: ReactNode; label?: string; editorId?: string }>;
  className?: string;
}) {
  const composition = useEventPageComposition();
  const entries = sections
    ? sections
        .filter(
          (section) =>
            section.content !== null && section.content !== false && section.content !== undefined,
        )
        .map((section) => ({
          ...section,
          label: section.label || heading(section.content) || section.id,
          editorId: section.editorId || section.id,
        }))
    : eventPageSectionEntries(children);
  if (!composition || (!composition.onChange && !composition.value))
    return (
      <>
        {children ??
          sections?.map((section) => <Fragment key={section.id}>{section.content}</Fragment>)}
      </>
    );
  return (
    <div
      className={`${styles.sections} ${className}`}
      data-event-body-layout={composition.value?.layout || "template"}
    >
      <EventSectionCanvas
        className={styles.canvas}
        sections={entries}
        layout={composition.value?.sectionLayout}
        rowProps={() => ({})}
      />
    </div>
  );
}
