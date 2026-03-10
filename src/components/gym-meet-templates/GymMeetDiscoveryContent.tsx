/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Car,
  ClipboardList,
  Coffee,
  Droplets,
  Dog,
  ExternalLink,
  Info,
  Navigation,
  ShieldAlert,
  ShoppingBag,
  Ticket,
  Users,
} from "lucide-react";
import StaticMap from "@/components/StaticMap";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2";

const TabHeading = ({
  title,
  style,
}: {
  title: string;
  style?: React.CSSProperties;
}) => (
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

const DEFAULT_DISCOVERY_TABS = [
  { id: "meet-details", label: "Meet Details" },
  { id: "venue-details", label: "Venue Details" },
  { id: "admission-sales", label: "Admission & Sales" },
  { id: "traffic-parking", label: "Traffic & Parking" },
  { id: "safety-policy", label: "Safety Policy" },
];

export default function GymMeetDiscoveryContent({
  model,
  variant,
}: {
  model: any;
  variant: any;
}) {
  const tabs = useMemo(() => {
    const rawTabs = Array.isArray(model?.discovery?.tabs) ? model.discovery.tabs : [];
    if (rawTabs.length >= DEFAULT_DISCOVERY_TABS.length) return rawTabs;

    const rawTabMap = new Map(
      rawTabs
        .filter((tab: any) => typeof tab?.id === "string")
        .map((tab: any) => [tab.id, tab])
    );

    return DEFAULT_DISCOVERY_TABS.map((tab) => ({
      ...tab,
      ...(rawTabMap.get(tab.id) || {}),
    }));
  }, [model?.discovery?.tabs]);
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "meet-details");
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
  const navRailClass =
    variant.navRailClass ||
    "no-scrollbar flex gap-2 overflow-x-auto px-1 py-1 md:grid md:overflow-visible";
  const navButtonClass = variant.navButtonClass || "md:w-full md:min-w-0 md:flex-1";
  const navRailStyle =
    tabs.length > 1 ? ({ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` } as const) : undefined;
  const resolvedNavButtonClass =
    tabs.length === 1
      ? `inline-flex items-center justify-center whitespace-nowrap ${navButtonClass}`
      : `inline-flex flex-none items-center justify-center whitespace-nowrap md:w-full md:min-w-0 ${navButtonClass}`;
  const secondaryButtonClass = variant.secondaryButtonClass;
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

  const centerTab = useCallback(
    (tabId: string, behavior: ScrollBehavior = "smooth") => {
      const tabButton = tabButtonRefs.current[tabId];
      if (!tabButton) return;
      tabButton.scrollIntoView({
        behavior,
        inline: "center",
        block: "nearest",
      });
    },
    []
  );

  const triggerBounce = useCallback((direction: "left" | "right") => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const offset = direction === "left" ? 10 : -10;
    setBounceOffset(offset);
    if (bounceTimeoutRef.current != null) {
      window.clearTimeout(bounceTimeoutRef.current);
    }
    bounceTimeoutRef.current = window.setTimeout(() => {
      setBounceOffset(0);
      bounceTimeoutRef.current = null;
    }, 170);
  }, []);

  useEffect(() => {
    if (!tabs.some((tab: any) => tab.id === activeTab)) {
      setActiveTab(tabs[0]?.id || "meet-details");
    }
  }, [activeTab, tabs]);

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
    centerTab(activeTab, getScrollBehavior());
    const rafId = window.requestAnimationFrame(() => {
      updateEdgeHints();
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [activeTab, centerTab, getScrollBehavior, updateEdgeHints]);

  const renderLineList = (lines: Array<{ text: string; href?: string }>) => (
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

  const discovery = model.discovery;
  const hasMeetOverviewContent =
    Boolean(discovery?.meetDetails?.hasContent) || (model?.announcements?.length ?? 0) > 0;
  const venueAwards = discovery.venueDetails.awardsAreaItems || [];

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
                style={navRailStyle}
              >
              {tabs.map((tab: any) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    ref={(node) => {
                      tabButtonRefs.current[tab.id] = node;
                    }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${focusRing} ${resolvedNavButtonClass} shrink-0 md:shrink ${
                      isActive ? activeTabClass : idleTabClass
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {tab.label}
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

      {activeTab === "meet-details" ? (
        hasMeetOverviewContent ? (
          <div className={panelClass}>
            <div className={sectionTitleClass}>
              <TabHeading title="Meet Details" style={sectionTitleStyle} />
            </div>
            {renderLineList(discovery.meetDetails.lines)}
            {model.announcements.length > 0 ? (
              <div className="mt-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Communication
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {model.announcements.slice(0, 4).map((item: any) => (
                    <div key={item.id} className={cardClass}>
                      {item.title ? (
                        <p
                          className={`text-lg font-black leading-tight ${cardTitleClass}`}
                          style={cardTitleStyle}
                        >
                          {item.title}
                        </p>
                      ) : null}
                      {item.body ? (
                        <p className={`${item.title ? "mt-2 " : ""}text-sm leading-relaxed opacity-80`}>
                          {item.body}
                        </p>
                      ) : null}
                      {item.date ? (
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] opacity-50">
                          {item.date}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState className={panelClass}>
            Meet details are still being mapped from the source packet. Re-open parsing in the
            builder to refresh this section.
          </EmptyState>
        )
      ) : null}

      {activeTab === "coaches" ? (
        discovery.coaches.hasContent ? (
          <div className="space-y-4">
            <div className={panelClass}>
              <div className={sectionTitleClass}>
                <TabHeading title="Coach Info" style={sectionTitleStyle} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {discovery.coaches.signIn ? (
                  <div className={cardClass}>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                      Sign-In
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">{discovery.coaches.signIn}</p>
                  </div>
                ) : null}
                {discovery.coaches.hospitality ? (
                  <div className={cardClass}>
                    <div className="flex items-start gap-3">
                      <Coffee size={18} className="mt-0.5 opacity-60" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                          Hospitality
                        </p>
                        <p className="mt-2 text-sm leading-relaxed">
                          {discovery.coaches.hospitality}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {discovery.coaches.floorAccess ? (
                  <div className={cardClass}>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                      Floor Access
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">
                      {discovery.coaches.floorAccess}
                    </p>
                  </div>
                ) : null}
                {discovery.coaches.scratches ? (
                  <div className={cardClass}>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                      Scratches
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">{discovery.coaches.scratches}</p>
                  </div>
                ) : null}
                {discovery.coaches.rotationSheets ? (
                  <div className={cardClass}>
                    <div className="flex items-start gap-3">
                      <ClipboardList size={18} className="mt-0.5 opacity-60" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                          Rotation Sheets
                        </p>
                        <p className="mt-2 text-sm leading-relaxed">
                          {discovery.coaches.rotationSheets}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {discovery.coaches.regionalCommitment ? (
                  <div className={cardClass}>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                      Regional Commitment
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">
                      {discovery.coaches.regionalCommitment}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {discovery.coaches.contacts.length > 0 ? (
              <div className={panelClass}>
                <div className="mb-4 flex items-center gap-3">
                  <Users size={20} className="opacity-70" />
                  <h4 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                    Coach Contacts
                  </h4>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {discovery.coaches.contacts.map((contact: any, index: number) => (
                    <div key={`${contact.role}-${contact.email}-${index}`} className={cardClass}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                        {contact.role || "Contact"}
                      </p>
                      {contact.name ? <p className="mt-2 text-sm font-semibold">{contact.name}</p> : null}
                      {contact.email ? <p className="mt-1 text-sm opacity-80">{contact.email}</p> : null}
                      {contact.phone ? <p className="mt-1 text-sm opacity-80">{contact.phone}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {discovery.coaches.deadlines.length > 0 ? (
              <div className={panelClass}>
                <h4 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                  Coach Deadlines
                </h4>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {discovery.coaches.deadlines.map((item: any, index: number) => (
                    <div key={`${item.label}-${item.date}-${index}`} className={cardClass}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                        {item.label || "Deadline"}
                      </p>
                      {item.date ? <p className="mt-2 text-sm font-semibold">{item.date}</p> : null}
                      {item.note ? <p className="mt-1 text-sm leading-relaxed opacity-80">{item.note}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {discovery.coaches.attire.length > 0 || discovery.coaches.notes.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {discovery.coaches.attire.length > 0 ? (
                  <div className={panelClass}>
                    <h4 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                      Coach Attire
                    </h4>
                    <ul className="mt-4 space-y-2 text-sm leading-relaxed opacity-85">
                      {discovery.coaches.attire.map((item: string) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-current opacity-40" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {discovery.coaches.notes.length > 0 ? (
                  <div className={panelClass}>
                    <h4 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                      Additional Coach Notes
                    </h4>
                    <ul className="mt-4 space-y-2 text-sm leading-relaxed opacity-85">
                      {discovery.coaches.notes.map((item: string) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-current opacity-40" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState className={panelClass}>
            Coach-specific instructions were not detected in the source packet.
          </EmptyState>
        )
      ) : null}

      {activeTab === "venue-details" ? (
        discovery.venueDetails.hasContent ? (
          <div className={panelClass}>
            <div className={sectionTitleClass}>
              <TabHeading title="Venue Details" style={sectionTitleStyle} />
            </div>
            {discovery.venueDetails.lines.length > 0 ? renderLineList(discovery.venueDetails.lines) : null}

            {discovery.venueDetails.registrationDeskNote ? (
              <div className="mt-6">
                <div className={cardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    Registration Desk
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    {discovery.venueDetails.registrationDeskNote}
                  </p>
                </div>
              </div>
            ) : null}

            {venueAwards.length > 0 ? (
              <div className="mt-4">
                <div className={cardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    Awards Area
                  </p>
                  {venueAwards.length > 1 ? (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed opacity-85">
                      {venueAwards.map((item: string) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed">{venueAwards[0]}</p>
                  )}
                </div>
              </div>
            ) : null}

            {discovery.venueDetails.assignedGymLabel ? (
              <div className="mt-4">
                <div className={cardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    Assigned Gym Location
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {discovery.venueDetails.assignedGymLabel}
                  </p>
                </div>
              </div>
            ) : null}

            {discovery.venueDetails.gymLayoutImageUrl ? (
              <div className="mt-4">
                <div className="overflow-hidden rounded-[24px] border border-black/10">
                  <Image
                    src={discovery.venueDetails.gymLayoutImageUrl}
                    alt="Gym layout"
                    width={1600}
                    height={1200}
                    unoptimized
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState className={panelClass}>
            Venue details are still being extracted. Upload or re-parse the packet/image to
            populate this area.
          </EmptyState>
        )
      ) : null}

      {activeTab === "admission-sales" ? (
        discovery.admissionSales.hasContent ? (
          <div className="space-y-4">
            <div className={panelClass}>
              {discovery.admissionSales.admissionCards.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {discovery.admissionSales.admissionCards.map((item: any, index: number) => (
                    <div key={`${item.label}-${index}`} className={cardClass}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                        {item.label}
                      </p>
                      {item.price ? (
                        <p className="mt-2 text-2xl font-black leading-none">{item.price}</p>
                      ) : null}
                      {item.note ? <p className="mt-2 text-sm opacity-80">{item.note}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {discovery.admissionSales.primaryNote ? (
                <div className={`mt-4 ${cardClass}`}>
                  <div className="flex items-start gap-3">
                    <Info size={18} className="mt-0.5 opacity-60" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                        Admission Note
                      </p>
                      <p className="mt-2 text-sm leading-relaxed">
                        {discovery.admissionSales.primaryNote}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {discovery.admissionSales.logisticsItems.length > 0 ? (
                <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {discovery.admissionSales.logisticsItems.map((item: any) => (
                    <div key={item.key} className={cardClass}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {discovery.admissionSales.merchandiseText || discovery.admissionSales.merchandiseLink ? (
                <div className={panelClass}>
                  <ShoppingBag className="mb-4 opacity-70" size={26} />
                  <h4 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                    Merchandise
                  </h4>
                  {discovery.admissionSales.merchandiseText ? (
                    <p className="mt-2 text-sm leading-relaxed opacity-80">
                      {discovery.admissionSales.merchandiseText}
                    </p>
                  ) : null}
                  {discovery.admissionSales.merchandiseLink ? (
                    <a
                      href={discovery.admissionSales.merchandiseLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-4 ${secondaryButtonClass} ${focusRing}`}
                    >
                      {discovery.admissionSales.merchandiseLink.label || "Merchandise Link"}
                      <ExternalLink size={12} />
                    </a>
                  ) : null}
                </div>
              ) : null}

              {discovery.admissionSales.rotationLink ? (
                <div className={panelClass}>
                  <ClipboardList className="mb-4 opacity-70" size={26} />
                  <h4 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                    Rotation Sheets
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed opacity-80">
                    Download or view updated rotation sheets from the official event links.
                  </p>
                  <a
                    href={discovery.admissionSales.rotationLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-4 ${secondaryButtonClass} ${focusRing}`}
                  >
                    {discovery.admissionSales.rotationLink.label || "Official Website"}
                    <ExternalLink size={12} />
                  </a>
                </div>
              ) : null}

              {discovery.admissionSales.resultsText || discovery.admissionSales.resultsLinks.length > 0 ? (
                <div className={panelClass}>
                  <Ticket className="mb-4 opacity-70" size={26} />
                  <h4 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                    Results & Live Scoring
                  </h4>
                  {discovery.admissionSales.resultsText ? (
                    <p className="mt-2 text-sm leading-relaxed opacity-80">
                      {discovery.admissionSales.resultsText}
                    </p>
                  ) : null}
                  {discovery.admissionSales.resultsLinks.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {discovery.admissionSales.resultsLinks.map((url: string) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${secondaryButtonClass} ${focusRing}`}
                        >
                          Open Link <ExternalLink size={12} />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <EmptyState className={panelClass}>
            Admission pricing and merchandise details were not found in mapped fields yet.
          </EmptyState>
        )
      ) : null}

      {activeTab === "traffic-parking" ? (
        discovery.trafficParking.hasContent ? (
          <div className="space-y-4">
            {discovery.trafficParking.alertText ? (
              <section className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-5 text-red-950">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-red-600 p-3 text-white">
                    <AlertTriangle size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black leading-tight">Traffic Alert</h3>
                    <p className="mt-2 text-sm leading-relaxed opacity-90">
                      {discovery.trafficParking.alertText}
                    </p>
                    {discovery.trafficParking.alertSlots.length > 0 ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {discovery.trafficParking.alertSlots.map((slot: any, index: number) => (
                          <div
                            key={`${slot.date}-${index}`}
                            className="rounded-2xl border border-red-200 bg-white/80 px-4 py-4"
                          >
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-900">
                              {slot.date}
                            </p>
                            <p className="mt-1 text-xs font-bold text-red-700">{slot.times}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {discovery.trafficParking.daylightSavingsNote ? (
              <div className={panelClass}>
                <div className={sectionTitleClass}>
                  <TabHeading title="Traffic & Parking" style={sectionTitleStyle} />
                </div>
                <p className="text-sm leading-relaxed opacity-85">
                  {discovery.trafficParking.daylightSavingsNote}
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {discovery.trafficParking.parkingText ? (
                <div className={panelClass}>
                  <div className="mb-4 flex items-center gap-3">
                    <Car size={22} className="opacity-70" />
                    <h4 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                      Parking
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed opacity-80">
                    {discovery.trafficParking.parkingText}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {discovery.trafficParking.mapDashboardLink ? (
                      <a
                        href={discovery.trafficParking.mapDashboardLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${variant.primaryButtonClass} ${focusRing}`}
                      >
                        Map Dashboard
                      </a>
                    ) : null}
                    {discovery.trafficParking.ratesInfoLink ? (
                      <a
                        href={discovery.trafficParking.ratesInfoLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${secondaryButtonClass} ${focusRing}`}
                      >
                        Rates Info
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {discovery.trafficParking.mapAddress || discovery.trafficParking.hotelInfo ? (
                <div className={panelClass}>
                  <div className="mb-4 flex items-center gap-3">
                    <Navigation size={22} className="opacity-70" />
                    <h4 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                      Ride Share
                    </h4>
                  </div>
                  {discovery.trafficParking.mapAddress ? (
                    <p className="text-sm leading-relaxed opacity-80">
                      Best drop-off near <strong>{discovery.trafficParking.mapAddress}</strong>.
                    </p>
                  ) : null}
                  {discovery.trafficParking.rideShareNote ? (
                    <p className="mt-3 text-sm leading-relaxed opacity-80">
                      {discovery.trafficParking.rideShareNote}
                    </p>
                  ) : null}
                  {discovery.trafficParking.hotelInfo ? (
                    <div className={`mt-4 ${cardClass}`}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                        Nearby Stay / Travel Note
                      </p>
                      <p className="mt-2 text-sm leading-relaxed">
                        {discovery.trafficParking.hotelInfo}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {discovery.trafficParking.mapAddress ? (
              <div className="overflow-hidden rounded-[24px] border border-black/10">
                <StaticMap address={discovery.trafficParking.mapAddress} height={360} />
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState className={panelClass}>
            Parking and traffic guidance was not mapped into fields yet. Re-run parsing after
            upload to refresh this tab.
          </EmptyState>
        )
      ) : null}

      {activeTab === "safety-policy" ? (
        discovery.safetyPolicy.hasContent ? (
          <div className="grid gap-4 md:grid-cols-2">
            {discovery.safetyPolicy.foodBeverage ? (
              <div className={panelClass}>
                <Coffee className="mb-4 opacity-70" size={26} />
                <h4 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                  Food & Beverage
                </h4>
                <p className="mt-2 text-sm leading-relaxed opacity-80">
                  {discovery.safetyPolicy.foodBeverage}
                </p>
              </div>
            ) : null}
            {discovery.safetyPolicy.hydration ? (
              <div className={panelClass}>
                <Droplets className="mb-4 opacity-70" size={26} />
                <h4 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                  Hydration
                </h4>
                <p className="mt-2 text-sm leading-relaxed opacity-80">
                  {discovery.safetyPolicy.hydration}
                </p>
              </div>
            ) : null}
            {discovery.safetyPolicy.serviceAnimals ? (
              <div className={panelClass}>
                <Dog className="mb-4 opacity-70" size={26} />
                <h4 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                  Service Animals
                </h4>
                <p className="mt-2 text-sm leading-relaxed opacity-80">
                  {discovery.safetyPolicy.serviceAnimals}
                </p>
              </div>
            ) : null}
            {discovery.safetyPolicy.safetyPolicy ? (
              <div className={panelClass}>
                <ShieldAlert className="mb-4 opacity-70 text-red-500" size={26} />
                <h4 className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                  Safety Policy
                </h4>
                <p className="mt-2 text-sm leading-relaxed opacity-80">
                  {discovery.safetyPolicy.safetyPolicy}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState className={panelClass}>Policy details were not mapped from the current source text yet.</EmptyState>
        )
      ) : null}
    </section>
  );
}
