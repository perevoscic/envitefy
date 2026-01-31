import React from "react";
import { Share2, MapPin, Calendar, Clock } from "lucide-react";
import Image from "next/image";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  // Check if it's already in MM-DD-YYYY format or contains text
  if (dateStr.includes("-") && dateStr.split("-")[0].length === 2) return dateStr;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  // Use UTC values to avoid timezone shifts for YYYY-MM-DD strings
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

function formatTime(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  
  // Check if it looks like there's no time (midnight in UTC or local)
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (hours === 0 && minutes === 0) return "";

  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Types
export type ThemeConfig = {
  id: string;
  name: string;
  defaultHeadline?: string;
  colors: {
    primary: string;
    secondary: string;
    background?: string;
  };
  fonts: {
    headline: string;
    body?: string;
  };
  heroImage?: string;
  decorations?: {
    graphicType?: string;
    heroImage?: string;
    [key: string]: unknown;
  };
};

export type EventData = {
  headlineTitle?: string;
  date?: string;
  location?: string;
  story?: string;
  schedule?: Array<{
    title: string;
    time?: string;
    location?: string;
  }>;
  travel?: string;
  thingsToDo?: string;
  photos?: string[];
  rsvpEnabled?: boolean;
  rsvpLink?: string;
  rsvpDeadline?: string;
  registry?: { label?: string; url: string }[];
  registries?: { label?: string; url: string }[];
  venue?: {
    name?: string;
    address?: string;
  };
  when?: string;
  // Birthday specific
  birthdayName?: string;
  age?: number | string;
  hosts?: Array<{
    name?: string;
    email?: string;
    phone?: string;
  }>;
  gallery?: string[];
  party?: {
    theme?: string;
    activities?: string;
    notes?: string;
  };
  partyDetails?: {
    theme?: string;
    activities?: string;
    notes?: string;
  };
};

interface Props {
  template: any; // We'll map the comprehensive theme object to this
  event: EventData;
}

export default function BirthdayRenderer({ template, event }: Props) {
  const { layout } = template;
  
  // Normalize theme config from the template object
  const theme: ThemeConfig = {
    id: template.id,
    name: template.name,
    defaultHeadline: template.defaultHeadline,
    colors: {
      primary: template.primaryColor,
      secondary: template.secondaryColor,
      background: template.primaryColor, // Default
    },
    fonts: {
      headline: template.headlineFont,
      body: "Inter", // Default body font
    },
    decorations: {
      heroImage: template.heroImage,
      graphicType: template.decorations?.graphicType,
      ...template.decorations,
    },
    heroImage: template.heroImage,
  };

  return (
    <div
      className="w-full min-h-screen flex flex-col"
      style={{
        fontFamily: theme.fonts.body,
        backgroundColor: theme.colors.primary,
      }}
    >
      {renderLayout(layout, theme, event)}
    </div>
  );
}

function renderLayout(layout: string, theme: ThemeConfig, event: EventData) {
  switch (layout) {
    case "confetti-splash":
      return <ConfettiSplashLayout theme={theme} event={event} />;
    case "balloon-arch":
      return <BalloonArchLayout theme={theme} event={event} />;
    case "magical-sparkle":
      return <MagicalSparkleLayout theme={theme} event={event} />;
    case "neon-night":
      return <NeonNightLayout theme={theme} event={event} />;
    case "tropical-vibe":
      return <TropicalVibeLayout theme={theme} event={event} />;
    case "retro-pixel":
      return <PixelArcadeLayout theme={theme} event={event} />;
    case "elegant-serif":
      return <ElegantSerifLayout theme={theme} event={event} />;
    case "cosmic-glow":
      return <CosmicAdventureLayout theme={theme} event={event} />;
    case "animal-party":
      return <AnimalPartyLayout theme={theme} event={event} />;
    case "dino-adventure":
      return <DinoExplorerLayout theme={theme} event={event} />;
    case "underwater-obsidian":
      return <UnderwaterAdventureLayout theme={theme} event={event} />;
    case "whimsical-magic":
      return <WhimsicalMagicLayout theme={theme} event={event} />;
    case "glamor-sparkle":
      return <GlamorousSparkleLayout theme={theme} event={event} />;
    case "sports-stadium":
      return <SportsStadiumLayout theme={theme} event={event} />;
    case "luxury-royal":
      return <LuxuryRoyalLayout theme={theme} event={event} />;
    case "island-paradise":
      return <IslandParadiseLayout theme={theme} event={event} />;
    case "safari-adventure":
      return <SafariAdventureLayout theme={theme} event={event} />;
    case "pattern-play":
      return <PatternPlayLayout theme={theme} event={event} />;
    default:
      return <ConfettiSplashLayout theme={theme} event={event} />;
  }
}

// --- Layouts ---

function ConfettiSplashLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
  const isSports = theme.decorations?.graphicType === "sports";
  const isStars = theme.decorations?.graphicType === "stars";
  
  return (
    <>
      <section className="relative w-full min-h-[600px] py-12 flex items-center justify-center overflow-hidden" style={{ backgroundColor: theme.colors.primary }}>
        {/* Animated Confetti Background */}
        <div className="absolute inset-0 z-0">
             <div className="absolute top-10 left-[10%] text-2xl animate-bounce">🎊</div>
             <div className="absolute top-20 right-[15%] text-2xl animate-bounce delay-75">🎉</div>
             <div className="absolute bottom-20 left-[20%] text-2xl animate-bounce delay-150">✨</div>
             <div className="absolute bottom-10 right-[25%] text-2xl animate-bounce delay-200">🎂</div>
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 flex flex-col items-center">
            <div className="bg-white/90 p-8 md:p-12 rounded-[2rem] shadow-2xl border-4 border-dashed border-slate-200 text-center transform -rotate-1">
                <div className="inline-block px-4 py-1 mb-6 rounded-full bg-slate-100 text-[10px] tracking-[0.4em] uppercase font-black text-slate-400">
                    The Big Celebration
                </div>
                <h1 className="text-4xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight px-4" 
                    style={{ fontFamily: theme.fonts.headline, color: theme.colors.secondary }}>
                    {event.headlineTitle || theme.defaultHeadline || "Birthday Bash!"}
                </h1>
                
                <div className="grid grid-cols-2 gap-8 items-center border-t-2 border-slate-100 pt-8">
                    <div className="text-right border-r-2 border-slate-100 pr-8">
                        <p className="text-sm uppercase tracking-widest font-bold text-slate-400 mb-1">When</p>
                        <p className="text-xl font-black text-slate-800">{formatDate(event.date)}</p>
                    </div>
                    <div className="text-left pl-4">
                        <p className="text-sm uppercase tracking-widest font-bold text-slate-400 mb-1">Where</p>
                        <p className="text-xl font-black text-slate-800">{event.location}</p>
                    </div>
                </div>
            </div>

            <div className="mt-12 w-64 h-64 rounded-3xl overflow-hidden shadow-2xl border-8 border-white transform rotate-3 hover:rotate-0 transition-transform duration-500">
                {theme.decorations?.heroImage && (
                    <img src={theme.decorations.heroImage} alt="" className="w-full h-full object-cover" />
                )}
            </div>
        </div>
      </section>
      <div className="bg-white">
        <BirthdayContentSections theme={theme} event={event} backgroundColor="transparent" />
      </div>
      <Footer theme={theme} event={event} />
    </>
  );
}

function BalloonArchLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
   return (
    <>
      <section className="relative w-full py-16 flex flex-col items-center justify-center overflow-hidden" style={{ backgroundColor: theme.colors.primary }}>
        {/* Balloon Strings Decoration */}
        <div className="absolute top-0 left-1/4 w-px h-32 bg-slate-300 opacity-30"></div>
        <div className="absolute top-0 right-1/4 w-px h-48 bg-slate-300 opacity-20"></div>
        <div className="absolute top-10 left-10 w-12 h-16 rounded-full border-2 border-white/40 rotate-12"></div>
        <div className="absolute top-20 right-12 w-10 h-14 rounded-full border-2 border-white/30 -rotate-12"></div>

        {theme.decorations?.heroImage && (
          <div className="w-full max-w-sm h-72 md:h-96 rounded-full overflow-hidden mb-8 shadow-2xl border-8 border-white relative z-10 transition-transform hover:scale-105 duration-500">
             <img src={theme.decorations.heroImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="relative z-10 text-center max-w-2xl px-6">
           <div className="flex justify-center gap-2 mb-4">
              <span className="text-2xl animate-bounce">🎈</span>
              <span className="text-2xl animate-bounce delay-100">🎈</span>
              <span className="text-2xl animate-bounce delay-200">🎈</span>
           </div>
           <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight" 
               style={{ fontFamily: theme.fonts.headline, color: theme.colors.secondary }}>
             {event.headlineTitle || theme.defaultHeadline || "Happy Birthday!"}
           </h1>
           
           <div className="inline-flex items-center gap-6 text-slate-700 bg-white/40 backdrop-blur-sm px-8 py-3 rounded-full border border-white/50">
                <div className="text-center">
                    <p className="text-xs uppercase tracking-widest font-bold opacity-50">When</p>
                    <p className="font-bold">{formatDate(event.date)}</p>
                </div>
                <div className="w-px h-8 bg-slate-300"></div>
                <div className="text-center">
                    <p className="text-xs uppercase tracking-widest font-bold opacity-50">Where</p>
                    <p className="font-bold">{event.location}</p>
                </div>
           </div>
        </div>
      </section>
      <BirthdayContentSections theme={theme} event={event} />
      <Footer theme={theme} event={event} />
    </>
   );
}

function GlamorousSparkleLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="relative w-full h-[600px] flex items-center justify-center overflow-hidden">
                {/* Glitter/Sparkle Particles */}
                <div className="absolute inset-0 bg-[#fff5f8]" style={{ backgroundColor: theme.colors.primary }}></div>
                <div className="absolute inset-0 opacity-40 mix-blend-overlay"
                     style={{ 
                        backgroundImage: `radial-gradient(circle at 50% 50%, white 1px, transparent 1px)`,
                        backgroundSize: '24px 24px'
                     }}></div>
                
                <div className="relative z-10 max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1 text-center md:text-left">
                        <span className="inline-block px-6 py-2 rounded-full border-2 font-bold tracking-[0.2em] uppercase text-xs mb-6"
                              style={{ borderColor: theme.colors.secondary, color: theme.colors.secondary }}>
                            Invitation &bull; Glamour
                        </span>
                        <h1 className="text-6xl md:text-8xl font-light mb-8 italic" 
                            style={{ fontFamily: theme.fonts.headline, color: theme.colors.secondary }}>
                            {event.headlineTitle || theme.defaultHeadline || "Sparkle & Shine"}
                        </h1>
                        <div className="flex flex-col gap-4 text-xl">
                            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                                <span className="font-bold text-slate-400 text-xs uppercase tracking-widest">When</span>
                                <span className="text-slate-700">{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-slate-400 text-xs uppercase tracking-widest">Where</span>
                                <span className="text-slate-700">{event.location}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="order-1 md:order-2 relative">
                        <div className="absolute -inset-2 bg-gradient-to-tr from-pink-300 to-purple-400 rounded-[4rem] blur opacity-30 animate-pulse"></div>
                        <div className="relative aspect-[3/4] rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-white ring-1 ring-slate-100">
                             {theme.decorations?.heroImage && (
                                <img src={theme.decorations.heroImage} className="w-full h-full object-cover" alt="" />
                             )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 -mt-12 relative z-20">
                <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
                    <BirthdayContentSections theme={theme} event={event} backgroundColor="transparent" />
                </div>
            </main>
            
            <Footer theme={theme} event={event} backgroundColor="transparent" />
        </div>
    );
}

function WhimsicalMagicLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col" 
             style={{ backgroundColor: theme.colors.primary, backgroundImage: 'radial-gradient(circle at 50% 50%, white, transparent)' }}>
            
            {/* Soft Clouds/Shapes */}
            <div className="absolute top-20 left-10 w-64 h-32 bg-white rounded-full blur-3xl opacity-60"></div>
            <div className="absolute top-40 right-10 w-72 h-40 bg-white rounded-full blur-3xl opacity-50"></div>
            
            <section className="relative z-10 pt-20 pb-12 px-6 flex flex-col items-center">
                <div className="mb-12 text-center">
                    <div className="text-4xl mb-4 drop-shadow-md">✨🦄✨</div>
                    <h1 className="text-6xl md:text-8xl font-medium mb-4 italic" 
                        style={{ fontFamily: theme.fonts.headline, color: theme.colors.secondary }}>
                        {event.headlineTitle || theme.defaultHeadline || "Dream Big!"}
                    </h1>
                </div>

                <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1 space-y-8 bg-white/40 backdrop-blur-md p-10 rounded-[3rem] border border-white shadow-xl shadow-pink-100/20">
                        <div className="space-y-2">
                             <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400">Join the Magic</h2>
                             <p className="text-4xl font-light italic" style={{ color: theme.colors.secondary }}>{formatDate(event.date)}</p>
                        </div>
                        <div className="space-y-2">
                             <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400">At the Kingdom</h2>
                             <p className="text-2xl text-slate-600">{event.location}</p>
                        </div>
                    </div>

                    <div className="order-1 md:order-2 relative">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-pink-200 via-purple-100 to-sky-100 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                        <div className="relative aspect-square rounded-2xl overflow-hidden border-8 border-white shadow-2xl">
                            {theme.decorations?.heroImage && (
                                <img src={theme.decorations.heroImage} className="w-full h-full object-cover" alt="" />
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className="mt-8">
                <BirthdayContentSections theme={theme} event={event} backgroundColor="transparent" />
            </div>
            
            <Footer theme={theme} event={event} backgroundColor="transparent" />
        </div>
    );
}

function NeonNightLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
    const isPixel = theme.decorations?.graphicType === "pixel";
    const bgGradient = isPixel 
      ? `linear-gradient(to bottom, ${theme.colors.primary}, #000)` 
      : "linear-gradient(to bottom right, #0f172a, #000000)";

    return (
        <>
          <section className="relative w-full h-[500px] flex items-center justify-center overflow-hidden bg-slate-900 text-white"
                   style={{ backgroundColor: theme.colors.primary }}>
            <div className="absolute inset-0" style={{ background: bgGradient }}></div>
            
            {/* Dynamic Neon Glows */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-[100px] opacity-20"
                 style={{ backgroundColor: theme.colors.secondary }}></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-[100px] opacity-20 animate-pulse"
                 style={{ backgroundColor: isPixel ? "#ff00ff" : "#d946ef" }}></div>

            {theme.decorations?.heroImage && (
             <div className="absolute inset-0 mix-blend-overlay opacity-40">
                <img src={theme.decorations.heroImage} alt="" className="w-full h-full object-cover grayscale" />
             </div>
            )}
            
            <div className="relative z-10 text-center border-4 border-white/10 p-10 md:p-16 backdrop-blur-sm bg-black/20 max-w-3xl mx-4">
                <div className="absolute inset-0 border-2 scale-[1.02] -z-10 animate-pulse"
                     style={{ borderColor: `${theme.colors.secondary}80` }}></div>
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    style={{ fontFamily: theme.fonts.headline, textShadow: `0 0 20px ${theme.colors.secondary}`, color: "#fff" }}>
                    {event.headlineTitle || theme.defaultHeadline || "Neon Party"}
                </h1>
                
                <div className="flex flex-col gap-2 items-center text-lg md:text-xl font-light tracking-widest text-white/80">
                    <p>{formatDate(event.date)}</p>
                    <div className="w-10 h-[1px] bg-white/30 my-2"></div>
                    <p>{event.location}</p>
                </div>
            </div>
          </section>
          <div className="bg-slate-900 text-slate-200" style={{ backgroundColor: theme.colors.primary }}>
             <BirthdayContentSections theme={theme} event={event} darkMode={true} backgroundColor={theme.colors.primary} />
             <Footer theme={theme} event={event} backgroundColor={theme.colors.primary} darkMode={true} />
          </div>
        </>
    );
}

function MagicalSparkleLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
    const isWinter = theme.decorations?.graphicType === "snowflakes";
    
    return (
     <>
       <section className="relative w-full h-[400px] flex items-center justify-center" style={{ backgroundColor: theme.colors.primary }}>
         {theme.decorations?.heroImage && (
           <img src={theme.decorations.heroImage} className="absolute inset-0 w-full h-full object-cover opacity-60 mask-image-gradient-b" alt="" />
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent"></div>
         
         <div className="relative z-10 text-center max-w-2xl px-6">
            <div className="mb-4 text-2xl" style={{ color: theme.colors.secondary }}>{isWinter ? "❄️" : "✨"}</div>
            <h1 className="text-5xl md:text-6xl italic mb-4" 
                style={{ fontFamily: theme.fonts.headline, color: theme.colors.secondary }}>
                {event.headlineTitle || theme.defaultHeadline || "Magical Birthday"}
            </h1>
            <div className="flex items-center justify-center gap-4 text-slate-600 mt-4">
                <span className="uppercase tracking-widest text-sm border-b pb-1" style={{ borderColor: theme.colors.secondary }}>{formatDate(event.date)}</span>
                <span style={{ color: theme.colors.secondary }}>•</span>
                <span className="uppercase tracking-widest text-sm border-b pb-1" style={{ borderColor: theme.colors.secondary }}>{event.location}</span>
            </div>
         </div>
       </section>
       <BirthdayContentSections theme={theme} event={event} />
       <Footer theme={theme} event={event} />
     </>
    );
}

function TropicalVibeLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
    const isGarden = theme.decorations?.graphicType === "flowers";
    const isDino = theme.decorations?.graphicType === "dinos";

    return (
        <>
          <section className="relative w-full py-20 flex flex-col items-center" style={{ backgroundColor: theme.colors.primary }}>
            <div className="w-full max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center px-6">
                <div className="order-2 md:order-1 text-center md:text-left">
                    <span className="uppercase tracking-[0.3em] text-xs font-bold mb-3 block" style={{ color: theme.colors.secondary }}>
                        {isGarden ? "You're Invited" : isDino ? "Roar!" : "Let's Party"}
                    </span>
                    <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight" 
                        style={{ fontFamily: theme.fonts.headline }}>
                        {event.headlineTitle || theme.defaultHeadline || "Tropical Bash"}
                    </h1>
                    <div className="space-y-2 text-slate-600">
                        <p className="font-semibold text-lg">{formatDate(event.date)}</p>
                        <p>{event.location}</p>
                    </div>
                </div>
                <div className="order-1 md:order-2 relative h-80 rounded-t-full rounded-b-3xl overflow-hidden shadow-2xl">
                    {theme.decorations?.heroImage && (
                        <img src={theme.decorations.heroImage} alt="" className="w-full h-full object-cover" />
                    )}
                </div>
            </div>
          </section>
          <BirthdayContentSections theme={theme} event={event} backgroundColor={theme.colors.primary} />
          <Footer theme={theme} event={event} backgroundColor={theme.colors.primary} />
        </>
    );
}


// --- New Layouts ---

function PixelArcadeLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
  return (
    <>
      <section className="relative w-full py-16 flex flex-col items-center justify-center bg-zinc-900 border-b-4 border-dashed"
               style={{ borderColor: theme.colors.secondary, backgroundColor: theme.colors.primary }}>
         
         <div className="absolute inset-0 opacity-10" 
              style={{ backgroundImage: `linear-gradient(transparent 50%, rgba(0,0,0,0.5) 50%)`, backgroundSize: "100% 4px" }}></div>

         <div className="relative z-10 border-4 p-8 max-w-2xl text-center bg-black/40 backdrop-blur-md shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]"
              style={{ borderColor: theme.colors.secondary, boxShadow: `8px 8px 0px 0px ${theme.colors.secondary}` }}>
            <div className="text-xs uppercase tracking-widest mb-4 font-mono text-white animate-pulse">
                &lt; INSERT COIN TO START /&gt;
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 uppercase tracking-tighter"
                style={{ fontFamily: "'Press Start 2P', monospace", textShadow: `4px 4px 0px ${theme.colors.secondary}` }}>
                {event.headlineTitle || theme.defaultHeadline || "GAME ON"}
            </h1>

            <div className="space-y-4 font-mono text-green-400">
                <div className="flex items-center justify-center gap-2">
                    <span>QUEST DATE:</span>
                    <span className="text-white">{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                    <span>LOCATION:</span>
                    <span className="text-white">{event.location}</span>
                </div>
            </div>
         </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary, fontFamily: "'Press Start 2P', monospace" }}>
         <BirthdayContentSections theme={theme} event={event} darkMode={true} backgroundColor={theme.colors.primary} />
         <Footer theme={theme} event={event} backgroundColor={theme.colors.primary} darkMode={true} />
      </div>
    </>
  );
}

function ElegantSerifLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col items-center pt-16 pb-16 px-6">
            <div className="w-full max-w-2xl bg-white p-12 shadow-2xl relative border"
                 style={{ borderColor: theme.colors.secondary }}>
                
                {/* Gold Frame Effect */}
                <div className="absolute inset-2 border double-border pointer-events-none"
                     style={{ border: `1px solid ${theme.colors.secondary}` }}></div>
                <div className="absolute inset-3 border pointer-events-none opacity-50"
                     style={{ border: `1px solid ${theme.colors.secondary}` }}></div>

                <div className="text-center relative z-10 space-y-8">
                    <span className="text-xs uppercase tracking-[0.4em] text-slate-400">A Celebration For</span>
                    
                    <h1 className="text-6xl md:text-7xl playfair italic"
                        style={{ color: theme.colors.secondary, fontFamily: theme.fonts.headline }}>
                        {event.headlineTitle || theme.defaultHeadline || "The Birthday"}
                    </h1>

                    <div className="w-full h-px bg-slate-100 my-8 mx-auto max-w-[200px]"></div>

                    <div className="space-y-2 text-slate-600 font-serif leading-loose">
                        <p className="text-xl text-slate-900">{formatDate(event.date)}</p>
                        <p className="italic">at</p>
                        <p className="text-lg uppercase tracking-wide">{event.location}</p>
                    </div>

                    {theme.decorations?.heroImage && (
                        <div className="mt-8 relative h-64 w-full overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                             <img src={theme.decorations.heroImage} className="w-full h-full object-cover opacity-90" alt="" />
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-2xl w-full mt-12 text-center text-slate-600">
                <BirthdayContentSections theme={theme} event={event} backgroundColor="transparent" />
                <Footer theme={theme} event={event} backgroundColor="transparent" />
            </div>
        </div>
    );
}

function CosmicAdventureLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
    return (
        <div className="bg-black text-white min-h-screen relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-80"></div>
            
            {/* Stars/Dust */}
            <div className="absolute inset-0 opacity-40 animate-[pulse_4s_ease-in-out_infinite]"
                 style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "50px 50px" }}></div>

            <section className="relative z-10 min-h-[60vh] flex flex-col items-center justify-center p-6">
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-10 rounded-full w-[300px] h-[300px] md:w-[500px] md:h-[500px] flex flex-col items-center justify-center text-center shadow-[0_0_100px_rgba(255,255,255,0.1)] relative">
                     {/* Orbiting Ring */}
                     <div className="absolute inset-[-20px] rounded-full border border-dashed border-white/20 animate-[spin_10s_linear_infinite]"></div>
                     
                     <span className="text-cyan-400 tracking-[0.5em] text-xs font-bold uppercase mb-4">Incoming Transmission</span>
                     <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-6"
                         style={{ fontFamily: theme.fonts.headline }}>
                        {event.headlineTitle || theme.defaultHeadline || "BLAST OFF"}
                     </h1>
                     <div className="text-cyan-200 font-mono text-sm space-y-1">
                        <p>&gt; DATE: {formatDate(event.date)}</p>
                        <p>&gt; LOC: {event.location}</p>
                     </div>
                </div>
            </section>

             <BirthdayContentSections theme={theme} event={event} darkMode={true} backgroundColor="transparent" />
             <Footer theme={theme} event={event} darkMode={true} backgroundColor="transparent" />
        </div>
    );
}

function AnimalPartyLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
    return (
        <div className="min-h-screen relative overflow-hidden" 
             style={{ backgroundColor: theme.colors.primary }}>
            {/* Soft Pastel Shapes */}
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-30 blur-3xl -translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: theme.colors.secondary }}></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl translate-x-1/3 translate-y-1/3" style={{ backgroundColor: theme.colors.secondary }}></div>
            
            <div className="max-w-4xl mx-auto pt-16 px-6 pb-20 relative z-10">
                <div className="text-center mb-12">
                    <span className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4" 
                          style={{ backgroundColor: `${theme.colors.secondary}20`, color: theme.colors.secondary }}>
                        Let&apos;s Celebrate!
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6" 
                        style={{ fontFamily: theme.fonts.headline, color: theme.colors.secondary }}>
                        {event.headlineTitle || theme.defaultHeadline || "Wild One!"}
                    </h1>
                </div>

                {/* Polaroid Style Gallery for animals */}
                <div className="grid md:grid-cols-2 gap-8 mb-16 px-4">
                    <div className="bg-white p-3 shadow-xl -rotate-1 transform transition hover:rotate-0">
                        {(theme.decorations?.heroImage || theme.heroImage) && (
                            <img src={theme.decorations?.heroImage || theme.heroImage} className="w-full h-72 object-cover mb-4" alt="" />
                        )}
                        <div className="text-center font-medium italic text-slate-500">Party Time!</div>
                    </div>
                    <div className="hidden md:block bg-white p-3 shadow-xl rotate-2 transform transition hover:rotate-0 mt-8">
                        <div className="w-full h-72 bg-slate-50 flex items-center justify-center text-4xl">🦁</div>
                        <div className="text-center mt-4 font-medium italic text-slate-500">Roar!</div>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-white/50">
                    <div className="text-center mb-12">
                        <p className="text-2xl font-semibold mb-2">{formatDate(event.date)}</p>
                        <p className="text-slate-600 uppercase tracking-widest font-bold text-sm">{event.location}</p>
                    </div>
                    <BirthdayContentSections theme={theme} event={event} backgroundColor="transparent" />
                </div>
                
                <Footer theme={theme} event={event} backgroundColor="transparent" />
            </div>
        </div>
    );
}

function DinoExplorerLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
    return (
        <div className="min-h-screen bg-[#f4f1ea]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)`, backgroundSize: '40px 40px' }}>
            <div className="max-w-4xl mx-auto pt-12 px-6 pb-20">
                {/* Torn Paper Header */}
                <div className="relative mb-16">
                    <div className="bg-[#6b8c42] text-white p-12 md:p-20 shadow-lg relative rounded-sm" style={{ backgroundColor: theme.colors.secondary }}>
                        <div className="absolute top-0 left-0 w-full h-4 overflow-hidden -mt-2">
                             <div className="w-full h-8 bg-white rotate-1 origin-top-left"></div>
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-4" style={{ fontFamily: theme.fonts.headline }}>
                            {event.headlineTitle || theme.defaultHeadline || "ROAR!"}
                        </h1>
                        <p className="text-xl md:text-2xl font-bold opacity-90 border-t-2 border-white/30 pt-4 mt-6 inline-block">
                            EXPLORER MISSION: {formatDate(event.date)}
                        </p>
                    </div>
                    {/* Shadow "Tear" Effect */}
                    <div className="w-full h-6 bg-black/5 blur-sm"></div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        {theme.decorations?.heroImage && (
                            <div className="rounded-2xl overflow-hidden shadow-2xl border-8 border-white">
                                <img src={theme.decorations.heroImage} className="w-full h-[400px] object-cover" alt="" />
                            </div>
                        )}
                        <div className="bg-white p-8 md:p-12 shadow-sm rounded-lg border-l-8" style={{ borderColor: theme.colors.secondary }}>
                            <BirthdayContentSections theme={theme} event={event} backgroundColor="transparent" />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white p-6 shadow-md rounded-lg text-center font-mono">
                            <span className="text-xs text-slate-400 block mb-2 font-sans font-bold uppercase tracking-widest">Base Location</span>
                            <p className="font-bold text-lg">{event.location}</p>
                        </div>
                        <div className="bg-[#eff2e6] p-6 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-4xl">
                            🦖 🌴 🌋
                        </div>
                    </div>
                </div>
                
                <Footer theme={theme} event={event} backgroundColor="transparent" />
            </div>
        </div>
    );
}

function UnderwaterAdventureLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
    return (
        <div className="min-h-screen bg-sky-50 overflow-hidden relative" style={{ backgroundColor: theme.colors.primary }}>
            {/* Animated Bubbles Background */}
            <div className="absolute top-20 left-10 w-8 h-8 rounded-full border-2 border-white opacity-40 animate-bounce"></div>
            <div className="absolute top-60 right-20 w-12 h-12 rounded-full border-2 border-white opacity-30 animate-[bounce_3s_infinite]"></div>
            <div className="absolute bottom-40 left-1/4 w-10 h-10 rounded-full border-2 border-white opacity-20 animate-[bounce_4s_infinite]"></div>
            
            <div className="max-w-5xl mx-auto px-6 pt-20 pb-20 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-12 mb-20">
                    <div className="flex-1 text-center md:text-left">
                        <div className="w-16 h-1 w-full md:mx-0 mx-auto bg-sky-300 mb-6" style={{ backgroundColor: theme.colors.secondary }}></div>
                        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-sky-900 to-sky-700" 
                            style={{ fontFamily: theme.fonts.headline, color: theme.colors.secondary }}>
                            {event.headlineTitle || theme.defaultHeadline || "Ocean Adventure"}
                        </h1>
                        <p className="text-2xl font-light text-sky-800 tracking-wide">
                            {formatDate(event.date)} <span className="mx-2 opacity-30">|</span> {event.location}
                        </p>
                    </div>
                    
                    <div className="relative w-72 h-72 md:w-96 md:h-96">
                        {/* Circular Mask Hero */}
                        <div className="absolute inset-0 rounded-full border-4 border-dashed border-sky-200 animate-[spin_20s_linear_infinite]"></div>
                        <div className="absolute inset-4 rounded-full overflow-hidden shadow-2xl border-8 border-white bg-white">
                            {theme.decorations?.heroImage && (
                                <img src={theme.decorations.heroImage} className="w-full h-full object-cover" alt="" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-[3rem] p-8 md:p-16 shadow-xl shadow-sky-900/5">
                    <BirthdayContentSections theme={theme} event={event} backgroundColor="transparent" />
                </div>
                
                <Footer theme={theme} event={event} backgroundColor="transparent" />
            </div>
        </div>
    );
}

function PatternPlayLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
    // Generate a simple pattern based on color
    const patternColor = theme.colors.secondary.replace('#', '%23');
    const bgPattern = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${patternColor}' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`;

    return (
        <div className="min-h-screen border-[12px] border-white"
             style={{ backgroundColor: theme.colors.primary, backgroundImage: bgPattern }}>
            
            <div className="max-w-4xl mx-auto pt-20 px-4 pb-20">
                <div className="bg-white p-2 shadow-xl rotate-1 max-w-lg mx-auto mb-16 transform hover:rotate-0 transition-transform duration-300">
                    <div className="bg-slate-100 h-64 w-full relative overflow-hidden flex items-center justify-center">
                         {theme.decorations?.heroImage ? (
                             <img src={theme.decorations.heroImage} className="w-full h-full object-cover" alt="" />
                         ) : (
                             <span className="text-6xl">🎈</span>
                         )}
                    </div>
                    <div className="p-8 text-center pb-12">
                         <h1 className="text-5xl font-bold mb-2 transform -rotate-2"
                             style={{ fontFamily: theme.fonts.headline, color: theme.colors.secondary }}>
                             {event.headlineTitle || theme.defaultHeadline || "Party Time!"}
                         </h1>
                         <p className="text-slate-500 font-medium uppercase tracking-wide mt-4">
                             {formatDate(event.date)} • {event.location}
                         </p>
                    </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-sm">
                    <BirthdayContentSections theme={theme} event={event} backgroundColor="transparent" />
                </div>
                
                <Footer theme={theme} event={event} backgroundColor="transparent" />
            </div>
        </div>
    );
}

// --- Content Components ---

function BirthdayContentSections({ theme, event, backgroundColor, darkMode = false }: { theme: ThemeConfig; event: EventData; backgroundColor?: string; darkMode?: boolean }) {
    const bg = backgroundColor || (darkMode ? "#0f172a" : theme.colors.primary);
    const textColor = darkMode ? "#e2e8f0" : "#334155";
    const headingColor = darkMode ? "#f8fafc" : theme.colors.secondary;
    const sectionBg = darkMode ? "bg-white/5" : "bg-white/70 shadow-sm";
    const registryList = event.registries || event.registry || [];
    
    // Extract explicit birthday details
    const childName = event.birthdayName || (event.headlineTitle && event.headlineTitle.includes("'s") ? event.headlineTitle.split("'s")[0] : null);
    const age = event.age;
    const partyTheme = event.party?.theme || event.partyDetails?.theme;
    const time = formatTime(event.date);

    return (
        <main className="w-full max-w-4xl mx-auto px-6 py-12 space-y-12" style={{ backgroundColor: bg, color: textColor }}>
            {/* Quick Info Bar - Explicit visibility for Child's Name, Age, Start Time, and Party Theme */}
            {(childName || age || time || partyTheme) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                     {childName && (
                         <div className={`p-4 rounded-2xl ${sectionBg} border ${darkMode ? 'border-white/10' : 'border-white/20'} text-center flex flex-col justify-center min-h-[100px]`}>
                            <p className="text-[10px] uppercase tracking-widest font-black opacity-40 mb-2">Guest of Honor</p>
                            <p className="font-bold text-lg leading-tight" style={{ color: headingColor }}>{childName}</p>
                         </div>
                     )}
                     {age && (
                         <div className={`p-4 rounded-2xl ${sectionBg} border ${darkMode ? 'border-white/10' : 'border-white/20'} text-center flex flex-col justify-center min-h-[100px]`}>
                            <p className="text-[10px] uppercase tracking-widest font-black opacity-40 mb-2">Turning</p>
                            <p className="font-bold text-2xl" style={{ color: headingColor }}>
                                {(() => {
                                    const n = typeof age === 'string' ? parseInt(age) : age;
                                    if (isNaN(n)) return age;
                                    const j = n % 10, k = n % 100;
                                    if (j === 1 && k !== 11) return n + "st";
                                    if (j === 2 && k !== 12) return n + "nd";
                                    if (j === 3 && k !== 13) return n + "rd";
                                    return n + "th";
                                })()}
                            </p>
                         </div>
                     )}
                     {time && (
                         <div className={`p-4 rounded-2xl ${sectionBg} border ${darkMode ? 'border-white/10' : 'border-white/20'} text-center flex flex-col justify-center min-h-[100px]`}>
                            <p className="text-[10px] uppercase tracking-widest font-black opacity-40 mb-2">Starts At</p>
                            <p className="font-bold text-lg" style={{ color: headingColor }}>{time}</p>
                         </div>
                     )}
                     {partyTheme && (
                         <div className={`p-4 rounded-2xl ${sectionBg} border ${darkMode ? 'border-white/10' : 'border-white/20'} text-center flex flex-col justify-center min-h-[100px]`}>
                            <p className="text-[10px] uppercase tracking-widest font-black opacity-40 mb-2">Party Theme</p>
                            <p className="font-bold text-lg leading-tight" style={{ color: headingColor }}>{partyTheme}</p>
                         </div>
                     )}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
                {/* Party Story / Details */}
                {event.story && (
                    <section className={`p-8 rounded-[2rem] ${sectionBg} backdrop-blur-sm border ${darkMode ? 'border-white/10' : 'border-white/50'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">📝</span>
                            <h2 className="text-2xl font-bold" style={{ fontFamily: theme.fonts.headline, color: headingColor }}>
                                Party Details
                            </h2>
                        </div>
                        <p className="leading-relaxed opacity-90 text-lg">
                            {event.story}
                        </p>
                    </section>
                )}

                {/* Important Notes */}
                {event.thingsToDo && (
                    <section className={`p-8 rounded-[2rem] ${sectionBg} backdrop-blur-sm border ${darkMode ? 'border-white/10' : 'border-white/50'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">💡</span>
                            <h2 className="text-2xl font-bold" style={{ fontFamily: theme.fonts.headline, color: headingColor }}>
                                Good to Know
                            </h2>
                        </div>
                        <p className="leading-relaxed opacity-90 text-lg">
                            {event.thingsToDo}
                        </p>
                    </section>
                )}
            </div>

            {/* Schedule / Timeline */}
            {event.schedule && event.schedule.length > 0 && (
                <section className={`p-8 md:p-12 rounded-[3rem] ${sectionBg} backdrop-blur-sm border ${darkMode ? 'border-white/10' : 'border-white/50'}`}>
                    <div className="flex items-center gap-3 mb-8 justify-center">
                        <span className="text-3xl">🗓️</span>
                        <h2 className="text-3xl font-bold text-center" style={{ fontFamily: theme.fonts.headline, color: headingColor }}>
                            Our Fun Timeline
                        </h2>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                        {event.schedule.map((item, idx) => (
                            <div key={idx} className={`p-6 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-white/80 shadow-sm'} border ${darkMode ? 'border-white/10' : 'border-slate-100'} hover:scale-[1.02] transition-transform`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-xl">{item.title}</h3>
                                    {item.time && <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold tracking-tighter">⏰ {item.time}</span>}
                                </div>
                                {item.location && <p className="text-sm opacity-60">📍 {item.location}</p>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Photo Gallery - More playful grid */}
            {event.gallery && event.gallery.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-8 justify-center">
                        <span className="text-3xl">📸</span>
                        <h2 className="text-3xl font-bold text-center" style={{ fontFamily: theme.fonts.headline, color: headingColor }}>
                            Birthday Memories
                        </h2>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                        {event.gallery.map((photo, idx) => (
                            <div key={idx} className={`w-48 aspect-square rounded-[2rem] overflow-hidden shadow-xl border-4 border-white ${idx % 2 === 0 ? 'rotate-2' : '-rotate-2'} hover:rotate-0 hover:scale-110 transition-all duration-300`}>
                                <img src={photo} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Organized Hosts Row */}
            {event.hosts && event.hosts.length > 0 && (
                <section className="text-center">
                    <h2 className="text-xl font-bold mb-6 uppercase tracking-[0.2em] opacity-40" style={{ color: textColor }}>
                        Hosted with ❤️ by
                    </h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {event.hosts.map((host, idx) => (
                            <div key={idx} className={`px-8 py-4 rounded-full ${sectionBg} border ${darkMode ? 'border-white/10' : 'border-white/50'} flex flex-col items-center shadow-lg`}>
                                <p className="font-black text-xl italic" style={{ color: headingColor }}>{host.name}</p>
                                {(host.email || host.phone) && (
                                    <div className="flex gap-4 mt-1 text-[10px] uppercase font-bold tracking-widest opacity-40">
                                        {host.email && <span>{host.email}</span>}
                                        {host.phone && <span>{host.phone}</span>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Registry list */}
            {registryList.length > 0 && (
                 <section className="text-center pt-8 border-t border-slate-200/20">
                    <h2 className="text-lg font-bold mb-6 opacity-40">Gift Registries</h2>
                    <div className="flex flex-wrap justify-center gap-3">
                        {registryList.map((r, idx) => (
                            <a key={idx} href={r.url} target="_blank" rel="noopener noreferrer" 
                               className={`px-6 py-3 rounded-xl text-sm font-bold transition-all hover:shadow-lg ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-slate-50 shadow-md border border-slate-100'} `}>
                                🎁 {r.label || "Registry"}
                            </a>
                        ))}
                    </div>
                 </section>
            )}
            
            {event.rsvpEnabled && (
                <section className="text-center pt-8">
                    <a href={event.rsvpLink} 
                       className="inline-block px-12 py-5 text-xl font-black rounded-full shadow-2xl transform transition hover:scale-105 active:scale-95 uppercase tracking-tighter"
                       style={{ backgroundColor: theme.colors.secondary, color: '#fff' }}>
                        RSVP for the Fun!
                    </a>
                    {event.rsvpDeadline && (
                        <p className="mt-4 text-xs font-bold uppercase tracking-widest opacity-40">Please RSVP by {event.rsvpDeadline}</p>
                    )}
                </section>
            )}
        </main>
    );
}

function Footer({ theme, event, backgroundColor, darkMode = false }: { theme: ThemeConfig; event: EventData; backgroundColor?: string; darkMode?: boolean }) {
    const bg = backgroundColor || (darkMode ? "#020617" : (theme.colors.background || theme.colors.primary));
    const textColor = darkMode ? "#94a3b8" : "#64748b";
    
    return (
        <footer className="text-center py-12 mt-auto" style={{ backgroundColor: bg, color: textColor }}>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
                 <button className={`px-4 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-slate-50 border border-slate-200'}`}>
                    Share Link
                 </button>
                 <button className={`px-4 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-slate-50 border border-slate-200'}`}>
                    Add to Calendar
                 </button>
            </div>
            
            <p className="text-sm opacity-60">
                Created with Envitefy.
            </p>
        </footer>
    );
}

function SportsStadiumLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <section className="relative w-full h-[500px] overflow-hidden bg-green-700 flex flex-col items-center justify-center">
                {/* Grass texture pattern */}
                <div className="absolute inset-0 opacity-20"
                     style={{ 
                        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 80px)`
                     }}></div>
                
                {/* Yard Lines */}
                <div className="absolute inset-0 border-y-4 border-white opacity-40"></div>
                <div className="absolute inset-x-0 h-px bg-white/30 top-1/4"></div>
                <div className="absolute inset-x-0 h-px bg-white/30 top-2/4"></div>
                <div className="absolute inset-x-0 h-px bg-white/30 top-3/4"></div>

                <div className="relative z-10 text-center text-white px-6">
                    <div className="inline-block px-6 py-2 bg-orange-500 font-black text-xl italic uppercase tracking-tighter transform skew-x-[-15deg] mb-6 shadow-xl"
                         style={{ backgroundColor: theme.colors.secondary }}>
                        All Star Birthday
                    </div>
                    <h1 className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]"
                        style={{ fontFamily: theme.fonts.headline }}>
                        {event.headlineTitle || theme.defaultHeadline || "Game Day!"}
                    </h1>
                </div>

                <div className="absolute -bottom-12 z-20 w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden border-[12px] border-white shadow-2xl rotate-3">
                     {theme.decorations?.heroImage && (
                        <img src={theme.decorations.heroImage} className="w-full h-full object-cover" alt="" />
                     )}
                </div>
            </section>

            <main className="flex-1 pt-24 pb-20 px-6">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-slate-200">
                             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kickoff Time</span>
                             <p className="text-2xl font-black italic text-slate-800">{formatDate(event.date)}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-slate-200">
                             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stadium Location</span>
                             <p className="text-2xl font-black italic text-slate-800 uppercase line-clamp-1">{event.location}</p>
                        </div>
                    </div>
                    
                    <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100">
                        <BirthdayContentSections theme={theme} event={event} backgroundColor="transparent" />
                    </div>
                </div>
            </main>
            
            <Footer theme={theme} event={event} backgroundColor="transparent" />
        </div>
    );
}

function LuxuryRoyalLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
    return (
        <div className="min-h-screen bg-[#0d1b33] text-[#e0c097] flex flex-col" style={{ backgroundColor: theme.colors.primary }}>
            <section className="relative h-[80vh] flex flex-col items-center justify-center p-6 border-b border-[#e0c097]/10">
                {/* Elegant Pattern */}
                <div className="absolute inset-0 opacity-5"
                     style={{ 
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L100 50 L50 100 L0 50 Z' fill='none' stroke='white' stroke-width='0.5' /%3E%3C/svg%3E")`,
                        backgroundSize: '80px 80px'
                     }}></div>

                <div className="relative z-10 text-center max-w-4xl">
                    <div className="w-16 h-px bg-[#e0c097] mx-auto mb-8" style={{ backgroundColor: theme.colors.secondary }}></div>
                    <span className="text-xs uppercase tracking-[0.5em] mb-4 block font-medium">Cordially Invited</span>
                    <h1 className="text-4xl md:text-7xl font-serif mb-8 italic leading-tight px-4"
                        style={{ fontFamily: theme.fonts.headline, color: theme.colors.secondary }}>
                        {event.headlineTitle || theme.defaultHeadline || "Celebration"}
                    </h1>
                    
                    <div className="flex items-center justify-center gap-12 font-serif italic text-xl md:text-2xl">
                        <span>{formatDate(event.date)}</span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                        <span className="uppercase tracking-widest">{event.location}</span>
                    </div>
                </div>

                <div className="mt-16 w-full max-w-sm aspect-[4/5] relative">
                    <div className="absolute inset-0 border border-[#e0c097]/30 translate-x-4 translate-y-4"></div>
                    <div className="relative h-full w-full overflow-hidden bg-slate-800">
                        {theme.decorations?.heroImage && (
                            <img src={theme.decorations.heroImage} className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 hover:brightness-100 transition-all duration-1000" alt="" />
                        )}
                    </div>
                </div>
            </section>

            <main className="flex-1 py-20">
                <BirthdayContentSections theme={theme} event={event} darkMode={true} backgroundColor="transparent" />
            </main>
            
            <Footer theme={theme} event={event} backgroundColor="transparent" darkMode={true} />
        </div>
    );
}


function IslandParadiseLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.colors.primary }}>
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                {/* Sun and Waves */}
                <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-yellow-200 blur-2xl opacity-40"></div>
                <div className="absolute bottom-0 left-0 w-full h-24 bg-sky-200/20 backdrop-blur-sm"></div>
                
                <div className="relative z-10 text-center px-6">
                    <div className="text-5xl mb-6">🍍🏝️🥥</div>
                    <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter uppercase"
                        style={{ fontFamily: theme.fonts.headline, color: theme.colors.secondary }}>
                        {event.headlineTitle || theme.defaultHeadline || "Aloha!"}
                    </h1>
                    <div className="mt-8 inline-block bg-white/60 backdrop-blur-md px-10 py-4 rounded-full border-2 border-white">
                        <p className="text-2xl font-bold text-slate-800">{formatDate(event.date)}</p>
                        <p className="text-sm uppercase tracking-[0.3em] font-black opacity-40">{event.location}</p>
                    </div>
                </div>

                <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-40">
                    {theme.decorations?.heroImage && (
                        <img src={theme.decorations.heroImage} className="w-full h-full object-cover" alt="" />
                    )}
                </div>
            </section>

            <main className="flex-1 -mt-10 relative z-20">
                <div className="max-w-5xl mx-auto">
                    <BirthdayContentSections theme={theme} event={event} backgroundColor="transparent" />
                </div>
            </main>
            
            <Footer theme={theme} event={event} backgroundColor="transparent" />
        </div>
    );
}

function SafariAdventureLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
    return (
        <div className="min-h-screen bg-[#fdfaf3] flex flex-col" style={{ backgroundColor: theme.colors.primary }}>
            <section className="relative pt-24 pb-12 px-6 flex flex-col items-center">
                {/* Wood Texture Effect */}
                <div className="max-w-4xl w-full bg-[#f4e7d3] p-12 md:p-20 border-[16px] border-[#5d4037] relative shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)' , backgroundSize: '40px 40px'}}></div>
                    
                    <div className="relative z-10 text-center">
                        <span className="text-xs font-black uppercase tracking-[0.6em] text-amber-900 mb-6 block">Jungle Expedition</span>
                        <h1 className="text-6xl md:text-8xl font-black uppercase mb-8 leading-none"
                            style={{ fontFamily: theme.fonts.headline, color: theme.colors.secondary }}>
                            {event.headlineTitle || theme.defaultHeadline || "Wild Safari"}
                        </h1>
                        
                        <div className="flex flex-col items-center gap-2 font-mono text-amber-900">
                            <p className="text-2xl font-bold bg-amber-900 text-amber-100 px-6 py-2">DATE: {formatDate(event.date)}</p>
                            <p className="text-lg font-bold">BASE CAMP: {event.location}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-[-40px] relative z-20 w-64 h-64 md:w-80 md:h-80 rounded-full border-[12px] border-[#5d4037] overflow-hidden shadow-2xl bg-white">
                     {theme.decorations?.heroImage && (
                        <img src={theme.decorations.heroImage} className="w-full h-full object-cover" alt="" />
                     )}
                </div>
            </section>

            <main className="flex-1">
                <BirthdayContentSections theme={theme} event={event} backgroundColor="transparent" />
            </main>
            
            <Footer theme={theme} event={event} backgroundColor="transparent" />
        </div>
    );
}
