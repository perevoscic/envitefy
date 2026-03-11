"use client";

import React from "react";
import Image from "next/image";
import StaticMap from "@/components/StaticMap";
import { Activity, Car, ExternalLink, MapPin, ShieldAlert, Ticket, Users } from "lucide-react";
import { ShowcaseThemeConfig } from "./showcaseThemes";
import { GymMeetDiscoveryTabId, GymMeetInlineLinkLine, GymMeetRenderModel } from "./types";

export const SHOWCASE_DISCOVERY_TABS: Array<{
  id: GymMeetDiscoveryTabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: "meet-details", label: "MEET DETAILS", icon: Activity },
  { id: "coaches", label: "COACHES", icon: Users },
  { id: "venue-details", label: "VENUE DETAILS", icon: MapPin },
  { id: "admission-sales", label: "ADMISSION & SALES", icon: Ticket },
  { id: "traffic-parking", label: "TRAFFIC & ARRIVAL", icon: Car },
  { id: "safety-policy", label: "SAFETY & POLICY", icon: ShieldAlert },
];

const safeUrl = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";
  return /^https?:\/\//i.test(text) ? text : "";
};

const mapSearchUrl = (address: string) =>
  address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : "";

const renderLineList = ({
  lines,
  theme,
}: {
  lines: GymMeetInlineLinkLine[];
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

export default function ShowcaseDiscoveryContent({
  model,
  theme,
  activeTab,
}: {
  model: GymMeetRenderModel;
  theme: ShowcaseThemeConfig;
  activeTab: GymMeetDiscoveryTabId;
}) {
  const discovery = model.discovery;
  const panelTitleClass = theme.sectionTitleClass || "";
  const panelTitleStyle = theme.sectionTitleStyle;
  const cardTitleClass = panelTitleClass;
  const cardTitleStyle = panelTitleStyle;
  const navigationUrl =
    safeUrl(discovery?.trafficParking?.mapDashboardLink?.url) ||
    mapSearchUrl(discovery?.trafficParking?.mapAddress || "");
  const floorPlanUrl = safeUrl(discovery?.venueDetails?.gymLayoutImageUrl);
  const hasMeetOverviewContent =
    Boolean(discovery?.meetDetails?.hasContent) || model.announcements.length > 0;
  const safetyCards = [
    {
      key: "food-beverage",
      title: "Food & Beverage",
      body: discovery?.safetyPolicy?.foodBeverage,
    },
    {
      key: "hydration",
      title: "Hydration",
      body: discovery?.safetyPolicy?.hydration,
    },
    {
      key: "service-animals",
      title: "Service Animals",
      body: discovery?.safetyPolicy?.serviceAnimals,
    },
    {
      key: "safety-policy",
      title: "Safety Policy",
      body: discovery?.safetyPolicy?.safetyPolicy,
    },
  ].filter((item) => item.body);

  if (activeTab === "coaches") {
    return (
      <section className={theme.panelClass}>
        <div className="space-y-6">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${theme.accentClass}`}>
              Coaches
            </p>
            <h2
              className={`mt-2 text-3xl font-black tracking-tight sm:text-4xl ${panelTitleClass}`}
              style={panelTitleStyle}
            >
              Coach Info
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {discovery?.coaches?.signIn ? (
              <div className={theme.cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Sign-In
                </p>
                <p className="mt-2 text-sm leading-relaxed">{discovery.coaches.signIn}</p>
              </div>
            ) : null}
            {discovery?.coaches?.hospitality ? (
              <div className={theme.cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Hospitality
                </p>
                <p className="mt-2 text-sm leading-relaxed">{discovery.coaches.hospitality}</p>
              </div>
            ) : null}
            {discovery?.coaches?.floorAccess ? (
              <div className={theme.cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Floor Access
                </p>
                <p className="mt-2 text-sm leading-relaxed">{discovery.coaches.floorAccess}</p>
              </div>
            ) : null}
            {discovery?.coaches?.scratches ? (
              <div className={theme.cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Scratches
                </p>
                <p className="mt-2 text-sm leading-relaxed">{discovery.coaches.scratches}</p>
              </div>
            ) : null}
            {discovery?.coaches?.floorMusic ? (
              <div className={theme.cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Floor Music
                </p>
                <p className="mt-2 text-sm leading-relaxed">{discovery.coaches.floorMusic}</p>
              </div>
            ) : null}
            {discovery?.coaches?.rotationSheets ? (
              <div className={theme.cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Rotation Sheets
                </p>
                <p className="mt-2 text-sm leading-relaxed">
                  {discovery.coaches.rotationSheets}
                </p>
              </div>
            ) : null}
            {discovery?.coaches?.regionalCommitment ? (
              <div className={theme.cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Regional Commitment
                </p>
                <p className="mt-2 text-sm leading-relaxed">
                  {discovery.coaches.regionalCommitment}
                </p>
              </div>
            ) : null}
            {discovery?.coaches?.paymentInstructions ? (
              <div className={theme.cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Payment
                </p>
                <p className="mt-2 text-sm leading-relaxed">
                  {discovery.coaches.paymentInstructions}
                </p>
              </div>
            ) : null}
            {discovery?.coaches?.refundPolicy ? (
              <div className={theme.cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Refund Policy
                </p>
                <p className="mt-2 text-sm leading-relaxed">{discovery.coaches.refundPolicy}</p>
              </div>
            ) : null}
            {discovery?.coaches?.qualification ? (
              <div className={theme.cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Qualification
                </p>
                <p className="mt-2 text-sm leading-relaxed">{discovery.coaches.qualification}</p>
              </div>
            ) : null}
            {discovery?.coaches?.meetFormat ? (
              <div className={theme.cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Meet Format
                </p>
                <p className="mt-2 text-sm leading-relaxed">{discovery.coaches.meetFormat}</p>
              </div>
            ) : null}
            {discovery?.coaches?.equipment ? (
              <div className={theme.cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Equipment
                </p>
                <p className="mt-2 text-sm leading-relaxed">{discovery.coaches.equipment}</p>
              </div>
            ) : null}
            {discovery?.coaches?.awards ? (
              <div className={theme.cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Awards
                </p>
                <p className="mt-2 text-sm leading-relaxed">{discovery.coaches.awards}</p>
              </div>
            ) : null}
          </div>

          {discovery?.coaches?.entryFees?.length ||
          discovery?.coaches?.teamFees?.length ||
          discovery?.coaches?.lateFees?.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {discovery.coaches.entryFees.map((item, index) => (
                <div key={`entry-${item.label}-${index}`} className={theme.cardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    {item.label || "Entry fee"}
                  </p>
                  {item.amount ? <p className="mt-2 text-3xl font-black leading-none">{item.amount}</p> : null}
                  {item.note ? <p className="mt-3 text-sm opacity-85">{item.note}</p> : null}
                </div>
              ))}
              {discovery.coaches.teamFees.map((item, index) => (
                <div key={`team-${item.label}-${index}`} className={theme.cardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    {item.label || "Team fee"}
                  </p>
                  {item.amount ? <p className="mt-2 text-3xl font-black leading-none">{item.amount}</p> : null}
                  {item.note ? <p className="mt-3 text-sm opacity-85">{item.note}</p> : null}
                </div>
              ))}
              {discovery.coaches.lateFees.map((item, index) => (
                <div key={`late-${item.label}-${index}`} className={theme.cardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    {item.label || "Late fee"}
                  </p>
                  {item.amount ? <p className="mt-2 text-3xl font-black leading-none">{item.amount}</p> : null}
                  {item.trigger ? <p className="mt-3 text-sm font-semibold">{item.trigger}</p> : null}
                  {item.note ? <p className="mt-1 text-sm opacity-85">{item.note}</p> : null}
                </div>
              ))}
            </div>
          ) : null}

          {discovery?.coaches?.contacts?.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {discovery.coaches.contacts.map((contact, index) => (
                <div
                  key={`${contact.role}-${contact.email}-${index}`}
                  className={theme.cardClass}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    {contact.role || "Contact"}
                  </p>
                  {contact.name ? <p className="mt-2 text-sm font-semibold">{contact.name}</p> : null}
                  {contact.email ? <p className="mt-1 text-sm opacity-80">{contact.email}</p> : null}
                  {contact.phone ? <p className="mt-1 text-sm opacity-80">{contact.phone}</p> : null}
                </div>
              ))}
            </div>
          ) : null}

          {discovery?.coaches?.deadlines?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {discovery.coaches.deadlines.map((item, index) => (
                <div key={`${item.label}-${item.date}-${index}`} className={theme.cardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    {item.label || "Deadline"}
                  </p>
                  {item.date ? <p className="mt-2 text-sm font-semibold">{item.date}</p> : null}
                  {item.note ? <p className="mt-1 text-sm leading-relaxed opacity-85">{item.note}</p> : null}
                </div>
              ))}
            </div>
          ) : null}

          {discovery?.coaches?.attire?.length || discovery?.coaches?.notes?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {discovery.coaches.attire?.length ? (
                <div className={theme.cardClass}>
                  <p className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                    Coach Attire
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                    {discovery.coaches.attire.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-current opacity-40" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {discovery.coaches.notes?.length ? (
                <div className={theme.cardClass}>
                  <p className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                    Additional Coach Notes
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                    {discovery.coaches.notes.map((item) => (
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

          {discovery?.coaches?.links?.length ? (
            <div className="flex flex-wrap gap-2">
              {discovery.coaches.links.map((item, index) => (
                <a
                  key={`${item.url}-${index}`}
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
          ) : null}
        </div>
      </section>
    );
  }

  if (activeTab === "meet-details") {
    return hasMeetOverviewContent ? (
      <section className={theme.panelClass}>
        <div className="flex flex-col gap-6">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${theme.accentClass}`}>
              Meet Overview
            </p>
          </div>

          {renderLineList({ lines: discovery?.meetDetails?.lines || [], theme })}

          {model.announcements.length > 0 ? (
            <div className="space-y-3">
              <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${theme.accentClass}`}>
                Communication
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {model.announcements.slice(0, 4).map((item) => (
                  <div key={item.id} className="space-y-2">
                    {item.title ? (
                      <p
                        className={`text-lg font-black leading-tight ${cardTitleClass}`}
                        style={cardTitleStyle}
                      >
                        {item.title}
                      </p>
                    ) : null}
                    <div className={theme.cardClass}>
                      {item.body ? (
                        <p className="text-sm leading-relaxed opacity-85">{item.body}</p>
                      ) : null}
                      {item.date ? (
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] opacity-50">
                          {item.date}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    ) : (
      <section className={theme.panelClass}>
        <p className="text-sm leading-relaxed opacity-75">
          Meet details are still being mapped from the source packet. Re-open parsing in the
          builder to refresh this section.
        </p>
      </section>
    );
  }

  if (activeTab === "venue-details") {
    return (
      <section className={theme.panelClass}>
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${theme.accentClass}`}>
                Venue Details
              </p>
              <h2
                className={`mt-2 text-3xl font-black tracking-tight sm:text-4xl ${panelTitleClass}`}
                style={panelTitleStyle}
              >
                {model.venue || model.headerLocation || "Competition Venue"}
              </h2>
              {model.address || model.mapAddress ? (
                <p className="mt-3 text-sm leading-7 opacity-80">
                  {model.address || model.mapAddress}
                </p>
              ) : null}
            </div>

            {renderLineList({ lines: discovery?.venueDetails?.lines || [], theme })}

            <div className="grid gap-3 md:grid-cols-2">
              {discovery?.venueDetails?.registrationDeskNote ? (
                <div className={theme.cardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    Registration Desk
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    {discovery.venueDetails.registrationDeskNote}
                  </p>
                </div>
              ) : null}
              {discovery?.venueDetails?.assignedGymLabel ? (
                <div className={theme.cardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    Assigned Gym
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {discovery.venueDetails.assignedGymLabel}
                  </p>
                </div>
              ) : null}
              {discovery?.venueDetails?.awardsAreaItems?.length ? (
                <div className={`${theme.cardClass} md:col-span-2`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    Awards Area
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                    {discovery.venueDetails.awardsAreaItems.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-current opacity-40" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            {floorPlanUrl ? (
              <div className={theme.cardClass}>
                <div className="overflow-hidden border border-black/10 bg-black/5">
                  <Image
                    src={floorPlanUrl}
                    alt="Gym floor plan"
                    width={1600}
                    height={1200}
                    unoptimized
                    className="h-auto w-full object-cover"
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <a
                    href={floorPlanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={theme.ctaPrimaryClass}
                  >
                    Launch Floor Plan
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (activeTab === "admission-sales") {
    return (
      <section className={theme.panelClass}>
        <div className="space-y-6">
          {discovery?.admissionSales?.admissionCards?.length ? (
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              {discovery.admissionSales.admissionCards.map((item, index) => (
                <div key={`${item.label}-${index}`} className={theme.cardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    {item.label}
                  </p>
                  {item.price ? (
                    <p className="mt-2 text-3xl font-black leading-none">{item.price}</p>
                  ) : null}
                  {item.note ? <p className="mt-3 text-sm opacity-80">{item.note}</p> : null}
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            {discovery?.admissionSales?.primaryNote ? (
              <div className={theme.cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Primary Note
                </p>
                <p className="mt-2 text-sm leading-relaxed">
                  {discovery.admissionSales.primaryNote}
                </p>
              </div>
            ) : null}

            {discovery?.admissionSales?.logisticsItems?.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {discovery.admissionSales.logisticsItems.map((item) => (
                  <div key={item.key} className={theme.cardClass}>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {discovery?.admissionSales?.merchandiseText ||
            discovery?.admissionSales?.merchandiseLink ? (
              <div className={theme.cardClass}>
                <p className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                  Merchandise
                </p>
                {discovery.admissionSales.merchandiseText ? (
                  <p className="mt-2 text-sm leading-relaxed opacity-85">
                    {discovery.admissionSales.merchandiseText}
                  </p>
                ) : null}
                {safeUrl(discovery.admissionSales.merchandiseLink?.url) ? (
                  <a
                    href={discovery.admissionSales.merchandiseLink?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-4 ${theme.ctaSecondaryClass}`}
                  >
                    {discovery.admissionSales.merchandiseLink?.label || "Merchandise"}
                    <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>
            ) : null}

            {safeUrl(discovery?.admissionSales?.rotationLink?.url) ? (
              <div className={theme.cardClass}>
                <p className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                  Rotation Sheets
                </p>
                <p className="mt-2 text-sm leading-relaxed opacity-85">
                  Open the official packet, rotation sheet, or scoring reference linked by the
                  event source.
                </p>
                <a
                  href={discovery.admissionSales.rotationLink?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-4 ${theme.ctaSecondaryClass}`}
                >
                  {discovery.admissionSales.rotationLink?.label || "Official Link"}
                  <ExternalLink size={14} />
                </a>
              </div>
            ) : null}

            {discovery?.admissionSales?.resultsText ||
            discovery?.admissionSales?.resultsLinks?.length ? (
              <div className={theme.cardClass}>
                <p className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                  Results & Live Scoring
                </p>
                {discovery.admissionSales.resultsText ? (
                  <p className="mt-2 text-sm leading-relaxed opacity-85">
                    {discovery.admissionSales.resultsText}
                  </p>
                ) : null}
                {discovery.admissionSales.resultsLinks?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {discovery.admissionSales.resultsLinks.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={theme.ctaSecondaryClass}
                      >
                        Open Results
                        <ExternalLink size={14} />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (activeTab === "traffic-parking") {
    return (
      <section className={theme.panelClass}>
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${theme.accentClass}`}>
              Traffic & Arrival
            </p>
            <h2
              className={`mt-2 text-3xl font-black tracking-tight sm:text-4xl ${panelTitleClass}`}
              style={panelTitleStyle}
            >
              Arrival Guidance
            </h2>
            </div>

            {discovery?.trafficParking?.alertText ? (
              <div className={theme.cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Traffic Alert
                </p>
                <p className="mt-2 text-sm leading-relaxed">{discovery.trafficParking.alertText}</p>
                {discovery.trafficParking.alertSlots?.length ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {discovery.trafficParking.alertSlots.map((slot, index) => (
                      <div key={`${slot.date}-${index}`} className={theme.sectionCardClass}>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                          {slot.date}
                        </p>
                        <p className="mt-2 text-sm font-semibold">{slot.times}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              {discovery?.trafficParking?.parkingText ? (
                <div className={theme.cardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    Parking
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    {discovery.trafficParking.parkingText}
                  </p>
                </div>
              ) : null}
              {discovery?.trafficParking?.parkingLinks?.length ||
              discovery?.trafficParking?.parkingPricingLinks?.length ? (
                <div className={theme.cardClass}>
                  <p className={`text-lg font-black ${cardTitleClass}`} style={cardTitleStyle}>
                    Parking Links
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(discovery.trafficParking.parkingLinks || []).map((item, index) => (
                      <a
                        key={`parking-${item.url}-${index}`}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={theme.ctaSecondaryClass}
                      >
                        {item.label || "Parking Map"}
                        <ExternalLink size={14} />
                      </a>
                    ))}
                    {(discovery.trafficParking.parkingPricingLinks || []).map((item, index) => (
                      <a
                        key={`parking-price-${item.url}-${index}`}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={theme.ctaSecondaryClass}
                      >
                        {item.label || "Parking Rates"}
                        <ExternalLink size={14} />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
              {discovery?.trafficParking?.rideShareNote ? (
                <div className={theme.cardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    Ride Share
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    {discovery.trafficParking.rideShareNote}
                  </p>
                </div>
              ) : null}
              {discovery?.trafficParking?.hotelInfo ? (
                <div className={theme.cardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    Hotel Info
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    {discovery.trafficParking.hotelInfo}
                  </p>
                </div>
              ) : null}
              {discovery?.trafficParking?.daylightSavingsNote ? (
                <div className={theme.cardClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                    Timing Note
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    {discovery.trafficParking.daylightSavingsNote}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              {navigationUrl ? (
                <a
                  href={navigationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={theme.ctaPrimaryClass}
                >
                  Open Live Navigation
                  <ExternalLink size={14} />
                </a>
              ) : null}
              {safeUrl(discovery?.trafficParking?.ratesInfoLink?.url) ? (
                <a
                  href={discovery.trafficParking.ratesInfoLink?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={theme.ctaSecondaryClass}
                >
                  {discovery.trafficParking.ratesInfoLink?.label || "Rates Info"}
                  <ExternalLink size={14} />
                </a>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            {discovery?.trafficParking?.mapAddress ? (
              <div className={theme.cardClass}>
                <StaticMap address={discovery.trafficParking.mapAddress} height={360} />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={theme.panelClass}>
      <div className="space-y-6">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${theme.accentClass}`}>
            Safety & Policy
          </p>
          <h2
            className={`mt-2 text-3xl font-black tracking-tight sm:text-4xl ${panelTitleClass}`}
            style={panelTitleStyle}
          >
            Meet Safety
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {safetyCards.map((item) => (
            <div key={item.key} className={theme.cardClass}>
              <p
                className={`text-lg font-black leading-tight ${cardTitleClass}`}
                style={cardTitleStyle}
              >
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
