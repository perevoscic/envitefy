import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  CakeSlice,
  MapPin,
  PartyPopper,
  Ticket,
} from "lucide-react";
import type { BirthdayExperienceProfile } from "@/data/birthday-experience-profiles.mjs";

export type BirthdayExperienceTheme = {
  id: string;
  name: string;
  defaultHeadline?: string;
  colors: {
    primary: string;
    secondary: string;
  };
  fonts: {
    headline: string;
    body?: string;
  };
  heroImage?: string;
  decorations?: {
    heroImage?: string;
    graphicType?: string;
  };
  experience: BirthdayExperienceProfile;
};

export type BirthdayExperienceEvent = {
  headlineTitle?: string;
  date?: string;
  location?: string;
  birthdayName?: string;
  age?: number | string;
  story?: string;
  rsvpEnabled?: boolean;
};

type BirthdayExperienceHeroProps = {
  theme: BirthdayExperienceTheme;
  event: BirthdayExperienceEvent;
  actions?: ReactNode;
  onRsvpClick?: () => void;
  preview?: boolean;
};

const MEDIA_FRAME_CLASSES: Record<string, string> = {
  "full-bleed": "rounded-none",
  arched: "rounded-t-[999px] rounded-b-[2rem]",
  circle: "aspect-square rounded-full",
  polaroid: "rotate-[-2deg] rounded-sm border-[14px] border-white border-b-[44px]",
  diagonal: "[clip-path:polygon(12%_0,100%_0,88%_100%,0_100%)]",
  "postage-stamp":
    "border-[10px] border-white [clip-path:polygon(0_8%,4%_8%,4%_0,8%_0,8%_8%,12%_8%,12%_0,16%_0,16%_8%,20%_8%,20%_0,24%_0,24%_8%,28%_8%,28%_0,32%_0,32%_8%,36%_8%,36%_0,40%_0,40%_8%,44%_8%,44%_0,48%_0,48%_8%,52%_8%,52%_0,56%_0,56%_8%,60%_8%,60%_0,64%_0,64%_8%,68%_8%,68%_0,72%_0,72%_8%,76%_8%,76%_0,80%_0,80%_8%,84%_8%,84%_0,88%_0,88%_8%,92%_8%,92%_0,96%_0,96%_8%,100%_8%,100%_92%,96%_92%,96%_100%,92%_100%,92%_92%,88%_92%,88%_100%,84%_100%,84%_92%,80%_92%,80%_100%,76%_100%,76%_92%,72%_92%,72%_100%,68%_100%,68%_92%,64%_92%,64%_100%,60%_100%,60%_92%,56%_92%,56%_100%,52%_100%,52%_92%,48%_92%,48%_100%,44%_100%,44%_92%,40%_92%,40%_100%,36%_100%,36%_92%,32%_92%,32%_100%,28%_100%,28%_92%,24%_92%,24%_100%,20%_100%,20%_92%,16%_92%,16%_100%,12%_100%,12%_92%,8%_92%,8%_100%,4%_100%,4%_92%,0_92%)]",
  filmstrip: "rounded-sm border-y-[18px] border-black ring-4 ring-white/35",
  "picture-window": "rounded-[3rem] border-[12px] border-white/80 shadow-inner",
  diamond: "mx-auto aspect-square max-w-[70%] rotate-45 rounded-[2rem] [&>img]:-rotate-45 [&>img]:scale-[1.45]",
  "soft-square": "rounded-[4rem_1.5rem_4rem_1.5rem]",
  "ticket-cut":
    "[clip-path:polygon(0_0,100%_0,100%_42%,96%_50%,100%_58%,100%_100%,0_100%,0_58%,4%_50%,0_42%)]",
  panorama: "aspect-[16/7] rounded-[999px]",
  "portrait-card": "mx-auto aspect-[4/5] max-w-[78%] rounded-[1.5rem] border-8 border-white/70",
};

const MOTION_CLASSES: Record<string, string> = {
  float: "motion-safe:transition-transform motion-safe:duration-700 hover:-translate-y-2",
  reveal: "motion-safe:transition-[filter,transform] motion-safe:duration-700 hover:scale-[1.02] hover:saturate-125",
  tilt: "motion-safe:transition-transform motion-safe:duration-500 hover:rotate-1 hover:scale-[1.015]",
  zoom: "[&>img]:motion-safe:transition-transform [&>img]:motion-safe:duration-700 hover:[&>img]:scale-105",
  pan: "[&>img]:motion-safe:transition-transform [&>img]:motion-safe:duration-1000 hover:[&>img]:translate-x-2",
  glow: "motion-safe:transition-shadow motion-safe:duration-500 hover:shadow-[0_0_70px_var(--birthday-accent-soft)]",
  still: "",
};

const CTA_CLASSES: Record<string, string> = {
  pill: "rounded-full",
  ticket: "rounded-md border-dashed",
  stamp: "rotate-[-1deg] rounded-sm border-2 uppercase tracking-[0.16em]",
  block: "rounded-none uppercase tracking-[0.14em]",
  underline: "rounded-none border-x-0 border-t-0 border-b-2 bg-transparent px-1 shadow-none",
  outline: "rounded-full border-2 bg-transparent",
};

function formatHeroDate(value?: string) {
  if (!value) return "Date to be announced";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function ExperienceTitle({
  profile,
  title,
  age,
  color,
  fontFamily,
}: {
  profile: BirthdayExperienceProfile;
  title: string;
  age?: number | string;
  color: string;
  fontFamily: string;
}) {
  const sharedStyle = { color, fontFamily };

  switch (profile.titleTreatment) {
    case "outlined-poster":
      return (
        <h1
          className="text-balance text-5xl font-black uppercase leading-[0.88] tracking-[-0.055em] sm:text-7xl lg:text-8xl"
          style={{
            ...sharedStyle,
            color: "transparent",
            WebkitTextStroke: `2px ${color}`,
          }}
        >
          {title}
        </h1>
      );
    case "script-signoff":
      return (
        <h1
          className="text-balance text-5xl font-normal italic leading-[0.92] tracking-[-0.045em] sm:text-7xl lg:text-8xl"
          style={sharedStyle}
        >
          {title}
        </h1>
      );
    case "number-led":
      return (
        <div className="flex items-end gap-4 sm:gap-6">
          {age ? (
            <span
              className="text-7xl font-black leading-[0.72] tracking-[-0.08em] sm:text-9xl"
              style={sharedStyle}
            >
              {age}
            </span>
          ) : null}
          <h1
            className="max-w-3xl text-balance text-4xl font-bold leading-[0.94] tracking-[-0.045em] sm:text-6xl lg:text-7xl"
            style={sharedStyle}
          >
            {title}
          </h1>
        </div>
      );
    case "vertical-label":
      return (
        <h1
          className="text-balance text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-7xl lg:max-h-[560px] lg:[writing-mode:vertical-rl]"
          style={sharedStyle}
        >
          {title}
        </h1>
      );
    case "editorial-rule":
      return (
        <div className="border-y py-5" style={{ borderColor: `${color}55` }}>
          <h1
            className="text-balance text-5xl font-medium leading-[0.92] tracking-[-0.05em] sm:text-7xl lg:text-8xl"
            style={sharedStyle}
          >
            {title}
          </h1>
        </div>
      );
    case "badge-lockup":
      return (
        <div
          className="inline-flex max-w-4xl rounded-[999px] border-[3px] px-8 py-7 text-center sm:px-12"
          style={{ borderColor: color }}
        >
          <h1
            className="text-balance text-4xl font-black uppercase leading-[0.94] tracking-[-0.035em] sm:text-6xl"
            style={sharedStyle}
          >
            {title}
          </h1>
        </div>
      );
    case "floating-caption":
      return (
        <div className="inline-block -rotate-1 bg-white/92 px-7 py-5 text-left shadow-2xl backdrop-blur-sm sm:px-10">
          <h1
            className="text-balance text-4xl font-bold leading-[0.94] tracking-[-0.045em] sm:text-6xl"
            style={{ ...sharedStyle, color: "var(--birthday-secondary)" }}
          >
            {title}
          </h1>
        </div>
      );
    default:
      return (
        <h1
          className="text-balance text-5xl font-black leading-[0.88] tracking-[-0.06em] sm:text-7xl lg:text-8xl"
          style={sharedStyle}
        >
          {title}
        </h1>
      );
  }
}

function ExperienceFacts({
  event,
  inverse = false,
}: {
  event: BirthdayExperienceEvent;
  inverse?: boolean;
}) {
  const colorClass = inverse ? "text-white/88" : "text-[var(--birthday-ink)]/80";
  return (
    <div className={`flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold ${colorClass}`}>
      <span className="inline-flex items-center gap-2">
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
        {formatHeroDate(event.date)}
      </span>
      <span className="inline-flex items-center gap-2">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        {event.location || "Location to be announced"}
      </span>
    </div>
  );
}

function ExperienceCta({
  profile,
  enabled,
  onClick,
  inverse = false,
}: {
  profile: BirthdayExperienceProfile;
  enabled?: boolean;
  onClick?: () => void;
  inverse?: boolean;
}) {
  if (!enabled || !onClick) return null;
  const isTransparent = profile.ctaTreatment === "underline" || profile.ctaTreatment === "outline";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-12 items-center gap-2 border border-current px-6 py-3 text-sm font-black shadow-lg transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70 ${CTA_CLASSES[profile.ctaTreatment] || CTA_CLASSES.pill}`}
      style={{
        backgroundColor: isTransparent ? "transparent" : "var(--birthday-secondary)",
        color: inverse || isTransparent ? "currentColor" : "var(--birthday-on-secondary)",
      }}
    >
      RSVP to celebrate
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function HeroCopy({
  theme,
  event,
  inverse = false,
  onRsvpClick,
}: {
  theme: BirthdayExperienceTheme;
  event: BirthdayExperienceEvent;
  inverse?: boolean;
  onRsvpClick?: () => void;
}) {
  const title = event.headlineTitle || theme.defaultHeadline || theme.name;
  const titleColor = inverse ? "#FFFFFF" : "var(--birthday-ink)";
  return (
    <div className={`relative z-10 space-y-6 ${inverse ? "text-white" : "text-[var(--birthday-ink)]"}`}>
      <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] opacity-70">
        <PartyPopper className="h-4 w-4" aria-hidden="true" />
        {theme.experience.eyebrow} · {theme.experience.ornament.replaceAll("-", " ")}
      </div>
      <ExperienceTitle
        profile={theme.experience}
        title={title}
        age={event.age}
        color={titleColor}
        fontFamily={theme.fonts.headline}
      />
      {event.story ? (
        <p className={`max-w-2xl text-base leading-7 sm:text-lg ${inverse ? "text-white/78" : "opacity-72"}`}>
          {event.story}
        </p>
      ) : null}
      <ExperienceFacts event={event} inverse={inverse} />
      <ExperienceCta
        profile={theme.experience}
        enabled={event.rsvpEnabled}
        onClick={onRsvpClick}
        inverse={inverse}
      />
    </div>
  );
}

function HeroMedia({ theme, className = "" }: { theme: BirthdayExperienceTheme; className?: string }) {
  const heroImage = theme.decorations?.heroImage || theme.heroImage;
  const profile = theme.experience;
  return (
    <div
      className={`relative min-h-[320px] overflow-hidden bg-[var(--birthday-accent-soft)] shadow-[0_28px_80px_rgba(26,20,17,0.22)] ${MEDIA_FRAME_CLASSES[profile.mediaFrame] || MEDIA_FRAME_CLASSES["soft-square"]} ${MOTION_CLASSES[profile.motion] || ""} ${className}`}
    >
      {heroImage ? (
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: profile.imagePosition }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/10" />
      <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
        <CakeSlice className="h-3.5 w-3.5" aria-hidden="true" />
        {profile.compositionLabel}
      </div>
    </div>
  );
}

export default function BirthdayExperienceHero({
  theme,
  event,
  actions,
  onRsvpClick,
  preview = false,
}: BirthdayExperienceHeroProps) {
  const profile = theme.experience;
  const isDark = profile.tone === "dark";
  const style = {
    "--birthday-primary": theme.colors.primary,
    "--birthday-secondary": theme.colors.secondary,
    "--birthday-ink": isDark ? "#F8FAFC" : "#211B18",
    "--birthday-on-secondary": isDark ? "#101214" : "#FFFFFF",
    "--birthday-accent-soft": `color-mix(in srgb, ${theme.colors.secondary} ${profile.accentMix}%, ${theme.colors.primary})`,
    backgroundColor: theme.colors.primary,
    fontFamily: theme.fonts.body || "Inter, sans-serif",
  } as CSSProperties;
  const shared = `relative isolate w-full overflow-hidden ${preview ? "min-h-[800px]" : "min-h-[620px]"}`;
  const copyPadding = preview ? "p-12" : "px-6 py-16 sm:px-10 lg:px-16 lg:py-24";
  const actionNode = actions ? <div className="absolute right-4 top-4 z-40">{actions}</div> : null;

  switch (profile.composition) {
    case "poster-stage":
      return (
        <section className={`${shared} flex items-end ${copyPadding}`} style={style}>
          {actionNode}
          <div className="absolute inset-0"><HeroMedia theme={theme} className="h-full rounded-none shadow-none" /></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/28 to-black/8" />
          <div className="relative w-full max-w-6xl"><HeroCopy theme={theme} event={event} inverse onRsvpClick={onRsvpClick} /></div>
        </section>
      );
    case "arch-invitation":
      return (
        <section className={`${shared} ${copyPadding}`} style={style}>
          {actionNode}
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <HeroCopy theme={theme} event={event} onRsvpClick={onRsvpClick} />
            <HeroMedia theme={theme} className="min-h-[520px] rounded-t-[999px]" />
          </div>
        </section>
      );
    case "scrapbook-collage":
      return (
        <section className={`${shared} ${copyPadding}`} style={style}>
          {actionNode}
          <div className="absolute -left-16 top-12 h-44 w-44 rotate-12 rounded-[2rem] border-[18px] border-white/45" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div className="relative pb-12 pr-8">
              <HeroMedia theme={theme} className="min-h-[500px] rotate-[-2deg]" />
              <div className="absolute -bottom-2 right-0 w-2/5 rotate-3 border-[10px] border-white bg-white p-2 shadow-2xl">
                <div className="aspect-square bg-[var(--birthday-secondary)]/20" />
              </div>
            </div>
            <HeroCopy theme={theme} event={event} onRsvpClick={onRsvpClick} />
          </div>
        </section>
      );
    case "ticket-marquee":
      return (
        <section className={`${shared} ${copyPadding}`} style={{ ...style, backgroundColor: isDark ? theme.colors.primary : theme.colors.secondary }}>
          {actionNode}
          <div className="mx-auto max-w-6xl border-y-4 border-dashed border-white/35 py-12">
            <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
              <HeroCopy theme={theme} event={event} inverse onRsvpClick={onRsvpClick} />
              <HeroMedia theme={theme} className="min-h-[460px]" />
            </div>
          </div>
        </section>
      );
    case "storybook-window":
      return (
        <section className={`${shared} ${copyPadding}`} style={style}>
          {actionNode}
          <div className="mx-auto max-w-6xl rounded-[3rem] border border-[var(--birthday-secondary)]/30 bg-white/72 p-6 shadow-[0_30px_90px_rgba(49,36,29,0.14)] backdrop-blur-sm sm:p-10">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <HeroMedia theme={theme} className="min-h-[500px] rounded-[999px_999px_2rem_2rem]" />
              <HeroCopy theme={theme} event={event} onRsvpClick={onRsvpClick} />
            </div>
          </div>
        </section>
      );
    case "scoreboard-rush":
      return (
        <section className={`${shared} ${copyPadding}`} style={{ ...style, backgroundColor: "var(--birthday-primary)" }}>
          {actionNode}
          <div className="absolute inset-0 opacity-20 [background-image:repeating-linear-gradient(90deg,transparent_0,transparent_78px,currentColor_79px,currentColor_80px)]" />
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border-l-[10px] border-[var(--birthday-secondary)] pl-8"><HeroCopy theme={theme} event={event} onRsvpClick={onRsvpClick} /></div>
            <HeroMedia theme={theme} className="min-h-[440px] -skew-y-2" />
          </div>
        </section>
      );
    case "gallery-minimal":
      return (
        <section className={`${shared} ${copyPadding}`} style={style}>
          {actionNode}
          <div className="mx-auto grid max-w-7xl items-end gap-12 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="pb-8"><HeroCopy theme={theme} event={event} onRsvpClick={onRsvpClick} /></div>
            <HeroMedia theme={theme} className="min-h-[560px] rounded-none shadow-none ring-1 ring-black/12" />
          </div>
        </section>
      );
    case "postcard-panorama":
      return (
        <section className={`${shared} ${copyPadding}`} style={style}>
          {actionNode}
          <div className="mx-auto max-w-6xl border-[12px] border-white bg-white/80 p-3 shadow-[0_26px_80px_rgba(42,31,25,0.16)]">
            <HeroMedia theme={theme} className="min-h-[360px] rounded-none shadow-none" />
            <div className="grid gap-8 px-5 py-8 lg:grid-cols-[1.3fr_0.7fr] lg:px-10">
              <HeroCopy theme={theme} event={event} onRsvpClick={onRsvpClick} />
              <div className="flex items-start justify-end"><div className="grid h-28 w-24 place-items-center border-2 border-dashed border-[var(--birthday-secondary)] text-center text-[10px] font-black uppercase tracking-widest text-[var(--birthday-secondary)]">Save the date</div></div>
            </div>
          </div>
        </section>
      );
    case "bento-party":
      return (
        <section className={`${shared} ${copyPadding}`} style={style}>
          {actionNode}
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-12">
            <div className="rounded-[2.5rem] bg-white/78 p-8 shadow-xl backdrop-blur sm:p-12 lg:col-span-7"><HeroCopy theme={theme} event={event} onRsvpClick={onRsvpClick} /></div>
            <HeroMedia theme={theme} className="min-h-[420px] lg:col-span-5" />
            <div className="flex min-h-28 items-center justify-between rounded-[2rem] bg-[var(--birthday-secondary)] px-8 text-white lg:col-span-5"><Ticket className="h-8 w-8" aria-hidden="true" /><span className="text-right text-sm font-black uppercase tracking-[0.2em]">One remarkable celebration</span></div>
            <div className="min-h-28 rounded-[2rem] border-2 border-[var(--birthday-secondary)]/35 bg-white/45 lg:col-span-7" />
          </div>
        </section>
      );
    case "portal-glow":
      return (
        <section className={`${shared} ${copyPadding} text-white`} style={{ ...style, backgroundColor: isDark ? theme.colors.primary : "#171129" }}>
          {actionNode}
          <div className="absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--birthday-secondary)]/30 blur-[90px]" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <HeroMedia theme={theme} className="min-h-[520px] rounded-full ring-[18px] ring-white/10" />
            <HeroCopy theme={theme} event={event} inverse onRsvpClick={onRsvpClick} />
          </div>
        </section>
      );
    case "menu-board":
      return (
        <section className={`${shared} ${copyPadding}`} style={style}>
          {actionNode}
          <div className="mx-auto grid max-w-6xl overflow-hidden border-4 border-[var(--birthday-secondary)] bg-white/82 shadow-2xl lg:grid-cols-2">
            <HeroMedia theme={theme} className="min-h-[560px] rounded-none shadow-none" />
            <div className="flex flex-col justify-center border-l-4 border-double border-[var(--birthday-secondary)] p-8 sm:p-12"><HeroCopy theme={theme} event={event} onRsvpClick={onRsvpClick} /></div>
          </div>
        </section>
      );
    case "keepsake-letter":
      return (
        <section className={`${shared} ${copyPadding}`} style={style}>
          {actionNode}
          <div className="mx-auto max-w-5xl rotate-[-0.5deg] border border-black/10 bg-[#fffdf7] px-7 py-12 shadow-[0_30px_90px_rgba(49,36,29,0.18)] sm:px-14">
            <div className="mb-10 flex items-center justify-between border-b border-black/15 pb-5 text-[10px] font-black uppercase tracking-[0.22em] text-black/50"><span>A celebration to remember</span><span>{theme.experience.ornament.replaceAll("-", " ")}</span></div>
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
              <HeroCopy theme={theme} event={event} onRsvpClick={onRsvpClick} />
              <HeroMedia theme={theme} className="min-h-[460px]" />
            </div>
          </div>
        </section>
      );
    case "magazine-cover":
      return (
        <section className={`${shared} ${copyPadding}`} style={style}>
          {actionNode}
          <div className="relative mx-auto min-h-[620px] max-w-5xl overflow-hidden bg-black shadow-[0_35px_100px_rgba(30,20,18,0.28)]">
            <HeroMedia theme={theme} className="absolute inset-0 h-full rounded-none shadow-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/30 to-transparent" />
            <div className="relative flex min-h-[620px] max-w-[70%] items-end p-9 sm:p-14"><HeroCopy theme={theme} event={event} inverse onRsvpClick={onRsvpClick} /></div>
            <div className="absolute right-6 top-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-white"><span className="block text-3xl tracking-[-0.06em]">ENVITEFY</span>Celebration issue</div>
          </div>
        </section>
      );
    default:
      return (
        <section className={`${shared} ${copyPadding}`} style={style}>
          {actionNode}
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <HeroCopy theme={theme} event={event} onRsvpClick={onRsvpClick} />
            <HeroMedia theme={theme} className="min-h-[520px]" />
          </div>
        </section>
      );
  }
}
