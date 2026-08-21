import type { CSSProperties, ReactNode } from "react";
import { Footer, pickTextColor, type EventData, type ThemeConfig } from "./content-sections";

export type SignatureWeddingLayoutId =
  | "split-hero"
  | "floral-frame"
  | "two-column"
  | "crest-header"
  | "botanical-borders"
  | "soft-pastel-hero"
  | "arched-hero"
  | "parchment-hero"
  | "full-width-luxury"
  | "starry-hero"
  | "centered-minimal-hero"
  | "split-texture-banner"
  | "crest-centered-ribbon"
  | "deep-overlay-hero"
  | "cascading-floral-top"
  | "airy-horizontal-hero"
  | "marble-slab-hero"
  | "botanical-arch-border"
  | "silver-gradient-hero"
  | "warm-leaf-header";

type Props = {
  layout: SignatureWeddingLayoutId;
  theme: ThemeConfig;
  event: EventData;
};

type ScheduleMode =
  | "timeline"
  | "tiles"
  | "rail"
  | "ledger"
  | "chapters"
  | "orbit"
  | "tickets"
  | "plaques"
  | "petals"
  | "steps";

type SupplementalTone =
  | "dark"
  | "paper"
  | "editorial"
  | "glass"
  | "postcard"
  | "botanical"
  | "minimal";

const sectionLabel = "text-[10px] font-semibold uppercase tracking-[0.32em]";

function titleFor(event: EventData) {
  return event.headlineTitle ||
    [event.couple?.partner1, event.couple?.partner2].filter(Boolean).join(" & ") ||
    "Your Names";
}

function heroFor(theme: ThemeConfig, event: EventData) {
  const customEvent = event as EventData & { customHeroImage?: string };
  return (
    customEvent.customHeroImage ||
    event.gallery?.find((image) => image.url || image.src || image.preview)?.url ||
    event.gallery?.find((image) => image.url || image.src || image.preview)?.src ||
    event.gallery?.find((image) => image.url || image.src || image.preview)?.preview ||
    theme.decorations?.heroImage ||
    ""
  );
}

function Meta({ event, separator = "·" }: { event: EventData; separator?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] uppercase tracking-[0.22em]">
      {event.date && <span>{event.date}</span>}
      {event.date && event.location && <span aria-hidden="true">{separator}</span>}
      {event.location && <span>{event.location}</span>}
    </div>
  );
}

function Story({
  event,
  title = "Our Story",
  className = "",
}: {
  event: EventData;
  title?: string;
  className?: string;
}) {
  if (!event.story) return null;
  return (
    <section className={className}>
      <p className={sectionLabel}>{title}</p>
      <p className="mt-4 text-sm leading-7 opacity-85">{event.story}</p>
    </section>
  );
}

function Schedule({
  event,
  mode,
  accent,
}: {
  event: EventData;
  mode: ScheduleMode;
  accent: string;
}) {
  const items = event.schedule || [];
  if (items.length === 0) return null;

  if (mode === "timeline") {
    return (
      <div className="space-y-0">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="relative grid grid-cols-[76px_1fr] gap-4 pb-7 last:pb-0">
            <p className="text-xs font-semibold tracking-wider">{item.time || item.date || "TBA"}</p>
            <div className="relative border-l pl-6" style={{ borderColor: `${accent}66` }}>
              <span
                className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: accent }}
              />
              <h3 className="font-semibold" style={{ color: "inherit" }}>{item.title}</h3>
              <p className="mt-1 text-xs opacity-65">{item.location}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "rail") {
    return (
      <div className="grid gap-px overflow-hidden border md:grid-cols-3" style={{ borderColor: `${accent}55` }}>
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="min-h-36 p-5" style={{ backgroundColor: `${accent}12` }}>
            <span className="text-3xl font-light opacity-30">0{index + 1}</span>
            <h3 className="mt-5 font-semibold" style={{ color: "inherit" }}>{item.title}</h3>
            <p className="mt-1 text-xs opacity-65">{item.time} / {item.location}</p>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "ledger") {
    return (
      <div className="border-y">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="grid grid-cols-[92px_1fr] gap-5 border-b py-4 last:border-b-0">
            <p className="font-mono text-xs uppercase">{item.time || item.date || "TBA"}</p>
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="font-semibold" style={{ color: "inherit" }}>{item.title}</h3>
              <p className="text-xs opacity-65">{item.location}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "chapters") {
    return (
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="grid grid-cols-[52px_1fr] items-start gap-4">
            <span className="font-serif text-4xl italic opacity-25">{index + 1}</span>
            <div className="border-b pb-4">
              <p className="text-[10px] uppercase tracking-[0.24em] opacity-55">Chapter {index + 1}</p>
              <h3 className="mt-1 font-semibold" style={{ color: "inherit" }}>{item.title}</h3>
              <p className="mt-1 text-xs opacity-65">{item.time} — {item.location}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "orbit") {
    return (
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="relative rounded-full border px-5 py-9 text-center" style={{ borderColor: `${accent}77` }}>
            <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: accent }} />
            <p className="text-[10px] uppercase tracking-[0.22em] opacity-60">{item.time || item.date}</p>
            <h3 className="mt-2 font-semibold" style={{ color: "inherit" }}>{item.title}</h3>
            <p className="mt-2 text-xs opacity-60">{item.location}</p>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "tickets") {
    return (
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="grid grid-cols-[88px_1fr] overflow-hidden rounded-xl border border-dashed">
            <div className="grid place-items-center border-r border-dashed p-4 text-xs font-bold">{item.time || "TBA"}</div>
            <div className="p-4">
              <h3 className="font-semibold" style={{ color: "inherit" }}>{item.title}</h3>
              <p className="mt-1 text-xs opacity-65">Admit two · {item.location}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "plaques") {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="border px-5 py-7 text-center shadow-[inset_0_0_0_4px_rgba(255,255,255,0.15)]">
            <p className="text-[10px] uppercase tracking-[0.28em] opacity-55">{item.time || item.date}</p>
            <h3 className="mt-3 font-serif text-lg" style={{ color: "inherit" }}>{item.title}</h3>
            <p className="mt-2 text-xs opacity-60">{item.location}</p>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "petals") {
    return (
      <div className="flex flex-wrap justify-center gap-4">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="w-full rounded-[42%_58%_48%_52%/55%_42%_58%_45%] border p-7 text-center sm:w-52" style={{ backgroundColor: `${accent}10`, borderColor: `${accent}55` }}>
            <p className="text-[10px] uppercase tracking-[0.24em]">{item.time || item.date}</p>
            <h3 className="mt-3 font-semibold" style={{ color: "inherit" }}>{item.title}</h3>
            <p className="mt-1 text-xs opacity-60">{item.location}</p>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "steps") {
    return (
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="flex items-center gap-4 rounded-sm p-4" style={{ marginLeft: `${index * 18}px`, backgroundColor: `${accent}${index % 2 ? "16" : "0d"}` }}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs">{index + 1}</span>
            <div><h3 className="font-semibold" style={{ color: "inherit" }}>{item.title}</h3><p className="text-xs opacity-60">{item.time} · {item.location}</p></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="rounded-2xl border p-5" style={{ borderColor: `${accent}55`, backgroundColor: `${accent}0d` }}>
          <p className="text-[10px] uppercase tracking-[0.22em] opacity-55">{item.time || item.date}</p>
          <h3 className="mt-3 font-semibold" style={{ color: "inherit" }}>{item.title}</h3>
          <p className="mt-1 text-xs opacity-65">{item.location}</p>
        </div>
      ))}
    </div>
  );
}

function Supplemental({
  theme,
  event,
  tone,
  background,
  foreground,
}: {
  theme: ThemeConfig;
  event: EventData;
  tone: SupplementalTone;
  background: string;
  foreground?: string;
}) {
  const color = foreground || pickTextColor(background);
  const accent = theme.colors.secondary;
  const party = event.party || [];
  const photos = event.photos || [];
  const extras: Array<{ eyebrow: string; title: string; copy: string }> = [];
  if (party.length) extras.push({ eyebrow: "The People", title: "Wedding Party", copy: party.map((person) => `${person.name} · ${person.role}`).join("  /  ") });
  if (event.travel) extras.push({ eyebrow: "Arrive & Stay", title: "Travel", copy: event.travel });
  if (event.thingsToDo) extras.push({ eyebrow: "Make a Weekend", title: "Local Guide", copy: event.thingsToDo });

  const toneClasses: Record<SupplementalTone, string> = {
    dark: "rounded-none border-white/15 bg-black/15",
    paper: "rounded-sm border-black/10 bg-white/35 shadow-[0_20px_60px_rgba(45,35,24,0.08)]",
    editorial: "rounded-none border-current/20 bg-transparent",
    glass: "rounded-[2rem] border-white/25 bg-white/10 backdrop-blur-md",
    postcard: "rounded-lg border-black/15 bg-white/70 shadow-[5px_7px_0_rgba(0,0,0,0.08)]",
    botanical: "rounded-[3rem_3rem_1rem_1rem] border-white/25 bg-white/10",
    minimal: "rounded-none border-black/10 bg-white/20",
  };

  return (
    <section
      id={event.rsvpEnabled ? "rsvp" : undefined}
      className="px-5 py-16 md:px-10"
      style={{ backgroundColor: background, color }}
    >
      <div className="mx-auto max-w-6xl">
        {extras.length > 0 && (
          <div className="grid gap-5 md:grid-cols-3">
            {extras.map((extra, index) => (
              <article key={extra.title} className={`border p-6 ${toneClasses[tone]}`} style={{ transform: tone === "postcard" ? `rotate(${index % 2 ? 1 : -1}deg)` : undefined }}>
                <p className={sectionLabel} style={{ color: accent }}>{extra.eyebrow}</p>
                <h2 className="mt-3 text-xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{extra.title}</h2>
                <p className="mt-3 text-sm leading-6 opacity-70">{extra.copy}</p>
              </article>
            ))}
          </div>
        )}

        {photos.length > 0 && (
          <div className={`mt-12 grid gap-3 ${tone === "editorial" ? "grid-cols-12" : "grid-cols-2 md:grid-cols-4"}`}>
            {photos.slice(0, 4).map((photo, index) => (
              <img
                key={`${photo}-${index}`}
                src={photo}
                alt=""
                className={`h-44 w-full object-cover ${tone === "editorial" ? index % 3 === 0 ? "col-span-7" : "col-span-5" : "rounded-xl"}`}
              />
            ))}
          </div>
        )}

        {(event.registry?.length || event.rsvpEnabled) && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 border-t pt-8" style={{ borderColor: `${color}26` }}>
            {event.registry?.map((registry, index) => (
              <a key={`${registry.url}-${index}`} href={registry.url} className="border px-5 py-3 text-xs uppercase tracking-[0.18em]" style={{ borderColor: `${color}55` }}>
                {registry.label || "Registry"}
              </a>
            ))}
            {event.rsvpEnabled && (
              <a href={event.rsvpLink || event.rsvp?.url || "#rsvp"} className="px-7 py-3 text-xs font-bold uppercase tracking-[0.22em]" style={{ backgroundColor: accent, color: pickTextColor(accent) }}>
                RSVP
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Page({
  theme,
  event,
  children,
  supplementalTone,
  supplementalBackground,
  supplementalForeground,
}: {
  theme: ThemeConfig;
  event: EventData;
  children: ReactNode;
  supplementalTone: SupplementalTone;
  supplementalBackground: string;
  supplementalForeground?: string;
}) {
  return (
    <div className="min-h-screen w-full overflow-hidden" style={{ fontFamily: theme.fonts.body }}>
      {children}
      <Supplemental theme={theme} event={event} tone={supplementalTone} background={supplementalBackground} foreground={supplementalForeground} />
      <Footer theme={theme} event={event} backgroundColor={supplementalBackground} />
    </div>
  );
}

function MidnightElegance({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="dark" supplementalBackground={theme.colors.primary}>
      <header className="grid min-h-[560px] bg-[#090b20] text-white lg:grid-cols-[42%_58%]">
        <div className="relative flex flex-col justify-between border-r border-white/15 px-8 py-10 lg:px-14">
          <p className={sectionLabel} style={{ color: theme.colors.secondary }}>An evening in celebration</p>
          <div className="py-16">
            <p className="mb-5 font-serif text-6xl font-light text-white/20">01</p>
            <h1 className="text-5xl leading-[0.95] md:text-7xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1>
            <div className="mt-8 flex justify-start"><Meta event={event} separator="/" /></div>
          </div>
          <p className="max-w-xs text-xs leading-6 text-white/55">Black tie · Dinner and dancing to follow</p>
        </div>
        <div className="relative min-h-[420px]">
          {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b20]/85 via-transparent to-[#090b20]/10" />
          <div className="absolute bottom-8 left-8 right-8 border-t border-white/35 pt-5 text-xs uppercase tracking-[0.25em]">Private celebration · {event.location || "Venue to be announced"}</div>
        </div>
      </header>
      <main className="grid gap-10 bg-[#11142f] px-7 py-16 text-white md:grid-cols-[0.8fr_1.2fr] md:px-14">
        <Story event={event} title="The Love Note" className="border-t border-white/20 pt-6" />
        <section><p className={sectionLabel} style={{ color: theme.colors.secondary }}>Order of the evening</p><div className="mt-7"><Schedule event={event} mode="timeline" accent={theme.colors.secondary} /></div></section>
      </main>
    </Page>
  );
}

function WildRoseHalo({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  const floralStyle = { "--rose": theme.colors.primary } as CSSProperties;
  return (
    <Page theme={theme} event={event} supplementalTone="paper" supplementalBackground={theme.colors.secondary} supplementalForeground={theme.colors.primary}>
      <div className="relative bg-[#fff9f7] px-5 py-10 text-[#4a2530] md:py-16" style={floralStyle}>
        <span className="absolute left-4 top-4 text-7xl opacity-15">❦</span><span className="absolute right-4 top-4 rotate-90 text-7xl opacity-15">❦</span>
        <header className="relative mx-auto max-w-4xl border border-[#7b3446]/35 bg-white/75 p-5 shadow-[0_25px_80px_rgba(90,42,50,0.13)] md:p-10">
          <div className="grid items-stretch md:grid-cols-[1fr_1.2fr]">
            <div className="flex flex-col items-center justify-center border-[#7b3446]/20 p-8 text-center md:border-r">
              <p className={sectionLabel}>Together with their families</p>
              <div className="my-6 text-3xl text-[#9a5264]">✽</div>
              <h1 className="text-5xl leading-tight" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1>
              <div className="mt-7"><Meta event={event} /></div>
            </div>
            {image && <img src={image} alt="" className="min-h-80 h-full w-full object-cover" />}
          </div>
        </header>
      </div>
      <main className="bg-[#fff9f7] px-6 pb-16 text-[#4a2530]">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_1.3fr]">
          <Story event={event} title="How love bloomed" className="rounded-[50%_50%_8px_8px] border border-[#7b3446]/20 bg-white/60 px-7 pb-8 pt-14 text-center" />
          <section className="pt-8"><p className={sectionLabel}>The celebration</p><div className="mt-6"><Schedule event={event} mode="petals" accent={theme.colors.primary} /></div></section>
        </div>
      </main>
    </Page>
  );
}

function GoldenHourPromise({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="editorial" supplementalBackground="#fff8ec" supplementalForeground="#4d3420">
      <header className="grid min-h-[600px] bg-[#fff8ec] text-[#4d3420] lg:grid-cols-2">
        <div className="relative min-h-[400px] overflow-hidden lg:order-2">
          {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#fff8ec] to-transparent lg:hidden" />
        </div>
        <div className="flex items-center px-8 py-14 md:px-16 lg:order-1">
          <div className="max-w-lg">
            <p className={sectionLabel} style={{ color: theme.colors.primary }}>At golden hour</p>
            <h1 className="mt-7 text-5xl leading-[1.05] md:text-7xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1>
            <div className="my-8 h-px w-24" style={{ backgroundColor: theme.colors.primary }} />
            <div className="flex justify-start"><Meta event={event} separator="—" /></div>
            <p className="mt-9 max-w-sm text-sm italic leading-7 opacity-70">{event.tagline || "A promise made in the warmest light."}</p>
          </div>
        </div>
      </header>
      <main className="grid bg-[#f8ead3] text-[#4d3420] lg:grid-cols-[0.9fr_1.1fr]">
        <Story event={event} title="Before sunset" className="px-8 py-16 md:px-16" />
        <section className="border-l border-[#4d3420]/10 px-8 py-16 md:px-16"><p className={sectionLabel}>A day in three acts</p><div className="mt-7"><Schedule event={event} mode="rail" accent={theme.colors.primary} /></div></section>
      </main>
    </Page>
  );
}

function IvoryLaceCrest({ theme, event }: Omit<Props, "layout">) {
  return (
    <Page theme={theme} event={event} supplementalTone="minimal" supplementalBackground="#f7f4ef" supplementalForeground="#48443e">
      <div className="bg-[#e9e3da] px-4 py-10 text-[#48443e] md:px-8 md:py-16">
        <article className="relative mx-auto max-w-4xl bg-[#faf8f4] px-7 py-14 text-center shadow-[0_18px_60px_rgba(65,56,47,0.14)] md:px-20">
          <div className="absolute inset-4 border border-[#9a9184]/35" />
          <div className="relative">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-double border-[#6a645a] text-2xl">{titleFor(event).split(" ").filter((part) => part !== "&").map((part) => part[0]).slice(0, 2).join("")}</div>
            <p className={`${sectionLabel} mt-8`}>The honour of your presence is requested</p>
            <h1 className="mx-auto mt-7 max-w-2xl text-5xl leading-tight md:text-6xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1>
            <div className="mx-auto my-8 h-px max-w-md bg-[#6a645a]/30" />
            <Meta event={event} />
            <Story event={event} title="Their story" className="mx-auto mt-12 max-w-xl" />
            <section className="mx-auto mt-12 max-w-2xl text-left"><Schedule event={event} mode="ledger" accent={theme.colors.secondary} /></section>
          </div>
        </article>
      </div>
    </Page>
  );
}

function EmeraldGarden({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="botanical" supplementalBackground={theme.colors.primary}>
      <header className="relative min-h-[620px] overflow-hidden bg-[#063f2b] px-6 py-12 text-white">
        {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,#063f2b_75%)]" />
        <div className="relative mx-auto flex min-h-[520px] max-w-4xl flex-col items-center justify-center rounded-[50%_50%_8px_8px] border border-white/30 px-7 text-center shadow-[inset_0_0_80px_rgba(0,0,0,0.25)]">
          <div className="mb-7 text-5xl text-[#ddefe4]">❧</div>
          <p className={sectionLabel}>Within the garden walls</p>
          <h1 className="mt-6 text-5xl md:text-7xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1>
          <div className="mt-8"><Meta event={event} /></div>
        </div>
      </header>
      <main className="bg-[#e9f2e9] px-6 py-16 text-[#17392b]">
        <div className="mx-auto max-w-5xl">
          <Story event={event} title="Rooted in love" className="mx-auto max-w-2xl text-center" />
          <section className="mt-14"><p className={`${sectionLabel} text-center`}>The garden path</p><div className="mt-8"><Schedule event={event} mode="steps" accent={theme.colors.primary} /></div></section>
        </div>
      </main>
    </Page>
  );
}

function BlushLinen({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="paper" supplementalBackground="#f4dcdc" supplementalForeground="#4f4444">
      <header className="relative bg-[#f7e7e5] px-6 py-12 text-[#4f4444] md:py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative z-10 md:pr-8">
            <span className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-[#eec8c8]/60 blur-sm" />
            <p className={`${sectionLabel} relative`}>A soft beginning</p>
            <h1 className="relative mt-6 text-5xl leading-[1.02] md:text-7xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1>
            <div className="relative mt-7 flex justify-start"><Meta event={event} separator="♡" /></div>
          </div>
          <div className="relative mx-auto h-[430px] w-full max-w-sm">
            <div className="absolute -left-5 top-7 h-[360px] w-full rounded-[45%_45%_12px_12px] border border-[#6b6463]/20" />
            {image && <img src={image} alt="" className="relative h-[390px] w-full rounded-[45%_45%_12px_12px] object-cover shadow-xl" />}
            <div className="absolute -bottom-1 -right-5 rounded-full bg-white px-6 py-5 text-center shadow-lg"><p className="text-xs uppercase tracking-widest">Save</p><p className="text-2xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>the date</p></div>
          </div>
        </div>
      </header>
      <main className="bg-[#fff9f7] px-6 py-16 text-[#4f4444]"><div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2"><Story event={event} title="Us, in bloom" className="rounded-3xl bg-[#f7e7e5] p-8" /><section><p className={sectionLabel}>Lovely little plans</p><div className="mt-6"><Schedule event={event} mode="tiles" accent={theme.colors.primary} /></div></section></div></main>
    </Page>
  );
}

function SapphireMoonlit({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="dark" supplementalBackground="#07132f">
      <header className="relative min-h-[660px] overflow-hidden bg-[#07132f] px-5 py-12 text-white">
        <span className="absolute right-[12%] top-14 h-28 w-28 rounded-full bg-[#c1cfff] shadow-[0_0_90px_#c1cfff88]" />
        <span className="absolute left-[8%] top-20 text-white/30">✦</span><span className="absolute right-[30%] top-48 text-white/40">·</span>
        <div className="relative mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1fr_1.1fr]">
          <div className="order-2 text-center md:order-1 md:text-left">
            <p className={sectionLabel} style={{ color: theme.colors.secondary }}>Under the same moon</p>
            <h1 className="mt-6 text-5xl leading-tight md:text-7xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1>
            <div className="mt-8 md:flex md:justify-start"><Meta event={event} /></div>
          </div>
          <div className="order-1 mx-auto h-[440px] w-full max-w-sm overflow-hidden rounded-[50%_50%_8px_8px] border border-white/25 p-2 md:order-2">
            {image && <img src={image} alt="" className="h-full w-full rounded-[50%_50%_5px_5px] object-cover opacity-80" />}
          </div>
        </div>
      </header>
      <main className="bg-[#0b1d47] px-6 py-16 text-[#eef2ff]"><div className="mx-auto max-w-5xl"><Story event={event} title="Written in moonlight" className="mx-auto max-w-xl text-center" /><section className="mt-14"><p className={`${sectionLabel} text-center`} style={{ color: theme.colors.secondary }}>Celestial alignment</p><div className="mt-8"><Schedule event={event} mode="orbit" accent={theme.colors.secondary} /></div></section></div></main>
    </Page>
  );
}

function RusticStorybook({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="paper" supplementalBackground="#e8d4bb" supplementalForeground="#4a3525">
      <header className="bg-[#d7bc98] px-4 py-10 text-[#4a3525] md:px-10">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-r-xl bg-[#f3e4d1] shadow-[0_28px_70px_rgba(65,42,24,0.25)] md:grid-cols-2">
          <div className="relative min-h-[420px] border-r border-[#5b402b]/20 p-10 md:p-14">
            <p className={sectionLabel}>Once upon a forever</p>
            <h1 className="mt-12 text-5xl leading-tight md:text-6xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1>
            <div className="mt-10 flex justify-start"><Meta event={event} separator="~" /></div>
            <p className="absolute bottom-8 left-10 font-serif text-xs italic opacity-60">Volume I · The wedding day</p>
          </div>
          <div className="relative min-h-[420px] p-6"><div className="absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-black/15 to-transparent" />{image && <img src={image} alt="" className="h-full min-h-[372px] w-full object-cover sepia-[.2]" />}</div>
        </div>
      </header>
      <main className="bg-[#f3e4d1] px-6 py-16 text-[#4a3525]"><div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[0.85fr_1.15fr]"><Story event={event} title="Prologue" className="first-letter:float-left first-letter:mr-3 first-letter:text-6xl" /><section><p className={sectionLabel}>Table of moments</p><div className="mt-7"><Schedule event={event} mode="chapters" accent={theme.colors.primary} /></div></section></div></main>
    </Page>
  );
}

function ChampagneVelvet({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="editorial" supplementalBackground="#20170f">
      <header className="relative min-h-[720px] overflow-hidden bg-[#21180f] text-white">
        {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-65" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-[#21180f]" />
        <div className="absolute inset-6 border border-[#d5b578]/55 md:inset-10" />
        <div className="relative flex min-h-[720px] flex-col items-center justify-center px-8 text-center">
          <p className={sectionLabel} style={{ color: theme.colors.secondary }}>Champagne · Candlelight · Forever</p>
          <h1 className="mt-8 max-w-4xl text-6xl leading-[0.9] md:text-8xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1>
          <div className="mt-10"><Meta event={event} separator="✦" /></div>
          <div className="mt-14 h-12 w-px bg-[#d5b578]" />
        </div>
      </header>
      <main className="bg-[#21180f] px-6 py-20 text-[#f4e7d3]"><div className="mx-auto max-w-6xl"><Story event={event} title="A grand romance" className="mx-auto max-w-2xl border-x border-[#d5b578]/25 px-8 text-center" /><section className="mt-16"><p className={`${sectionLabel} text-center`} style={{ color: theme.colors.secondary }}>The soirée</p><div className="mt-8"><Schedule event={event} mode="plaques" accent={theme.colors.secondary} /></div></section></div></main>
    </Page>
  );
}

function CelestialWhisper({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="glass" supplementalBackground="#11162d">
      <header className="relative min-h-[620px] overflow-hidden bg-[#11162d] text-white">
        {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent,#11162d_68%)]" />
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative flex min-h-[620px] flex-col items-center justify-center px-7 text-center">
          <div className="mb-8 text-4xl text-[#dce6ff]">☾</div>
          <p className={sectionLabel}>The universe conspired</p>
          <h1 className="mt-6 max-w-3xl text-5xl md:text-7xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1>
          <div className="mt-8 text-[#dce6ff]"><Meta event={event} separator="✧" /></div>
        </div>
      </header>
      <main className="bg-[#171d39] px-6 py-16 text-[#edf2ff]"><div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[0.8fr_1.2fr]"><Story event={event} title="Our constellation" className="rounded-full border border-white/15 px-8 py-14 text-center" /><section><p className={sectionLabel}>When the stars align</p><div className="mt-7"><Schedule event={event} mode="orbit" accent={theme.colors.secondary} /></div></section></div></main>
    </Page>
  );
}

function PearlTide({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="minimal" supplementalBackground="#eef3fa" supplementalForeground="#29435e">
      <header className="bg-[#eef3fa] px-6 py-12 text-[#29435e] md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-center justify-between border-b border-[#29435e]/15 pb-4"><p className={sectionLabel}>Pearl Tide</p><p className="text-xs">Est. forever</p></div>
          <h1 className="mx-auto max-w-4xl text-center text-5xl font-light leading-tight md:text-7xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1>
          <div className="mt-7"><Meta event={event} separator="—" /></div>
          {image && <img src={image} alt="" className="mt-12 h-[360px] w-full rounded-[50%_50%_0_0/18%_18%_0_0] object-cover" />}
        </div>
      </header>
      <main className="bg-white px-6 py-16 text-[#29435e]"><div className="mx-auto max-w-6xl"><div className="grid gap-10 md:grid-cols-[0.7fr_1.3fr]"><Story event={event} title="From shore to shore" className="max-w-sm" /><section><p className={sectionLabel}>The day, simply</p><div className="mt-7"><Schedule event={event} mode="rail" accent={theme.colors.primary} /></div></section></div></div></main>
    </Page>
  );
}

function CrimsonOrchard({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="editorial" supplementalBackground="#f6e3e6" supplementalForeground="#481621">
      <header className="grid min-h-[560px] bg-[#f6e3e6] text-[#481621] md:grid-cols-[1.2fr_0.8fr]">
        <div className="relative min-h-[430px] overflow-hidden">{image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />}<div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[#5a1f2a]/50 to-transparent" /></div>
        <div className="flex flex-col justify-center bg-[#5a1f2a] px-8 py-14 text-[#f6e3e6] md:px-12">
          <p className={sectionLabel}>Harvested with love</p>
          <h1 className="mt-7 text-5xl leading-tight" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1>
          <div className="my-8 h-px bg-[#f6e3e6]/35" />
          <div className="flex justify-start"><Meta event={event} separator="/" /></div>
        </div>
      </header>
      <main className="bg-[#fff8f7] px-6 py-16 text-[#481621]"><div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2"><section><p className={sectionLabel}>Field notes</p><Story event={event} title="From the orchard" className="mt-8 border-l-4 border-[#5a1f2a] pl-6" /></section><section><p className={sectionLabel}>The harvest table</p><div className="mt-7"><Schedule event={event} mode="ledger" accent={theme.colors.primary} /></div></section></div></main>
    </Page>
  );
}

function OpalineCrest({ theme, event }: Omit<Props, "layout">) {
  const initials = titleFor(event).split(" ").filter((part) => part !== "&").map((part) => part[0]).slice(0, 2).join(" · ");
  return (
    <Page theme={theme} event={event} supplementalTone="paper" supplementalBackground="#ece6de" supplementalForeground="#4d4943">
      <header className="relative bg-[#f5f0ea] px-5 py-16 text-center text-[#4d4943]">
        <div className="mx-auto max-w-4xl border-y border-[#5e5b52]/25 py-14">
          <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border border-[#5e5b52] shadow-[0_0_0_7px_#f5f0ea,0_0_0_8px_#9c978e]">
            <span className="font-serif text-xl">{initials}</span>
          </div>
          <p className={`${sectionLabel} mt-10`}>A new family crest</p>
          <h1 className="mt-5 text-5xl md:text-7xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1>
          <div className="relative mx-auto mt-10 max-w-xl bg-[#5e5b52] px-8 py-4 text-[#f5f0ea] before:absolute before:-left-5 before:top-2 before:border-y-[20px] before:border-r-[20px] before:border-y-transparent before:border-r-[#5e5b52] after:absolute after:-right-5 after:top-2 after:border-y-[20px] after:border-l-[20px] after:border-y-transparent after:border-l-[#5e5b52]"><Meta event={event} separator="·" /></div>
        </div>
      </header>
      <main className="bg-[#ece6de] px-6 py-16 text-[#4d4943]"><div className="mx-auto max-w-4xl"><Story event={event} title="The house of us" className="mx-auto max-w-xl text-center" /><section className="mt-14"><Schedule event={event} mode="plaques" accent={theme.colors.secondary} /></section></div></main>
    </Page>
  );
}

function VelvetMidnight({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="dark" supplementalBackground="#090a1c">
      <header className="relative min-h-[690px] overflow-hidden bg-[#090a1c] text-white">
        {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-[#090a1c]/70" />
        <div className="absolute inset-x-[8%] inset-y-[7%] border border-[#c7a26b]/30" />
        <div className="relative grid min-h-[690px] items-end gap-10 px-[12%] pb-20 md:grid-cols-[1.4fr_0.6fr]">
          <div><p className={sectionLabel} style={{ color: theme.colors.secondary }}>Nocturne No. 01</p><h1 className="mt-6 text-6xl leading-[0.9] md:text-8xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1></div>
          <div className="border-l border-white/20 pl-6"><Meta event={event} separator="/" /><p className="mt-6 text-xs leading-6 text-white/55">{event.tagline || "For one unforgettable night."}</p></div>
        </div>
      </header>
      <main className="grid bg-[#111229] text-white md:grid-cols-2"><Story event={event} title="After dark" className="px-8 py-16 md:px-14" /><section className="border-l border-white/10 px-8 py-16 md:px-14"><p className={sectionLabel} style={{ color: theme.colors.secondary }}>The programme</p><div className="mt-7"><Schedule event={event} mode="timeline" accent={theme.colors.secondary} /></div></section></main>
    </Page>
  );
}

function LavenderCascade({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="glass" supplementalBackground="#d9d3f2" supplementalForeground="#40385a">
      <header className="relative overflow-hidden bg-gradient-to-b from-[#c7bce9] to-[#f7f5ff] px-6 pb-16 pt-24 text-[#40385a]">
        <div className="absolute -top-24 left-[8%] h-80 w-52 rotate-12 rounded-full bg-[#9d8bcc]/30 blur-2xl" /><div className="absolute -top-14 right-[10%] h-72 w-64 -rotate-12 rounded-full bg-white/50 blur-xl" />
        <div className="relative mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <div className="text-center md:text-left"><p className={sectionLabel}>Love, in full cascade</p><h1 className="mt-7 text-5xl leading-tight md:text-7xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1><div className="mt-8 md:flex md:justify-start"><Meta event={event} separator="✿" /></div></div>
          <div className="relative mx-auto h-[420px] w-full max-w-sm"><div className="absolute -left-6 -top-6 h-full w-full rounded-[10rem_10rem_2rem_2rem] border border-white/70" />{image && <img src={image} alt="" className="relative h-full w-full rounded-[10rem_10rem_2rem_2rem] object-cover shadow-2xl" />}<span className="absolute -bottom-6 -right-5 text-7xl text-white">✾</span></div>
        </div>
      </header>
      <main className="bg-[#f7f5ff] px-6 py-16 text-[#40385a]"><div className="mx-auto max-w-5xl"><Story event={event} title="A gentle kind of magic" className="mx-auto max-w-2xl rounded-[3rem] bg-white/70 p-9 text-center shadow-sm" /><section className="mt-14"><Schedule event={event} mode="petals" accent={theme.colors.primary} /></section></div></main>
    </Page>
  );
}

function CoralSands({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="postcard" supplementalBackground="#fff2ea" supplementalForeground="#704334">
      <header className="bg-[#f2b8a2] px-5 py-10 text-[#704334] md:px-10">
        <div className="mx-auto max-w-6xl bg-[#fffaf4] p-4 shadow-[12px_15px_0_rgba(112,67,52,0.14)]">
          <div className="grid min-h-[460px] md:grid-cols-[1.25fr_0.75fr]">
            <div className="relative min-h-[320px]">{image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />}<span className="absolute bottom-4 left-5 bg-[#fffaf4] px-4 py-2 font-serif italic">Wish you were here</span></div>
            <div className="flex flex-col justify-between border-l border-dashed border-[#704334]/30 p-7 md:p-10">
              <div className="self-end border-2 border-[#704334]/45 p-3 text-center text-[9px] uppercase tracking-widest">Save<br />the date</div>
              <div><p className={sectionLabel}>A celebration by the sea</p><h1 className="mt-5 text-4xl leading-tight" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1><div className="mt-7 flex justify-start"><Meta event={event} separator="~" /></div></div>
              <div className="space-y-2 opacity-30"><div className="h-px bg-current" /><div className="h-px bg-current" /><div className="h-px bg-current" /></div>
            </div>
          </div>
        </div>
      </header>
      <main className="bg-[#fff2ea] px-6 py-16 text-[#704334]"><div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[0.8fr_1.2fr]"><Story event={event} title="Our favorite journey" className="-rotate-1 rounded-lg bg-white p-8 shadow-md" /><section><p className={sectionLabel}>Your itinerary</p><div className="mt-7"><Schedule event={event} mode="tickets" accent={theme.colors.primary} /></div></section></div></main>
    </Page>
  );
}

function EternalMarble({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="editorial" supplementalBackground="#e6e8eb" supplementalForeground="#303943">
      <header className="relative bg-[#f5f5f5] px-6 py-14 text-[#303943] md:py-20">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(120deg,transparent_35%,#b8c2cc_36%,transparent_37%,transparent_64%,#d6dbe0_65%,transparent_66%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col justify-center border-y-4 border-double border-[#303943]/35 py-10"><p className={sectionLabel}>Carved into forever</p><h1 className="mt-7 text-5xl leading-tight md:text-7xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1><div className="mt-8 flex justify-start"><Meta event={event} separator="◇" /></div></div>
          <div className="relative p-5"><div className="absolute left-0 top-0 h-20 w-20 border-l-2 border-t-2 border-[#303943]" /><div className="absolute bottom-0 right-0 h-20 w-20 border-b-2 border-r-2 border-[#303943]" />{image && <img src={image} alt="" className="h-[430px] w-full object-cover grayscale-[.2]" />}</div>
        </div>
      </header>
      <main className="bg-white px-6 py-16 text-[#303943]"><div className="mx-auto max-w-6xl"><Story event={event} title="The inscription" className="mx-auto max-w-2xl border-l-8 border-[#b8c2cc] pl-7" /><section className="mt-14"><p className={`${sectionLabel} text-center`}>The composition</p><div className="mt-7"><Schedule event={event} mode="plaques" accent={theme.colors.secondary} /></div></section></div></main>
    </Page>
  );
}

function WillowFern({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="botanical" supplementalBackground="#1f4d3a">
      <header className="relative bg-[#dce9df] px-6 py-14 text-[#173b2d]">
        <span className="absolute -left-8 top-5 rotate-45 text-8xl text-[#1f4d3a]/15">❧</span><span className="absolute -right-8 bottom-5 -rotate-45 text-8xl text-[#1f4d3a]/15">❧</span>
        <div className="relative mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[50%_50%_5px_5px] border-2 border-[#1f4d3a]/40 p-3">{image && <img src={image} alt="" className="h-[470px] w-full rounded-[50%_50%_3px_3px] object-cover" />}</div>
          <div className="text-center"><p className={sectionLabel}>Beneath the willow</p><h1 className="mt-7 text-5xl leading-tight md:text-7xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1><div className="mx-auto my-8 text-4xl">⌇</div><Meta event={event} /></div>
        </div>
      </header>
      <main className="bg-[#f0f5ef] px-6 py-16 text-[#173b2d]"><div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2"><Story event={event} title="Where we took root" className="rounded-[4rem_4rem_1rem_1rem] border border-[#1f4d3a]/20 p-9" /><section><p className={sectionLabel}>Follow the fern path</p><div className="mt-7"><Schedule event={event} mode="steps" accent={theme.colors.primary} /></div></section></div></main>
    </Page>
  );
}

function SilverFrost({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="glass" supplementalBackground="#d9dce4" supplementalForeground="#29313b">
      <header className="relative min-h-[610px] overflow-hidden bg-gradient-to-br from-[#f5f7fb] via-[#d9dce4] to-[#aeb8c5] px-6 py-14 text-[#29313b]">
        <div className="absolute -left-20 top-12 h-72 w-72 rotate-45 border border-white/60" /><div className="absolute -right-16 bottom-10 h-64 w-64 rotate-12 border border-white/50" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[0.85fr_1.15fr]">
          <div><p className={sectionLabel}>A winter gala</p><h1 className="mt-7 text-5xl leading-[0.95] md:text-7xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1><div className="mt-8 flex justify-start"><Meta event={event} separator="✦" /></div><div className="mt-10 flex gap-2"><span className="h-2 w-2 rotate-45 bg-white" /><span className="h-2 w-2 rotate-45 bg-white/60" /><span className="h-2 w-2 rotate-45 bg-white/30" /></div></div>
          <div className="relative"><div className="absolute -inset-4 rotate-2 border border-white/70" />{image && <img src={image} alt="" className="relative h-[430px] w-full -rotate-1 object-cover shadow-2xl" />}</div>
        </div>
      </header>
      <main className="bg-[#f5f7fb] px-6 py-16 text-[#29313b]"><div className="mx-auto max-w-5xl"><Story event={event} title="A crystalline moment" className="mx-auto max-w-2xl text-center" /><section className="mt-14"><Schedule event={event} mode="tiles" accent={theme.colors.primary} /></section></div></main>
    </Page>
  );
}

function AutumnEmber({ theme, event }: Omit<Props, "layout">) {
  const image = heroFor(theme, event);
  return (
    <Page theme={theme} event={event} supplementalTone="paper" supplementalBackground="#f1d8c2" supplementalForeground="#542711">
      <header className="relative bg-[#7a3b1d] px-6 py-14 text-[#fff5e9] md:py-20">
        <span className="absolute left-3 top-5 rotate-[-25deg] text-7xl text-[#f1d8c2]/20">❧</span><span className="absolute bottom-5 right-3 rotate-[155deg] text-7xl text-[#f1d8c2]/20">❧</span>
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1fr_1.05fr]">
          <div className="text-center md:text-left"><p className={sectionLabel} style={{ color: theme.colors.secondary }}>An autumn waltz</p><h1 className="mt-7 text-5xl leading-tight md:text-7xl" style={{ fontFamily: theme.fonts.headline, color: "inherit" }}>{titleFor(event)}</h1><div className="mt-8 md:flex md:justify-start"><Meta event={event} separator="•" /></div><p className="mt-10 text-sm italic text-[#f1d8c2]/75">{event.tagline || "Meet us where the leaves turn gold."}</p></div>
          <div className="relative"><div className="absolute -inset-3 rounded-t-full border border-[#f1d8c2]/45" />{image && <img src={image} alt="" className="h-[450px] w-full rounded-t-full object-cover shadow-2xl" />}</div>
        </div>
      </header>
      <main className="bg-[#fff5e9] px-6 py-16 text-[#542711]"><div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[0.8fr_1.2fr]"><Story event={event} title="Our turning season" className="border-t-4 border-[#7a3b1d] pt-7" /><section><p className={sectionLabel}>The celebration unfolds</p><div className="mt-7"><Schedule event={event} mode="steps" accent={theme.colors.primary} /></div></section></div></main>
    </Page>
  );
}

export default function SignatureWeddingLayout({ layout, theme, event }: Props) {
  switch (layout) {
    case "split-hero": return <MidnightElegance theme={theme} event={event} />;
    case "floral-frame": return <WildRoseHalo theme={theme} event={event} />;
    case "two-column": return <GoldenHourPromise theme={theme} event={event} />;
    case "crest-header": return <IvoryLaceCrest theme={theme} event={event} />;
    case "botanical-borders": return <EmeraldGarden theme={theme} event={event} />;
    case "soft-pastel-hero": return <BlushLinen theme={theme} event={event} />;
    case "arched-hero": return <SapphireMoonlit theme={theme} event={event} />;
    case "parchment-hero": return <RusticStorybook theme={theme} event={event} />;
    case "full-width-luxury": return <ChampagneVelvet theme={theme} event={event} />;
    case "starry-hero": return <CelestialWhisper theme={theme} event={event} />;
    case "centered-minimal-hero": return <PearlTide theme={theme} event={event} />;
    case "split-texture-banner": return <CrimsonOrchard theme={theme} event={event} />;
    case "crest-centered-ribbon": return <OpalineCrest theme={theme} event={event} />;
    case "deep-overlay-hero": return <VelvetMidnight theme={theme} event={event} />;
    case "cascading-floral-top": return <LavenderCascade theme={theme} event={event} />;
    case "airy-horizontal-hero": return <CoralSands theme={theme} event={event} />;
    case "marble-slab-hero": return <EternalMarble theme={theme} event={event} />;
    case "botanical-arch-border": return <WillowFern theme={theme} event={event} />;
    case "silver-gradient-hero": return <SilverFrost theme={theme} event={event} />;
    case "warm-leaf-header": return <AutumnEmber theme={theme} event={event} />;
  }
}
