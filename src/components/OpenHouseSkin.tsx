"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bath,
  BedDouble,
  Calendar,
  CalendarPlus,
  CarFront,
  ExternalLink,
  Home,
  MapPin,
  MessageSquare,
  Phone,
  Ruler,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  EVENT_SKIN_ACTIONS_CLASS,
  EVENT_SKIN_CONTENT_TOP_PADDING_CLASS,
  EVENT_SKIN_FOOTER_CLASS,
  EVENT_SKIN_FOOTER_DIVIDER_CLASS,
  EVENT_SKIN_FOOTER_TEXT_CLASS,
} from "@/components/event-skin-layout";
import OcrFactCards from "@/components/OcrFactCards";
import ScannedSkinBackground from "@/components/ScannedSkinBackground";
import { buildLiveCardRsvpOutboundHref } from "@/lib/live-card-rsvp";
import { filterRenderedOcrFacts, normalizeOcrFacts, type OcrFact } from "@/lib/ocr/facts";
import type { OcrSkinBackground } from "@/lib/ocr/skin-background";
import {
  ensureReadableTextColor,
  getLuminance,
  mixHexColors,
  normalizeScannedInvitePalette,
} from "@/lib/scanned-invite-palette";
import { isRsvpMailtoHref, openRsvpMailtoHref } from "@/utils/rsvp-mailto";

type CalendarLinks = {
  google: string;
  outlook: string;
  appleInline: string;
};

type Palette = {
  background?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  text?: string;
  dominant?: string;
  themeColor?: string;
} | null;

type OpenHouseField = {
  key?: string | null;
  label?: string | null;
  value?: string | null;
};

type OpenHouseData = {
  listingType?: string | null;
  propertyType?: string | null;
  price?: string | null;
  mlsNumber?: string | null;
  bedrooms?: string | null;
  bathrooms?: string | null;
  sqft?: string | null;
  lotSize?: string | null;
  yearBuilt?: string | null;
  parking?: string | null;
  hoa?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  agencyName?: string | null;
  brokerageName?: string | null;
  realtorName?: string | null;
  realtorTitle?: string | null;
  realtorLicense?: string | null;
  realtorPhone?: string | null;
  realtorEmail?: string | null;
  websiteUrl?: string | null;
  listingUrl?: string | null;
  features?: string[] | null;
  realtorImageUrl?: string | null;
  extractedFields?: OpenHouseField[] | null;
};

type Props = {
  title: string;
  dateLabel?: string | null;
  timeLabel?: string | null;
  venueName?: string | null;
  location?: string | null;
  imageUrl?: string | null;
  shareUrl?: string | null;
  calendarLinks?: CalendarLinks | null;
  skinId?: string | null;
  palette?: Palette;
  background?: OcrSkinBackground | null;
  rsvpName?: string | null;
  rsvpPhone?: string | null;
  rsvpEmail?: string | null;
  rsvpUrl?: string | null;
  detailCopy?: string | null;
  ocrFacts?: OcrFact[] | null;
  openHouse?: OpenHouseData | null;
  previewMode?: boolean;
  actions?: ReactNode;
};

const DEFAULT_PALETTE = {
  background: "#eef7f4",
  primary: "#0f766e",
  secondary: "#1f2937",
  accent: "#d9a441",
  text: "#111827",
  dominant: "#0f766e",
  themeColor: "#0f766e",
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildMapsHref(location: string | null | undefined): string | null {
  const value = clean(location);
  if (!value || value === "Location TBD") return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
}

function buildContactHref(params: {
  rsvpUrl?: string | null;
  listingUrl?: string | null;
  websiteUrl?: string | null;
  rsvpPhone?: string | null;
  realtorPhone?: string | null;
  rsvpEmail?: string | null;
  realtorEmail?: string | null;
  title: string;
  shareUrl?: string | null;
}) {
  const url = clean(params.rsvpUrl) || clean(params.listingUrl) || clean(params.websiteUrl);
  if (url) return url;
  const contact = [
    clean(params.rsvpEmail) || clean(params.realtorEmail),
    clean(params.rsvpPhone) || clean(params.realtorPhone),
  ]
    .filter(Boolean)
    .join(" ");
  return (
    buildLiveCardRsvpOutboundHref({
      rsvpContact: contact,
      eventTitle: params.title,
      responseLabel: "Contact",
      shareUrl: params.shareUrl || "",
      category: "Open House",
    }) || null
  );
}

function isTopSpecDetailLabel(label: string) {
  return /^(?:beds?|bedrooms?|baths?|bathrooms?|sq(?:uare)?\.?\s*ft|square footage|parking|garage)$/i.test(
    label,
  );
}

function isRealtorDetailLabel(label: string) {
  const value = clean(label);
  if (!value || /\btagline\b/i.test(value)) return false;
  return (
    /^(?:agent|agent title|realtor|realtor title|listing agent|broker|brokerage|agency|contact|phone|email|license)$/i.test(
      value,
    ) || (/\b(?:agent|realtor)\b/i.test(value) && /\b(?:title|name|phone|email|contact|license)\b/i.test(value))
  );
}

export default function OpenHouseSkin({
  title,
  dateLabel,
  timeLabel,
  venueName,
  location,
  imageUrl,
  shareUrl,
  calendarLinks,
  skinId,
  palette,
  background,
  rsvpName,
  rsvpPhone,
  rsvpEmail,
  rsvpUrl,
  detailCopy,
  ocrFacts,
  openHouse,
  previewMode = false,
  actions,
}: Props) {
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const colors = useMemo(
    () => normalizeScannedInvitePalette(palette as any, DEFAULT_PALETTE as any),
    [palette],
  );
  const pageIsDark = getLuminance(colors.background) < 0.36;
  const pageText = ensureReadableTextColor(colors.background, colors.text, { minContrast: 4.5 });
  const priceText = ensureReadableTextColor(colors.background, colors.primary, {
    minContrast: 4.5,
  });
  const surface = pageIsDark
    ? mixHexColors(colors.background, "#ffffff", 0.12) || "#1f2937"
    : "#ffffff";
  const surfaceText = ensureReadableTextColor(surface, colors.text, { minContrast: 4.5 });
  const mutedText = mixHexColors(surfaceText, surface, 0.45) || surfaceText;
  const primaryText = ensureReadableTextColor(colors.primary, "#ffffff", { minContrast: 4.5 });
  const secondaryText = ensureReadableTextColor(colors.secondary, "#ffffff", { minContrast: 4.5 });
  const accentText = ensureReadableTextColor(colors.accent, "#111827", { minContrast: 3 });
  const footerDivider = pageIsDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.1)";
  const footerText = pageIsDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.3)";
  const footerBrandText = pageIsDark ? "rgba(255,255,255,0.58)" : "rgba(0,0,0,0.4)";

  const displayTitle = clean(title) || "Open House";
  const displayDate = clean(dateLabel) || "Date TBD";
  const displayTime = clean(timeLabel);
  const displayAddress = clean(openHouse?.address) || clean(location) || "Location TBD";
  const displayVenue = clean(venueName) || clean(openHouse?.neighborhood);
  const price = clean(openHouse?.price);
  const listingUrl = clean(openHouse?.listingUrl);
  const websiteUrl = clean(openHouse?.websiteUrl);
  const realtorName = clean(openHouse?.realtorName) || clean(rsvpName);
  const realtorPhone = clean(openHouse?.realtorPhone) || clean(rsvpPhone);
  const realtorEmail = clean(openHouse?.realtorEmail) || clean(rsvpEmail);
  const realtorTitle = clean(openHouse?.realtorTitle);
  const realtorLicense = clean(openHouse?.realtorLicense);
  const agency = clean(openHouse?.agencyName) || clean(openHouse?.brokerageName);
  const heroImage = imageUrl || "";
  const contactHref = buildContactHref({
    rsvpUrl,
    listingUrl,
    websiteUrl,
    rsvpPhone,
    realtorPhone,
    rsvpEmail,
    realtorEmail,
    title: displayTitle,
    shareUrl,
  });
  const directionsHref = buildMapsHref([displayVenue, displayAddress].filter(Boolean).join(", "));
  const bedrooms = clean(openHouse?.bedrooms);
  const bathrooms = clean(openHouse?.bathrooms);
  const squareFootage = clean(openHouse?.sqft);
  const parking = clean(openHouse?.parking);
  const specs = [
    { label: "Beds", value: bedrooms, icon: <BedDouble className="h-5 w-5" /> },
    { label: "Baths", value: bathrooms, icon: <Bath className="h-5 w-5" /> },
    { label: "Sq Ft", value: squareFootage, icon: <Ruler className="h-5 w-5" /> },
    { label: "Parking", value: parking, icon: <CarFront className="h-5 w-5" /> },
  ].filter((item) => item.value);
  const secondarySpecs = [
    ["MLS", openHouse?.mlsNumber],
    ["Type", openHouse?.propertyType],
    ["Lot", openHouse?.lotSize],
    ["Year Built", openHouse?.yearBuilt],
    ["HOA", openHouse?.hoa],
  ]
    .map(([label, value]) => ({ label: clean(label), value: clean(value) }))
    .filter((item) => item.value);
  const features = Array.isArray(openHouse?.features)
    ? openHouse.features
        .map((item) => clean(item))
        .filter(Boolean)
        .slice(0, 12)
    : [];
  const extractedFields = Array.isArray(openHouse?.extractedFields)
    ? openHouse.extractedFields
        .map((field) => ({ label: clean(field?.label), value: clean(field?.value) }))
        .filter((field) => field.label && field.value)
        .filter((field) => !isTopSpecDetailLabel(field.label))
        .filter((field) => !isRealtorDetailLabel(field.label))
        .slice(0, 18)
    : [];
  const displayFacts = filterRenderedOcrFacts(normalizeOcrFacts(ocrFacts), [
    displayTitle,
    displayDate,
    displayTime,
    displayAddress,
    price,
    realtorName,
    realtorTitle,
    agency,
    realtorLicense,
    realtorPhone,
    realtorEmail,
    bedrooms,
    bedrooms ? `${bedrooms} Beds` : "",
    bathrooms,
    bathrooms ? `${bathrooms} Baths` : "",
    squareFootage,
    squareFootage ? `${squareFootage} Sq Ft` : "",
    parking,
    specs.map((item) => item.value),
    secondarySpecs.map((item) => item.value),
    features,
    extractedFields.map((field) => field.value),
  ]).filter((fact) => !isRealtorDetailLabel(fact.label));

  useEffect(() => {
    if (!previewMode) window.scrollTo(0, 0);
  }, [previewMode]);

  useEffect(() => {
    if (!lightboxImage) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxImage(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxImage]);

  const themeStyle = {
    ["--theme-primary" as string]: colors.primary,
    ["--theme-secondary" as string]: colors.secondary,
    ["--theme-accent" as string]: colors.accent,
    ["--theme-background" as string]: colors.background,
    ["--theme-text" as string]: colors.text,
  };

  return (
    <motion.div
      data-skin-id="open-house-skin"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen overflow-hidden pb-10 font-sans"
      style={{ ...themeStyle, backgroundColor: colors.background, color: pageText }}
    >
      <ScannedSkinBackground
        category="open-house"
        title={displayTitle}
        skinId={skinId}
        palette={colors}
        background={background}
      />
      <div
        className={`relative z-10 mx-auto max-w-6xl px-4 md:px-8 ${EVENT_SKIN_CONTENT_TOP_PADDING_CLASS}`}
      >
        {actions ? <div className={EVENT_SKIN_ACTIONS_CLASS}>{actions}</div> : null}

        <section className="grid gap-8 pt-4 md:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] md:items-center md:pt-12">
          <div className="space-y-5">
            <div
              className="inline-flex rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[0.28em] shadow-lg"
              style={{ backgroundColor: colors.accent, color: accentText }}
            >
              Open House
            </div>
            <h1 className="serif text-5xl leading-[0.95] tracking-tight md:text-7xl">
              {displayTitle}
            </h1>
            {price ? (
              <div className="text-3xl font-black md:text-5xl" style={{ color: priceText }}>
                {price}
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoPill icon={<Calendar className="h-5 w-5" />} label="When" value={displayDate} />
              {displayTime ? (
                <InfoPill
                  icon={<Sparkles className="h-5 w-5" />}
                  label="Tour"
                  value={displayTime}
                />
              ) : null}
              <InfoPill
                icon={<MapPin className="h-5 w-5" />}
                label="Address"
                value={displayAddress}
                wide
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => heroImage && setLightboxImage(heroImage)}
            disabled={!heroImage}
            className="group relative overflow-hidden rounded-[2rem] border-8 border-white bg-white text-left shadow-2xl disabled:cursor-default"
          >
            {heroImage ? (
              <img
                src={heroImage}
                alt={`${displayTitle} flyer`}
                className="aspect-[4/3] w-full bg-white object-contain transition duration-500 group-hover:scale-[1.01]"
              />
            ) : (
              <div className="aspect-[4/3] w-full" style={{ backgroundColor: colors.primary }} />
            )}
            <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-2 text-xs font-black uppercase tracking-widest text-black shadow">
              View flyer
            </div>
          </button>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
          <div className="grid gap-6">
            {specs.length ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {specs.map((item) => (
                  <SpecCard key={item.label} {...item} surface={surface} textColor={surfaceText} />
                ))}
              </div>
            ) : null}

            {features.length ? (
              <section
                className="rounded-[2rem] border border-black/5 p-6 shadow-sm"
                style={{ backgroundColor: surface, color: surfaceText }}
              >
                <div
                  className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: mutedText }}
                >
                  Features
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm font-semibold">
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: colors.accent }}
                      />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {secondarySpecs.length || extractedFields.length ? (
              <section
                className="rounded-[2rem] border border-black/5 p-6 shadow-sm"
                style={{ backgroundColor: surface, color: surfaceText }}
              >
                <div
                  className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: mutedText }}
                >
                  Property Details
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[...secondarySpecs, ...extractedFields].map((field) => (
                    <DetailRow
                      key={`${field.label}-${field.value}`}
                      label={field.label}
                      value={field.value}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {displayFacts.length ? (
              <OcrFactCards
                facts={displayFacts}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                cardClassName="rounded-[1.5rem] border border-black/5 bg-white p-5 shadow-sm"
              />
            ) : null}
          </div>

          <aside className="grid gap-5 self-start">
            <section
              className="rounded-[2rem] border border-black/5 p-6 shadow-xl"
              style={{ backgroundColor: surface, color: surfaceText }}
            >
              <div className="flex items-center gap-4">
                {clean(openHouse?.realtorImageUrl) ? (
                  <img
                    src={clean(openHouse?.realtorImageUrl)}
                    alt={realtorName ? `${realtorName} headshot` : "Realtor headshot"}
                    className="h-32 w-32 shrink-0 rounded-[1.2rem] bg-white/80 object-contain object-center shadow-sm"
                  />
                ) : (
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-[1.2rem]"
                    style={{ backgroundColor: colors.primary, color: primaryText }}
                  >
                    <Home className="h-9 w-9" />
                  </div>
                )}
                <div className="min-w-0">
                  <div
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: mutedText }}
                  >
                    Realtor
                  </div>
                  <div className="text-xl font-black">{realtorName || "Listing Contact"}</div>
                  <div className="text-sm font-semibold" style={{ color: mutedText }}>
                    {realtorTitle || agency || "Real Estate Professional"}
                  </div>
                </div>
              </div>
              {agency ? <DetailRow label="Agency" value={agency} className="mt-5" /> : null}
              {realtorLicense ? (
                <DetailRow
                  label="License"
                  value={realtorLicense}
                  className="mt-3"
                />
              ) : null}
              {realtorPhone ? (
                <DetailRow label="Phone" value={realtorPhone} className="mt-3" />
              ) : null}
              {realtorEmail ? (
                <DetailRow label="Email" value={realtorEmail} className="mt-3" />
              ) : null}
            </section>

            <ActionButton
              icon={<MapPin className="h-5 w-5" />}
              label="Get Directions"
              backgroundColor={colors.primary}
              textColor={primaryText}
              disabled={!directionsHref || previewMode}
              onClick={() => {
                if (!directionsHref || previewMode) return;
                window.open(directionsHref, "_blank", "noopener,noreferrer");
              }}
            />
            <ActionButton
              icon={<CalendarPlus className="h-5 w-5" />}
              label="Add to Calendar"
              backgroundColor={colors.secondary}
              textColor={secondaryText}
              disabled={!calendarLinks || previewMode}
              onClick={() => setShowCalendarMenu(true)}
            />
            {contactHref ? (
              <ActionLink
                icon={
                  listingUrl || websiteUrl || rsvpUrl ? (
                    <ExternalLink className="h-5 w-5" />
                  ) : (
                    <Phone className="h-5 w-5" />
                  )
                }
                label={listingUrl || websiteUrl || rsvpUrl ? "View Listing" : "Contact Realtor"}
                href={contactHref}
                backgroundColor={colors.accent}
                textColor={accentText}
                disabled={previewMode}
              />
            ) : null}
            {detailCopy ? (
              <section
                className="rounded-[1.5rem] border border-black/5 p-5 text-sm font-semibold shadow-sm"
                style={{ backgroundColor: surface, color: surfaceText }}
              >
                {detailCopy}
              </section>
            ) : null}
          </aside>
        </section>

        <div className={EVENT_SKIN_FOOTER_CLASS}>
          <div
            className={EVENT_SKIN_FOOTER_DIVIDER_CLASS}
            style={{ backgroundColor: footerDivider }}
          />
          <div className={EVENT_SKIN_FOOTER_TEXT_CLASS} style={{ color: footerText }}>
            Snapped by <span style={{ color: footerBrandText }}>Envitefy</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCalendarMenu && calendarLinks ? (
          <ModalShell onClose={() => setShowCalendarMenu(false)}>
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ backgroundColor: colors.primary, color: primaryText }}
            >
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="serif mb-6 text-2xl font-bold">Add it to your calendar</h3>
            <div className="space-y-3">
              <CalendarLink
                href={calendarLinks.google}
                label="Google"
                tone={colors.primary}
                onChoose={() => setShowCalendarMenu(false)}
              />
              <CalendarLink
                href={calendarLinks.outlook}
                label="Outlook"
                tone={colors.secondary}
                onChoose={() => setShowCalendarMenu(false)}
              />
              <button
                type="button"
                onClick={() => {
                  setShowCalendarMenu(false);
                  if (!previewMode)
                    window.open(calendarLinks.appleInline, "_blank", "noopener,noreferrer");
                }}
                className="block w-full rounded-[1.1rem] py-4 text-xs font-bold uppercase tracking-widest transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: colors.accent, color: accentText }}
              >
                Apple
              </button>
            </div>
          </ModalShell>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {lightboxImage ? (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center px-4 py-6">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close property photo"
              onClick={() => setLightboxImage(null)}
              className="absolute inset-0 bg-[rgba(18,15,12,0.78)] backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="relative max-h-full w-full max-w-6xl"
            >
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute right-3 top-3 z-10 rounded-full border border-white/20 bg-black/35 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-white"
              >
                Close
              </button>
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/10 shadow-[0_32px_120px_rgba(0,0,0,0.45)]">
                <img
                  src={lightboxImage}
                  alt="Open house property full screen"
                  className="max-h-[85vh] w-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function InfoPill({
  icon,
  label,
  value,
  wide = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={`rounded-[1.4rem] bg-white/85 p-4 shadow-sm ${wide ? "sm:col-span-2" : ""}`}>
      <div className="flex items-center gap-3">
        <span className="text-[var(--theme-primary)]">{icon}</span>
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-black/35">
            {label}
          </div>
          <div className="break-words text-sm font-black text-black/85">{value}</div>
        </div>
      </div>
    </div>
  );
}

function SpecCard({
  icon,
  label,
  value,
  surface,
  textColor,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  surface: string;
  textColor: string;
}) {
  return (
    <div
      className="rounded-[1.5rem] border border-black/5 p-5 shadow-sm"
      style={{ backgroundColor: surface, color: textColor }}
    >
      <div className="mb-3 text-[var(--theme-primary)]">{icon}</div>
      <div className="text-[10px] font-black uppercase tracking-widest opacity-45">{label}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[10px] font-black uppercase tracking-widest opacity-45">{label}</div>
      <div className="mt-1 break-words text-sm font-bold">{value}</div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  backgroundColor,
  textColor,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  backgroundColor: string;
  textColor: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-14 items-center justify-center gap-3 rounded-[1.4rem] px-5 py-4 text-xs font-black uppercase tracking-widest shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
      style={{ backgroundColor, color: textColor }}
    >
      {icon}
      {label}
    </button>
  );
}

function ActionLink({
  icon,
  label,
  href,
  backgroundColor,
  textColor,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  href: string;
  backgroundColor: string;
  textColor: string;
  disabled?: boolean;
}) {
  if (isRsvpMailtoHref(href)) {
    return (
      <ActionButton
        icon={<MessageSquare className="h-5 w-5" />}
        label={label}
        backgroundColor={backgroundColor}
        textColor={textColor}
        disabled={disabled}
        onClick={() => openRsvpMailtoHref(href)}
      />
    );
  }
  return (
    <a
      href={disabled ? undefined : href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="inline-flex min-h-14 items-center justify-center gap-3 rounded-[1.4rem] px-5 py-4 text-xs font-black uppercase tracking-widest shadow-lg transition hover:scale-[1.02]"
      style={{ backgroundColor, color: textColor, opacity: disabled ? 0.6 : 1 }}
    >
      {icon}
      {label}
    </a>
  );
}

function ModalShell({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[7100] flex items-center justify-center p-6">
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.94, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 40, opacity: 0 }}
        className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 text-center text-black shadow-2xl"
      >
        {children}
      </motion.div>
    </div>
  );
}

function CalendarLink({
  href,
  label,
  tone,
  onChoose,
}: {
  href: string;
  label: string;
  tone: string;
  onChoose: () => void;
}) {
  const textColor = ensureReadableTextColor(tone, "#ffffff", { minContrast: 3 });
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={onChoose}
      className="block w-full rounded-[1.1rem] py-4 text-center text-xs font-bold uppercase tracking-widest transition-transform hover:scale-[1.02]"
      style={{ backgroundColor: tone, color: textColor }}
    >
      {label}
    </a>
  );
}
