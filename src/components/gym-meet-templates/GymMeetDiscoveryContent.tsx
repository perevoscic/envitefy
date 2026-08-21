/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
"use client";

import {
  Building2,
  CalendarDays,
  Car,
  ClipboardList,
  Coffee,
  ExternalLink,
  Info,
  Phone,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StaticMap from "@/components/StaticMap";
import { splitGuidanceSentences } from "./displayText";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2";

const TabHeading = ({ title, style }: { title: string; style?: React.CSSProperties }) => (
  <h3
    className="mb-4 flex items-center gap-2 text-lg font-black tracking-tight text-inherit sm:text-xl"
    style={style}
  >
    {title}
  </h3>
);

const EmptyState = ({ className, children }: { className: string; children: React.ReactNode }) => (
  <div className={className}>
    <p className="text-sm leading-relaxed opacity-75">{children}</p>
  </div>
);

const renderLineList = (
  lines: Array<{ text: string; href?: string }>,
  secondaryButtonClass: string,
) => (
  <ul className="space-y-4">
    {lines.map((line) => (
      <li key={`${line.text}-${line.href || "none"}`} className="flex items-start gap-3">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-current opacity-40" />
        <div className="space-y-2">
          <p className="text-sm leading-relaxed opacity-85">{line.text || "Reference link"}</p>
          {line.href ? (
            <a
              href={line.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${secondaryButtonClass} ${focusRing}`}
            >
              Open Link <ExternalLink size={12} />
            </a>
          ) : null}
        </div>
      </li>
    ))}
  </ul>
);

const gridClassForColumns = (columns?: number) => {
  switch (columns) {
    case 4:
      return "grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]";
    case 3:
      return "grid gap-4 md:grid-cols-2 xl:grid-cols-3";
    default:
      return "grid gap-4 md:grid-cols-2";
  }
};

const hotelCardGridClass = "grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]";

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

const MOBILE_NAV_SAFE_EDGE_PX = 48;
const DESKTOP_NAV_SAFE_EDGE_PX = 8;

export default function GymMeetDiscoveryContent({ model, variant }: { model: any; variant: any }) {
  const sections = useMemo(
    () =>
      (Array.isArray(model?.discovery?.sections) ? model.discovery.sections : []).filter(
        (section: any) => section?.hasContent !== false && Array.isArray(section?.blocks),
      ),
    [model?.discovery?.sections],
  );
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id || "");
  const railRef = useRef<HTMLDivElement | null>(null);
  const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [bounceOffset, setBounceOffset] = useState(0);
  const prevScrollLeftRef = useRef(0);
  const bounceTimeoutRef = useRef<number | null>(null);

  const panelClass = variant.sectionClass;
  const cardClass = variant.summaryCardClass;
  const navShellClass = variant.navShellClass;
  const activeTabClass = variant.navActiveClass;
  const idleTabClass = variant.navIdleClass;
  const navFadeClass = variant.navFadeClass || "rgba(255,255,255,0.82)";
  const baseNavRailClass =
    variant.navRailClass || "no-scrollbar flex gap-2 overflow-x-auto px-1 py-1";
  const navRailClass = `${baseNavRailClass} pr-12 md:pr-1`;
  const navButtonClass = variant.navButtonClass || "";
  const navTextClass =
    sections.length >= 6 ? "text-[10px] tracking-[0.14em]" : "text-[11px] tracking-[0.18em]";
  const resolvedNavButtonClass = `inline-flex shrink-0 items-center justify-center whitespace-nowrap max-w-[220px] sm:max-w-[240px] min-w-fit ${navTextClass} ${navButtonClass}`;
  const secondaryButtonClass = variant.secondaryButtonClass;
  const primaryButtonClass = variant.primaryButtonClass || secondaryButtonClass;
  const sectionTitleClass = variant.sectionTitleClass || "";
  const sectionTitleStyle = variant.sectionTitleStyle;
  const cardTitleClass = sectionTitleClass;
  const cardTitleStyle = sectionTitleStyle;

  const getScrollBehavior = useCallback((): ScrollBehavior => {
    if (typeof window === "undefined") return "auto";
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  }, []);

  const updateEdgeHints = useCallback(() => {
    const rail = railRef.current;
    if (!rail) {
      setShowLeftFade(false);
      setShowRightFade(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = rail;
    const maxScroll = Math.max(scrollWidth - clientWidth, 0);
    const epsilon = 2;
    if (maxScroll <= epsilon) {
      setShowLeftFade(false);
      setShowRightFade(false);
      return;
    }
    setShowLeftFade(scrollLeft > epsilon);
    setShowRightFade(scrollLeft < maxScroll - epsilon);
  }, []);

  const centerTab = useCallback((sectionId: string, behavior: ScrollBehavior = "smooth") => {
    const rail = railRef.current;
    const button = tabButtonRefs.current[sectionId];
    if (!rail || !button) return;

    const isDesktop =
      typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
    const safeEdgeInset = isDesktop ? DESKTOP_NAV_SAFE_EDGE_PX : MOBILE_NAV_SAFE_EDGE_PX;
    const leftInset = safeEdgeInset;
    const rightInset = safeEdgeInset;
    const maxScroll = Math.max(rail.scrollWidth - rail.clientWidth, 0);
    const buttonLeft = button.offsetLeft;
    const buttonRight = buttonLeft + button.offsetWidth;
    const safeViewportLeft = rail.scrollLeft + leftInset;
    const safeViewportRight = rail.scrollLeft + rail.clientWidth - rightInset;
    const epsilon = 1;

    if (buttonLeft >= safeViewportLeft - epsilon && buttonRight <= safeViewportRight + epsilon) {
      return;
    }

    const targetScrollLeft =
      buttonLeft < safeViewportLeft
        ? buttonLeft - leftInset
        : buttonRight + rightInset - rail.clientWidth;

    rail.scrollTo({
      left: Math.min(Math.max(targetScrollLeft, 0), maxScroll),
      behavior,
    });
  }, []);

  const triggerBounce = useCallback((direction: "left" | "right") => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setBounceOffset(direction === "left" ? 10 : -10);
    if (bounceTimeoutRef.current != null) {
      window.clearTimeout(bounceTimeoutRef.current);
    }
    bounceTimeoutRef.current = window.setTimeout(() => {
      setBounceOffset(0);
      bounceTimeoutRef.current = null;
    }, 170);
  }, []);

  useEffect(() => {
    if (!sections.some((section: any) => section.id === activeSectionId)) {
      setActiveSectionId(sections[0]?.id || "");
    }
  }, [activeSectionId, sections]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const rafId = window.requestAnimationFrame(() => {
      updateEdgeHints();
      prevScrollLeftRef.current = rail.scrollLeft || 0;
    });
    const onScroll = () => {
      const activeRail = railRef.current;
      if (activeRail) {
        const { scrollLeft, scrollWidth, clientWidth } = activeRail;
        const maxScroll = Math.max(scrollWidth - clientWidth, 0);
        const epsilon = 2;
        const prev = prevScrollLeftRef.current;
        if (maxScroll > 2) {
          if (scrollLeft <= epsilon && prev > epsilon) triggerBounce("left");
          if (scrollLeft >= maxScroll - epsilon && prev < maxScroll - epsilon) {
            triggerBounce("right");
          }
        }
        prevScrollLeftRef.current = scrollLeft;
      }
      updateEdgeHints();
    };
    const onResize = () => updateEdgeHints();
    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(rafId);
      if (bounceTimeoutRef.current != null) {
        window.clearTimeout(bounceTimeoutRef.current);
        bounceTimeoutRef.current = null;
      }
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [triggerBounce, updateEdgeHints]);

  useEffect(() => {
    if (!activeSectionId) return;
    centerTab(activeSectionId, getScrollBehavior());
    const rafId = window.requestAnimationFrame(() => updateEdgeHints());
    return () => window.cancelAnimationFrame(rafId);
  }, [activeSectionId, centerTab, getScrollBehavior, updateEdgeHints]);

  const activeSection =
    sections.find((section: any) => section.id === activeSectionId) || sections[0];

  const renderBlock = (block: any) => {
    switch (block.type) {
      case "line-list":
        return (
          <div className={panelClass}>
            {renderLineList(block.lines || [], secondaryButtonClass)}
          </div>
        );
      case "text":
        return (
          <div className={panelClass}>
            {block.title ? (
              <p
                className={`text-[10px] font-black uppercase tracking-[0.18em] opacity-60 ${cardTitleClass}`}
              >
                {block.title}
              </p>
            ) : null}
            <p className={`${block.title ? "mt-2" : ""} text-sm leading-relaxed opacity-85`}>
              {block.text}
            </p>
          </div>
        );
      case "card-grid":
        return (
          <div className={panelClass}>
            {block.title ? (
              <h4 className={`mb-4 text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                {block.title}
              </h4>
            ) : null}
            <div
              className={
                block.id === "hotel-cards" ? hotelCardGridClass : gridClassForColumns(block.columns)
              }
            >
              {(block.cards || []).map((card: any, index: number) => {
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
                      className={`${cardClass} flex h-full flex-col overflow-hidden border-l-[3px] border-l-violet-500`}
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
                          <h4 className="mt-1 text-base font-black leading-tight tracking-tight sm:text-lg">
                            {card.label}
                          </h4>
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

                      {card.action?.url ? (
                        <div className="mt-auto pt-5">
                          <a
                            href={card.action.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${secondaryButtonClass} ${focusRing}`}
                          >
                            {card.action.label || "Book Hotel"}
                            <ExternalLink size={12} />
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
                      className={`${cardClass} relative overflow-hidden border-l-[3px] ${
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
                              <h4 className="text-sm font-black tracking-tight sm:text-base">
                                {card.label}
                              </h4>
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
                          {card.action?.url ? (
                            <a
                              href={card.action.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`mt-4 ${secondaryButtonClass} ${focusRing}`}
                            >
                              {card.action.label || "Open Link"}
                              <ExternalLink size={12} />
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                }
                return (
                  <div key={cardReactKey} className={`${cardClass} ${hotelCardLayoutClass}`.trim()}>
                    {card.label ? <p className={cardLabelClass}>{card.label}</p> : null}
                    {card.value ? (
                      <p className="mt-2 text-2xl font-black leading-none">{card.value}</p>
                    ) : null}
                    {card.body ? (
                      <p
                        className={`${card.value || card.label ? "mt-2" : ""} whitespace-pre-line text-sm leading-relaxed opacity-85`}
                      >
                        {card.body}
                      </p>
                    ) : null}
                    {Array.isArray(card.items) && card.items.length > 0 ? (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed opacity-85">
                        {card.items.map((item: string, itemIndex: number) => (
                          <li key={`${cardReactKey}-item-${itemIndex}`}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    {card.meta ? (
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] opacity-55">
                        {card.meta}
                      </p>
                    ) : null}
                    {card.action?.url ? (
                      <a
                        href={card.action.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${block.id === "hotel-cards" ? "mt-auto pt-4" : "mt-4"} ${secondaryButtonClass} ${focusRing}`}
                      >
                        {card.action.label || "Open Link"}
                        <ExternalLink size={12} />
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
          <div className={panelClass}>
            {block.title ? (
              <h4 className={`mb-4 text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                {block.title}
              </h4>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {(block.links || []).map((link: any, index: number) => (
                <a
                  key={link.url || `${block.id}-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${secondaryButtonClass} ${focusRing}`}
                >
                  {link.label || "Open Link"}
                  <ExternalLink size={12} />
                </a>
              ))}
            </div>
          </div>
        );
      case "cta":
        return (
          <div className={panelClass}>
            {block.title ? (
              <h4 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                {block.title}
              </h4>
            ) : null}
            {block.text ? (
              <p className="mt-2 text-sm leading-relaxed opacity-85">{block.text}</p>
            ) : null}
            <a
              href={block.action?.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-4 ${primaryButtonClass} ${focusRing}`}
            >
              {block.action?.label || "Open Link"}
              <ExternalLink size={12} />
            </a>
          </div>
        );
      case "image":
        return (
          <div className={panelClass}>
            {block.title ? (
              <h4 className={`mb-4 text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                {block.title}
              </h4>
            ) : null}
            <div className="overflow-hidden rounded-[24px] border border-black/10">
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
          <div className={panelClass}>
            {block.title ? (
              <h4 className={`mb-4 text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                {block.title}
              </h4>
            ) : null}
            {block.text ? (
              <p className="mb-4 text-sm leading-relaxed opacity-85">{block.text}</p>
            ) : null}
            <div className="overflow-hidden rounded-[24px] border border-black/10">
              <StaticMap address={block.address} height={360} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!sections.length) {
    return (
      <section className="space-y-4">
        <EmptyState className={panelClass}>
          Discovery content is still being synthesized from the source packet and page crawl.
        </EmptyState>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="sticky top-3 z-20">
        <div className={navShellClass}>
          <div
            className="transition-transform duration-200 ease-out will-change-transform"
            style={{ transform: `translateX(${bounceOffset}px)` }}
          >
            <div
              ref={railRef}
              className={navRailClass}
              role="tablist"
              aria-label="Meet information sections"
              tabIndex={0}
              data-mobile-horizontal-scroll
            >
              {sections.map((section: any) => {
                const isActive = activeSection?.id === section.id;
                const navLabel = section.navLabel || section.label;
                return (
                  <button
                    key={section.id}
                    ref={(node) => {
                      tabButtonRefs.current[section.id] = node;
                    }}
                    onClick={() => setActiveSectionId(section.id)}
                    className={`${focusRing} min-h-11 ${resolvedNavButtonClass} ${
                      isActive ? activeTabClass : idleTabClass
                    }`}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={navLabel}
                    title={navLabel}
                  >
                    <span className="truncate">{navLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div
          className={`pointer-events-none absolute bottom-2 left-1 top-2 w-10 rounded-l-[22px] transition-opacity duration-200 ${
            showLeftFade ? "opacity-60 md:opacity-0" : "opacity-0"
          }`}
          style={{ background: `linear-gradient(to right, ${navFadeClass}, rgba(255,255,255,0))` }}
        />
        <div
          className={`pointer-events-none absolute bottom-2 right-1 top-2 w-10 rounded-r-[22px] transition-opacity duration-200 ${
            showRightFade ? "opacity-60 md:opacity-0" : "opacity-0"
          }`}
          style={{ background: `linear-gradient(to left, ${navFadeClass}, rgba(255,255,255,0))` }}
        />
      </div>

      {activeSection ? (
        <div className="space-y-4">
          {activeSection.hideSectionHeading ? null : (
            <div className={sectionTitleClass}>
              <TabHeading title={activeSection.label} style={sectionTitleStyle} />
            </div>
          )}
          {activeSection.blocks.map((block: any) => (
            <React.Fragment key={block.id}>{renderBlock(block)}</React.Fragment>
          ))}
        </div>
      ) : (
        <EmptyState className={panelClass}>No discovery sections are available yet.</EmptyState>
      )}
    </section>
  );
}
