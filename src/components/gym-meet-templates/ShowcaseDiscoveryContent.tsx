"use client";

import React from "react";
import Image from "next/image";
import StaticMap from "@/components/StaticMap";
import {
  Activity,
  Car,
  Calendar,
  ClipboardList,
  ExternalLink,
  MapPin,
  ShieldAlert,
  Ticket,
  Users,
} from "lucide-react";
import { ShowcaseThemeConfig } from "./showcaseThemes";
import { GymMeetRenderModel } from "./types";
import { stripLinkedDomainMentions } from "./displayText";
import ScheduleBoard from "./ScheduleBoard";

const safeUrl = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";
  return /^https?:\/\//i.test(text) ? text : "";
};

const iconByKind: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  meet_overview: Activity,
  registration: ClipboardList,
  admission: Ticket,
  results: Ticket,
  coaches: Users,
  schedule: Calendar,
  venue: MapPin,
  venue_map: MapPin,
  traffic_parking: Car,
  hotels: MapPin,
  safety: ShieldAlert,
  documents: ClipboardList,
};

const NAV_LABEL_OVERRIDES: Record<string, string> = {
  admission: "Admission & Sales",
  "traffic-parking": "Traffic & Arrival",
  "safety-policy": "Safety & Policy",
};

export const getShowcaseDiscoveryTabs = (sections: any[] = []) =>
  sections.map((section) => ({
    id: section.id,
    label: String(NAV_LABEL_OVERRIDES[section.id] || section.navLabel || section.label || "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase(),
    icon: iconByKind[section.kind] || ClipboardList,
  }));

const renderLineList = ({
  lines,
  theme,
}: {
  lines: Array<{ text: string; href?: string }>;
  theme: ShowcaseThemeConfig;
}) => {
  if (!lines.length) return null;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {lines.map((line, index) => (
        <div key={`${line.text}-${line.href || index}`} className={theme.cardClass}>
          <p className="text-sm leading-relaxed opacity-90">{line.text || "Reference link"}</p>
          {line.href ? (
            <a
              href={line.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-4 ${theme.ctaSecondaryClass}`}
            >
              Open Link
              <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
};

const gridClassForColumns = (columns?: number) => {
  switch (columns) {
    case 4:
      return "grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]";
    case 3:
      return "grid gap-3 md:grid-cols-2 xl:grid-cols-3";
    default:
      return "grid gap-3 md:grid-cols-2";
  }
};

const getCollectionItemKey = (parentId: string | undefined, explicitKey: unknown, index: number) => {
  const normalizedParentId =
    typeof parentId === "string" && parentId.trim() ? parentId.trim() : "item";
  const normalizedExplicitKey =
    typeof explicitKey === "string" && explicitKey.trim() ? explicitKey.trim() : "";
  return normalizedExplicitKey
    ? `${normalizedParentId}-${normalizedExplicitKey}-${index}`
    : `${normalizedParentId}-${index}`;
};

export default function ShowcaseDiscoveryContent({
  model,
  theme,
  activeTab,
}: {
  model: GymMeetRenderModel;
  theme: ShowcaseThemeConfig;
  activeTab: string;
}) {
  const sections = Array.isArray(model.discovery?.sections) ? model.discovery.sections : [];
  const section = sections.find((item) => item.id === activeTab) || sections[0];
  const panelTitleClass = theme.sectionTitleClass || "";
  const panelTitleStyle = theme.sectionTitleStyle;
  const cardTitleClass = panelTitleClass;
  const cardTitleStyle = panelTitleStyle;
  const sectionEyebrow = (() => {
    const eyebrow = String(section?.kind || "").replace(/_/g, " ").trim();
    const label = String(section?.label || "").trim();
    if (!eyebrow) return "";
    if (eyebrow.toLowerCase() === label.toLowerCase()) return "";
    return eyebrow;
  })();
  const sectionLinks = (Array.isArray(section?.blocks) ? section.blocks : []).flatMap((block: any) => {
    if (block?.type === "link-list" && Array.isArray(block.links)) return block.links;
    if (block?.type === "cta" && block.action) return [block.action];
    return [];
  });
  const isBareScheduleSection =
    Boolean(section?.hideSectionHeading) &&
    Array.isArray(section?.blocks) &&
    section.blocks.length === 1 &&
    section.blocks[0]?.type === "schedule-board";

  if (!section) {
    return (
      <section className={theme.panelClass}>
        <p className="text-sm leading-relaxed opacity-75">
          Discovery content is still being synthesized from the source packet.
        </p>
      </section>
    );
  }

  const renderBlock = (block: any) => {
    switch (block.type) {
      case "line-list":
        return renderLineList({ lines: block.lines || [], theme });
      case "text": {
        const blockText = stripLinkedDomainMentions(block.text, sectionLinks);
        if (!blockText) return null;
        return (
          <div className={theme.cardClass}>
            {block.title ? (
              <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                {block.title}
              </p>
            ) : null}
            <p className={`${block.title ? "mt-2" : ""} text-sm leading-relaxed opacity-90`}>
              {blockText}
            </p>
          </div>
        );
      }
      case "card-grid":
        return (
          <div className="space-y-3">
            {block.title ? (
              <h3 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                {block.title}
              </h3>
            ) : null}
            <div className={gridClassForColumns(block.columns)}>
              {(block.cards || [])
                .map((card: any) => ({
                  ...card,
                  body: stripLinkedDomainMentions(card.body, sectionLinks),
                }))
                .filter((card: any) => card.label || card.value || card.body || (Array.isArray(card.items) && card.items.length > 0) || card.meta)
                .map((card: any, index: number) => {
                  const cardReactKey = getCollectionItemKey(block.id, card?.key, index);
                  return (
                    <div key={cardReactKey} className={theme.cardClass}>
                      {card.imageUrl ? (
                        <div className="mb-4 overflow-hidden rounded-[24px] border border-white/60 bg-white/40 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                          <img
                            src={card.imageUrl}
                            alt={card.label || "Hotel image"}
                            className="aspect-[4/3] w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : null}
                      {card.label ? (
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                          {card.label}
                        </p>
                      ) : null}
                      {card.value ? (
                        <p className="mt-2 text-3xl font-black leading-none">{card.value}</p>
                      ) : null}
                      {card.body ? (
                        <p
                          className={`${card.value || card.label ? "mt-2" : ""} whitespace-pre-line text-sm leading-relaxed opacity-88`}
                        >
                          {card.body}
                        </p>
                      ) : null}
                      {Array.isArray(card.items) && card.items.length > 0 ? (
                        <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                          {card.items.map((item: string, itemIndex: number) => (
                            <li key={`${cardReactKey}-item-${itemIndex}`} className="flex gap-2">
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-current opacity-40" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {card.meta ? (
                        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] opacity-55">
                          {card.meta}
                        </p>
                      ) : null}
                      {safeUrl(card.action?.url) ? (
                        <a
                          href={card.action.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`mt-4 ${theme.ctaSecondaryClass}`}
                        >
                          {card.action.label || "Open Link"}
                          <ExternalLink size={14} />
                        </a>
                      ) : null}
                    </div>
                  );
                })}
            </div>
          </div>
        );
      case "link-list":
        return (
          <div className={theme.cardClass}>
            {block.title ? (
              <h3 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                {block.title}
              </h3>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {(block.links || []).map((item: any, index: number) => (
                <a
                  key={item.url || `${block.id}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={theme.ctaSecondaryClass}
                >
                  {item.label || "Open Link"}
                  <ExternalLink size={14} />
                </a>
              ))}
            </div>
          </div>
        );
      case "cta":
        return (
          <div className={theme.cardClass}>
            {block.title ? (
              <h3 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                {block.title}
              </h3>
            ) : null}
            {block.text ? <p className="mt-2 text-sm leading-relaxed opacity-88">{block.text}</p> : null}
            {safeUrl(block.action?.url) ? (
              <a
                href={block.action.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-4 ${theme.ctaPrimaryClass}`}
              >
                {block.action.label || "Open Link"}
                <ExternalLink size={14} />
              </a>
            ) : null}
          </div>
        );
      case "image":
        return (
          <div className={theme.cardClass}>
            {block.title ? (
              <h3 className={`mb-4 text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                {block.title}
              </h3>
            ) : null}
            <div className="overflow-hidden border border-black/10 bg-black/5">
              <Image
                src={block.imageUrl}
                alt={block.alt || block.title || "Discovery image"}
                width={1600}
                height={1200}
                unoptimized
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        );
      case "map":
        return (
          <div className={theme.cardClass}>
            {block.title ? (
              <h3 className={`mb-4 text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                {block.title}
              </h3>
            ) : null}
            {block.text ? <p className="mb-4 text-sm leading-relaxed opacity-88">{block.text}</p> : null}
            <StaticMap address={block.address} height={360} />
          </div>
        );
      case "schedule-board":
        return (
          <ScheduleBoard
            schedule={block.data}
            preferredClubName={model?.assignedGym}
            appearance={{
              panelClass: theme.cardClass,
              cardClass: theme.cardClass,
              summaryCardClass: theme.summaryCardClass,
              navShellClass: theme.navShellClass,
              navActiveClass: theme.navActiveClass,
              navIdleClass: theme.navIdleClass,
              sectionTitleClass: theme.sectionTitleClass,
              sectionTitleStyle: theme.sectionTitleStyle,
              accentClass: theme.accentClass,
              sectionMutedClass: theme.sectionMutedClass,
              primaryButtonClass: theme.ctaPrimaryClass,
              secondaryButtonClass: theme.ctaSecondaryClass,
              sessionTitleClass: theme.sectionTitleClass,
              sessionTitleStyle: theme.sectionTitleStyle,
            }}
          />
        );
      default:
        return null;
    }
  };

  if (isBareScheduleSection) {
    return <>{renderBlock(section.blocks[0])}</>;
  }

  return (
    <section className={theme.panelClass}>
      <div className="space-y-6">
        {section.hideSectionHeading ? null : (
          <div>
            {sectionEyebrow ? (
              <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${theme.accentClass}`}>
                {sectionEyebrow}
              </p>
            ) : null}
            <h2
              className={`mt-2 text-3xl font-black tracking-tight sm:text-4xl ${panelTitleClass}`}
              style={panelTitleStyle}
            >
              {section.label}
            </h2>
          </div>
        )}

        <div className="space-y-4">{section.blocks.map((block: any) => <div key={block.id}>{renderBlock(block)}</div>)}</div>
      </div>
    </section>
  );
}
