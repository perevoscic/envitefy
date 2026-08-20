"use client";

import {
  Activity,
  Building2,
  Calendar,
  CalendarDays,
  Car,
  ClipboardList,
  Coffee,
  ExternalLink,
  Info,
  MapPin,
  Phone,
  ShieldAlert,
  Ticket,
  TriangleAlert,
  Users,
} from "lucide-react";
import Image from "next/image";
import React from "react";
import StaticMap from "@/components/StaticMap";
import { splitGuidanceSentences, stripLinkedDomainMentions } from "./displayText";
import { ShowcaseThemeConfig } from "./showcaseThemes";
import { GymMeetRenderModel } from "./types";

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

const hotelCardGridClass = "grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]";

const getCollectionItemKey = (
  parentId: string | undefined,
  explicitKey: unknown,
  index: number,
) => {
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
    const eyebrow = String(section?.kind || "")
      .replace(/_/g, " ")
      .trim();
    const label = String(section?.label || "").trim();
    if (!eyebrow) return "";
    if (eyebrow.toLowerCase() === label.toLowerCase()) return "";
    return eyebrow;
  })();
  const sectionLinks = (Array.isArray(section?.blocks) ? section.blocks : []).flatMap(
    (block: any) => {
      if (block?.type === "link-list" && Array.isArray(block.links)) return block.links;
      if (block?.type === "cta" && block.action) return [block.action];
      return [];
    },
  );
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
            <div
              className={
                block.id === "hotel-cards" ? hotelCardGridClass : gridClassForColumns(block.columns)
              }
            >
              {(block.cards || [])
                .map((card: any) => ({
                  ...card,
                  body: stripLinkedDomainMentions(card.body, sectionLinks),
                  items: Array.isArray(card.items)
                    ? card.items
                        .map((item: string) => stripLinkedDomainMentions(item, sectionLinks))
                        .filter(Boolean)
                    : [],
                }))
                .filter(
                  (card: any) =>
                    card.label ||
                    card.value ||
                    card.body ||
                    (Array.isArray(card.items) && card.items.length > 0) ||
                    card.meta,
                )
                .map((card: any, index: number) => {
                  const cardReactKey = getCollectionItemKey(block.id, card?.key, index);
                  const hotelCardLayoutClass =
                    block.id === "hotel-cards" ? "flex h-full flex-col" : "";
                  const cardLabelClass =
                    block.id === "hotel-cards"
                      ? "text-sm font-black uppercase tracking-[0.2em] opacity-70 sm:text-base"
                      : "text-[10px] font-black uppercase tracking-[0.18em] opacity-60";
                  const isHotelCard = card.presentation === "hotel";
                  const isGuidanceCard = card.presentation === "guidance";
                  const guidanceItems = isGuidanceCard
                    ? Array.from(
                        new Set([
                          ...splitGuidanceSentences(card.body),
                          ...(Array.isArray(card.items) ? card.items : []),
                        ]),
                      )
                    : [];
                  const GuidanceIcon =
                    card.icon === "traffic"
                      ? TriangleAlert
                      : card.icon === "parking"
                        ? Car
                        : card.icon === "policy"
                          ? ShieldAlert
                          : card.icon === "info"
                            ? Info
                            : ClipboardList;
                  if (isHotelCard) {
                    const highlights = Array.isArray(card.highlights) ? card.highlights : [];
                    const details = Array.isArray(card.details) ? card.details : [];
                    return (
                      <article
                        key={cardReactKey}
                        className={`${theme.cardClass} flex h-full flex-col overflow-hidden border-l-[3px] border-l-violet-500`}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <span
                            aria-hidden="true"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600"
                          >
                            <Building2 size={20} strokeWidth={2.2} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-50">
                              Host hotel
                            </p>
                            <h3 className="mt-1 text-base font-black leading-tight tracking-tight sm:text-lg">
                              {card.label}
                            </h3>
                          </div>
                        </div>

                        {highlights.length > 0 ? (
                          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                            {highlights.map((highlight: any, highlightIndex: number) => (
                              <div
                                key={`${cardReactKey}-highlight-${highlightIndex}`}
                                className="rounded-xl bg-violet-500/[0.07] px-3 py-2.5"
                              >
                                <dt className="text-[9px] font-black uppercase tracking-[0.15em] opacity-55">
                                  {highlight.label}
                                </dt>
                                <dd className="mt-1 text-sm font-black leading-snug">
                                  {highlight.value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        ) : card.meta ? (
                          <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] opacity-60">
                            {card.meta}
                          </p>
                        ) : null}

                        {details.length > 0 ? (
                          <dl className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2">
                            {details.map((detail: any, detailIndex: number) => {
                              const DetailIcon =
                                detail.icon === "parking"
                                  ? Car
                                  : detail.icon === "breakfast"
                                    ? Coffee
                                    : detail.icon === "deadline"
                                      ? CalendarDays
                                      : Phone;
                              return (
                                <div
                                  key={`${cardReactKey}-detail-${detailIndex}`}
                                  className="flex items-start gap-2.5"
                                >
                                  <DetailIcon
                                    aria-hidden="true"
                                    className="mt-0.5 shrink-0 opacity-45"
                                    size={15}
                                    strokeWidth={2.1}
                                  />
                                  <div className="min-w-0">
                                    <dt className="text-[9px] font-black uppercase tracking-[0.14em] opacity-50">
                                      {detail.label}
                                    </dt>
                                    <dd className="mt-0.5 break-words text-sm font-semibold leading-snug opacity-90">
                                      {detail.value}
                                    </dd>
                                  </div>
                                </div>
                              );
                            })}
                          </dl>
                        ) : card.body ? (
                          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed opacity-85">
                            {card.body}
                          </p>
                        ) : null}

                        {safeUrl(card.action?.url) ? (
                          <div className="mt-auto pt-5">
                            <a
                              href={card.action.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={theme.ctaSecondaryClass}
                            >
                              {card.action.label || "Book Hotel"}
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        ) : null}
                      </article>
                    );
                  }
                  if (isGuidanceCard) {
                    const warningTone = card.tone === "warning";
                    return (
                      <article
                        key={cardReactKey}
                        className={`${theme.cardClass} relative overflow-hidden border-l-[3px] ${
                          warningTone ? "border-l-amber-400" : "border-l-sky-500"
                        }`}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <span
                            aria-hidden="true"
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              warningTone
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-sky-500/10 text-sky-600"
                            }`}
                          >
                            <GuidanceIcon size={19} strokeWidth={2.25} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {card.label ? (
                                <h3 className="text-sm font-black tracking-tight sm:text-base">
                                  {card.label}
                                </h3>
                              ) : null}
                              {card.meta ? (
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
                                    warningTone
                                      ? "bg-amber-500/10 text-amber-700"
                                      : "bg-sky-500/10 text-sky-700"
                                  }`}
                                >
                                  {card.meta}
                                </span>
                              ) : null}
                            </div>
                            {guidanceItems.length > 1 ? (
                              <ul className="mt-3 space-y-2.5 text-sm leading-relaxed opacity-90 sm:text-[15px]">
                                {guidanceItems.map((item: string, itemIndex: number) => (
                                  <li
                                    key={`${cardReactKey}-guidance-${itemIndex}`}
                                    className="flex items-start gap-2.5"
                                  >
                                    <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-35" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : guidanceItems[0] ? (
                              <p className="mt-3 text-sm leading-relaxed opacity-90 sm:text-[15px]">
                                {guidanceItems[0]}
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
                        </div>
                      </article>
                    );
                  }
                  return (
                    <div
                      key={cardReactKey}
                      className={`${theme.cardClass} ${hotelCardLayoutClass}`.trim()}
                    >
                      {card.label ? <p className={cardLabelClass}>{card.label}</p> : null}
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
                          className={`${block.id === "hotel-cards" ? "mt-auto pt-4" : "mt-4"} ${theme.ctaSecondaryClass}`}
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
            {block.text ? (
              <p className="mt-2 text-sm leading-relaxed opacity-88">{block.text}</p>
            ) : null}
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
            {block.text ? (
              <p className="mb-4 text-sm leading-relaxed opacity-88">{block.text}</p>
            ) : null}
            <StaticMap address={block.address} height={360} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className={theme.panelClass}>
      <div className="space-y-6">
        {section.hideSectionHeading ? null : (
          <div>
            {sectionEyebrow ? (
              <p
                className={`text-[10px] font-black uppercase tracking-[0.22em] ${theme.accentClass}`}
              >
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

        <div className="space-y-4">
          {section.blocks.map((block: any) => (
            <div key={block.id}>{renderBlock(block)}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
