"use client";
import { Children, cloneElement, Fragment, isValidElement, type CSSProperties, type ReactNode } from "react";
import { useEventPageComposition } from "./EventPageCompositionContext";
import { hasEventPageBodyComposition } from "@/lib/event-page-composition";
import EventPageHero from "./EventPageHero";
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

/** Keep native containers around body sections that share a wrapper with a template hero. */
function retainNativeSections(node: ReactNode): ReactNode {
  if (!isValidElement<{ children?: ReactNode }>(node)) return null;
  const sectionId = typeof node.type === "function"
    ? (node.type as { eventSectionId?: string }).eventSectionId
    : undefined;
  if ((node.type === "section" && !containsTitle(node)) || sectionId === "story" || sectionId === "schedule")
    return node;
  if ((typeof node.type !== "string" && node.type !== Fragment) || node.props.children === undefined)
    return null;
  const children = Children.toArray(node.props.children).map(retainNativeSections);
  return children.some((child) => child !== null) ? cloneElement(node, {}, children) : null;
}

/** A template's hero stays anchored while its body uses the shared section canvas. */
export default function EventPageNativeSections({
  children,
  supplemental,
  supplementalSections,
  guestTools,
  heroArtwork,
  heroCopy,
  heroStyle,
}: {
  children: ReactNode;
  supplemental?: ReactNode;
  supplementalSections?: ReactNode;
  guestTools?: ReactNode;
  heroArtwork?: ReactNode;
  heroCopy?: ReactNode;
  heroStyle?: CSSProperties;
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
  const withHero = (entries: ReactNode[]): ReactNode[] => entries.map((node, index) => {
    if (!composition?.value?.hero || !heroArtwork || !heroCopy || !isValidElement<{ children?: ReactNode }>(node)) return node;
    if ((node.type === "header" || node.type === "article") && containsTitle(node)) {
      const hero = <EventPageHero key={`hero:${index}`} artwork={heroArtwork} copy={heroCopy} style={heroStyle}>{node}</EventPageHero>;
      const retained = retainNativeSections(node);
      return isValidElement<{ children?: ReactNode }>(retained)
        ? cloneElement(retained, {}, hero, retained.props.children)
        : hero;
    }
    return (typeof node.type === "string" || node.type === Fragment) && node.props.children !== undefined
      ? cloneElement(node, {}, withHero(Children.toArray(node.props.children)))
      : node;
  });
  if (!composition?.onChange && !hasEventPageBodyComposition(composition?.value))
    return <>{withHero(nodes)}{supplemental}</>;
  const bodyIndex = nodes.findLastIndex(
    (node) =>
      isValidElement(node) &&
      (node.type === "main" || node.type === "div" || node.type === "section"),
  );
  if (bodyIndex < 0)
    return (
      <>
        {withHero(nodes)}
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
  return <>{withHero(nodes)}</>;
}
