"use client";
import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import { useEventPageComposition } from "./EventPageCompositionContext";
import EventPageSections from "./EventPageSections";

function containsTitle(node: ReactNode): boolean {
  return (
    isValidElement<{ children?: ReactNode }>(node) &&
    (node.type === "h1" || Children.toArray(node.props.children).some(containsTitle))
  );
}
function extractSections(node: ReactNode, sections: ReactNode[]): ReactNode {
  if (!isValidElement<{ children?: ReactNode }>(node)) return node;
  const sectionId =
    typeof node.type === "function"
      ? (node.type as { eventSectionId?: string }).eventSectionId
      : undefined;
  if (
    (node.type === "section" && !containsTitle(node)) ||
    sectionId === "story" ||
    sectionId === "schedule"
  ) {
    sections.push(node);
    return null;
  }
  if (typeof node.type !== "string" || node.props.children === undefined) return node;
  const children = Children.toArray(node.props.children).map((child) =>
    extractSections(child, sections),
  );
  if (node.props.children && children.every((child) => child === null)) return null;
  return cloneElement(node, {}, children);
}

/** A template's hero stays anchored while its body uses the shared section canvas. */
export default function EventPageNativeSections({
  children,
  supplemental,
  supplementalSections,
  guestTools,
}: {
  children: ReactNode;
  supplemental?: ReactNode;
  supplementalSections?: ReactNode;
  guestTools?: ReactNode;
}) {
  const composition = useEventPageComposition();
  if (!composition?.onChange && !composition?.value)
    return (
      <>
        {children}
        {supplemental}
      </>
    );
  const nodes: ReactNode[] = Children.toArray(children);
  const bodyIndex = nodes.findLastIndex(
    (node) =>
      isValidElement(node) &&
      (node.type === "main" || node.type === "div" || node.type === "section"),
  );
  if (bodyIndex < 0)
    return (
      <>
        {children}
        {guestTools}
        <EventPageSections>{supplementalSections ?? supplemental}</EventPageSections>
      </>
    );
  const body = nodes[bodyIndex];
  if (!isValidElement<{ children?: ReactNode }>(body)) return <>{children}</>;
  const sections: ReactNode[] = [];
  // Some designs place their story/program inside the same framed wrapper as the title.
  // Extract native sections recursively while leaving all hero elements in their original wrappers.
  const bodyChildren = Children.toArray(body.props.children).map((node) =>
    extractSections(node, sections),
  );
  for (let index = 0; index < nodes.length; index++) {
    if (index !== bodyIndex) nodes[index] = extractSections(nodes[index], sections);
  }
  nodes[bodyIndex] = cloneElement(
    body,
    {},
    <>
      {bodyChildren}
      {guestTools}
      <EventPageSections>
        {sections}
        {supplementalSections ?? supplemental}
      </EventPageSections>
    </>,
  );
  return <>{nodes}</>;
}
