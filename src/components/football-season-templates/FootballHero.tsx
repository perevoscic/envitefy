import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { getFootballDesign, resolveFootballHero } from "./footballDesigns";
import { getGymMeetTitleTypography } from "./titleTypography";
import type { GymMeetTemplateId } from "./types";
import FootballText from "./FootballPageText";

type Props = {
  templateId?: string | null;
  title: string;
  subtitle?: string;
  details?: string[];
  heroSrc?: string | null;
  headingClassName?: string;
  headingStyle?: CSSProperties;
  metadata?: ReactNode;
  actions?: ReactNode;
  artworkAction?: ReactNode;
};

/** The editor and published event share the same art direction and crop. */
export default function FootballHero({
  templateId,
  title,
  subtitle,
  details = [],
  heroSrc,
  headingClassName,
  headingStyle,
  metadata,
  actions,
  artworkAction,
}: Props) {
  const design = getFootballDesign(templateId);
  const typography = getGymMeetTitleTypography(templateId as GymMeetTemplateId);
  const src = resolveFootballHero(templateId, heroSrc);
  const cinematic = design.layout === "cinematic";
  const poster = design.layout === "poster";
  const editorial = design.layout === "editorial";
  const customImage = src !== design.hero;
  const copy = (
    <div
      className={`relative z-10 min-w-0 space-y-5 p-6 sm:p-10 lg:p-12 ${cinematic ? "mt-60 max-w-3xl sm:mt-80" : poster ? "text-center" : ""}`}
    >
      {subtitle ? (
        <p className="text-xs font-semibold uppercase tracking-[0.22em]">
          <FootballText textKey="subtitle" fallback={subtitle} label="Hero caption" />
        </p>
      ) : null}
      <h1
        className={`break-words font-bold leading-[1.02] tracking-tight ${headingClassName || "text-4xl sm:text-5xl lg:text-6xl"}`}
        style={{
          ...typography.fontStyle,
          ...headingStyle,
          color: cinematic ? "#ffffff" : design.ink,
        }}
      >
        <FootballText textKey="eventTitle" fallback={title} />
      </h1>
      {metadata}
      {details.filter(Boolean).length ? (
        <div
          className={`flex flex-wrap gap-x-6 gap-y-2 text-sm leading-relaxed ${poster ? "justify-center" : ""}`}
        >
          {details.filter(Boolean).map((detail) => (
            <p key={detail}>{detail}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
  const artwork = (
    <div
      className={
        cinematic
          ? "absolute inset-0"
          : `relative min-w-0 overflow-hidden ${poster ? "aspect-[3/2] border-y border-current/25" : editorial ? "aspect-[3/2] sm:aspect-[2/1]" : "aspect-[4/3] lg:aspect-auto lg:min-h-96"}`
      }
    >
      <Image
        src={src}
        alt={customImage ? "Team event artwork" : design.alt}
        fill
        priority
        sizes="(max-width: 1023px) 100vw, 1100px"
        unoptimized={customImage}
        className="object-cover"
        style={{
          objectPosition:
            !customImage &&
            ["elite-athlete", "noir-silhouette", "toxic-kinetic", "womens-gridiron"].includes(
              templateId || "",
            )
              ? "center top"
              : "center",
        }}
      />
      {cinematic ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/10" />
      ) : null}
    </div>
  );
  return (
    <header
      className={`relative isolate overflow-hidden ${design.headerClass}`}
      style={{ color: cinematic ? "#ffffff" : design.ink }}
      data-football-hero-layout={design.layout}
    >
      {actions || artworkAction ? (
        <div
          className={`pointer-events-none absolute inset-x-4 top-4 z-30 flex flex-wrap-reverse items-start justify-between gap-3 sm:inset-x-6 sm:top-6 ${design.layout === "split" ? "lg:right-auto lg:w-[calc(50%_-_3rem)]" : ""}`}
        >
          {artworkAction ? (
            <div className="pointer-events-auto min-w-0 max-w-full">{artworkAction}</div>
          ) : null}
          {actions ? (
            <div className="pointer-events-auto ml-auto min-w-0 max-w-full">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {cinematic ? (
        <>
          {artwork}
          {copy}
        </>
      ) : poster || editorial ? (
        <>
          {artwork}
          {copy}
        </>
      ) : (
        <div className="grid lg:grid-cols-2">
          {artwork}
          {copy}
        </div>
      )}
    </header>
  );
}
