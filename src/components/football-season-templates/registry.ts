/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { GymMeetPageTemplateMeta, GymMeetTemplateId } from "./types";

export const DEFAULT_GYM_MEET_TEMPLATE_ID: GymMeetTemplateId = "launchpad-editorial";
export const DEFAULT_NEW_GYM_MEET_TEMPLATE_ID: GymMeetTemplateId = "launchpad-editorial";

export const GYM_MEET_TEMPLATE_LIBRARY: GymMeetPageTemplateMeta[] = [
  {
    id: "launchpad-editorial",
    name: "Kickoff Editorial",
    style: "Editorial / Light Launch",
    description:
      "Sideline football at dawn. Editorial hero composition with coordinated football styling.",
    group: "current",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Kickoff Editorial",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f7f4ee] text-[#202d3c]",
    previewAccentClassName: "text-[#536a7d]",
    titleTypographyId: "playfair",
    previewTitleClassName: "[font-family:'Playfair_Display',Georgia,serif]",
  },
  {
    id: "elite-athlete",
    name: "Elite Athlete",
    style: "Pro Sports / High Contrast",
    description:
      "Player entering a floodlit stadium. Cinematic hero composition with coordinated football styling.",
    group: "current",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Elite Athlete",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#071323] text-[#f0f7ff]",
    previewAccentClassName: "text-[#9ac8ff]",
    titleTypographyId: "anton",
    previewTitleClassName: "font-sans font-black text-blue-700",
  },
  {
    id: "bento-box",
    name: "The Bento Box",
    style: "Modern Modular",
    description:
      "Football equipment arranged on a studio surface. Split hero composition with coordinated football styling.",
    group: "current",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "The Bento Box",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#eeedf7] text-[#292747]",
    previewAccentClassName: "text-[#605486]",
    titleTypographyId: "league-spartan",
    previewTitleClassName: "font-sans font-light uppercase tracking-widest",
  },
  {
    id: "parent-command",
    name: "Team Huddle",
    style: "Utility / Accessible",
    description:
      "A community team huddles with its coach. Split hero composition with coordinated football styling.",
    group: "current",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Team Huddle",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f0f6fd] text-[#18345b]",
    previewAccentClassName: "text-[#335d92]",
    titleTypographyId: "montserrat",
    previewTitleClassName: "tracking-tight",
  },
  {
    id: "varsity-classic",
    name: "Varsity Classic",
    style: "Collegiate / Heritage",
    description:
      "Vintage football and burgundy helmet. Poster hero composition with coordinated football styling.",
    group: "current",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Varsity Classic",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f5eee1] text-[#452424]",
    previewAccentClassName: "text-[#8b363d]",
    titleTypographyId: "cormorant",
    previewTitleClassName: "[font-family:Georgia,'Times_New_Roman',serif]",
  },
  {
    id: "weekend-journey",
    name: "Road to Kickoff",
    style: "Timeline / Chrono",
    description:
      "Players walking toward a stadium in autumn. Editorial hero composition with coordinated football styling.",
    group: "current",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Road to Kickoff",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f3f3e8] text-[#293c30]",
    previewAccentClassName: "text-[#567446]",
    titleTypographyId: "barlow-condensed",
    previewTitleClassName: "[font-family:'Avenir_Next','Segoe_UI',sans-serif]",
  },
  {
    id: "scouting-report",
    name: "Scouting Report",
    style: "Data / Technical",
    description:
      "A coach's clipboard, stopwatch and football. Split hero composition with coordinated football styling.",
    group: "current",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Scouting Report",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#e9edef] text-[#243039]",
    previewAccentClassName: "text-[#4c606c]",
    titleTypographyId: "space-mono",
    previewTitleClassName: "font-mono font-bold uppercase tracking-widest",
  },
  {
    id: "cyber-athlete",
    name: "Cyber Athlete",
    style: "Showcase / Futuristic Arena",
    description:
      "A football helmet in a neon arena. Cinematic hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Cyber Athlete",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#071322] text-[#e0ffff]",
    previewAccentClassName: "text-[#82eafa]",
    titleTypographyId: "orbitron",
    previewTitleClassName:
      "font-sans font-black text-fuchsia-500 [text-shadow:0_0_18px_rgba(217,70,239,0.55)]",
  },
  {
    id: "paper-proto",
    name: "Playbook Sketch",
    style: "Showcase / Draft Board",
    description:
      "Hand-drawn football equipment on sketch paper. Editorial hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Playbook Sketch",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f4f1e9] text-[#30302d]",
    previewAccentClassName: "text-[#6c6156]",
    titleTypographyId: "playfair",
    previewTitleClassName: "italic [font-family:'Playfair_Display',Georgia,serif]",
  },
  {
    id: "sunset-arena",
    name: "Sunset Arena",
    style: "Showcase / Premium Warm Glow",
    description:
      "Goalpost beneath an amber sunset. Cinematic hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Sunset Arena",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#2b1814] text-[#fff1d8]",
    previewAccentClassName: "text-[#ffd291]",
    titleTypographyId: "cormorant",
    previewTitleClassName: "[font-family:Georgia,'Times_New_Roman',serif]",
  },
  {
    id: "pop-art",
    name: "Pop Art",
    style: "Showcase / Graphic Impact",
    description:
      "A pop-art football in flight. Poster hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Pop Art",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#ffe36a] text-[#231e1c]",
    previewAccentClassName: "text-[#962b24]",
    titleTypographyId: "bungee",
    previewTitleClassName: "font-mono font-black text-[#ffcc00] [text-shadow:4px_4px_0px_#000000]",
  },
  {
    id: "swiss-grid",
    name: "Swiss Grid",
    style: "Showcase / Editorial Grid",
    description:
      "Red football helmet on a white plinth. Editorial hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Swiss Grid",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f6f6f3] text-[#171c22]",
    previewAccentClassName: "text-[#b52725]",
    titleTypographyId: "league-spartan",
    previewTitleClassName: "font-sans font-black text-red-600",
  },
  {
    id: "art-deco",
    name: "Art Deco",
    style: "Showcase / Evening Poster",
    description:
      "An art deco football stadium in gold and black. Poster hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Art Deco",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#141a1c] text-[#f7e9bf]",
    previewAccentClassName: "text-[#d6bc76]",
    titleTypographyId: "cormorant",
    previewTitleClassName: "[font-family:Georgia,'Times_New_Roman',serif]",
  },
  {
    id: "concrete-gym",
    name: "Concrete Yard",
    style: "Showcase / Industrial",
    description:
      "Helmet and cleats on concrete stadium steps. Split hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Concrete Yard",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#202224] text-[#f0efeb]",
    previewAccentClassName: "text-[#f5b581]",
    titleTypographyId: "ibm-plex-mono",
    previewTitleClassName: "font-mono font-black italic text-zinc-100",
  },
  {
    id: "midnight-frost",
    name: "Midnight Frost",
    style: "Showcase / Frosted Night",
    description:
      "Football on frosted turf at night. Cinematic hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Midnight Frost",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#11142c] text-[#eef3ff]",
    previewAccentClassName: "text-[#b0c9ff]",
    titleTypographyId: "sora",
    previewTitleClassName: "font-sans font-black",
  },
  {
    id: "eco-motion",
    name: "Grassroots",
    style: "Showcase / Organic Athletic",
    description:
      "Football on a green community field. Editorial hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Grassroots",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#eef3e8] text-[#253b2b]",
    previewAccentClassName: "text-[#4c704b]",
    titleTypographyId: "manrope",
    previewTitleClassName: "[font-family:'Avenir_Next','Gill_Sans',sans-serif]",
  },
  {
    id: "holo-elite",
    name: "Holo Elite",
    style: "Showcase / Bright Tech Premium",
    description:
      "Pearlescent football helmet on a white pedestal. Split hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Holo Elite",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#edf1fa] text-[#303751]",
    previewAccentClassName: "text-[#655a8f]",
    titleTypographyId: "exo2",
    previewTitleClassName: "font-sans font-black text-white drop-shadow-2xl",
  },
  {
    id: "glitch-sport",
    name: "Glitch Sport",
    style: "Showcase / Glitch Arena",
    description:
      "A receiver rendered with red and cyan glitch effects. Poster hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Glitch Sport",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#101115] text-[#f3f6f8]",
    previewAccentClassName: "text-[#8aebf2]",
    titleTypographyId: "ibm-plex-mono",
    previewTitleClassName: "font-mono font-black italic uppercase",
  },
  {
    id: "organic-flow",
    name: "Field & Form",
    style: "Showcase / Organic Premium",
    description:
      "Layered paper football and flowing field shapes. Split hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Field & Form",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#ede9db] text-[#294339]",
    previewAccentClassName: "text-[#4a6450]",
    titleTypographyId: "manrope",
    previewTitleClassName: "font-sans font-black italic text-white",
  },
  {
    id: "pixel-arena",
    name: "Pixel Arena",
    style: "Showcase / Arcade Scoreboard",
    description:
      "An isometric pixel-art football stadium. Poster hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Pixel Arena",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#07180f] text-[#dfffe5]",
    previewAccentClassName: "text-[#8aee92]",
    titleTypographyId: "press-start-2p",
    previewTitleClassName:
      "font-mono font-black uppercase text-[#00ff41] [text-shadow:4px_4px_0px_#14532d]",
  },
  {
    id: "architect-clean",
    name: "Stadium Study",
    style: "Showcase / Structural Minimal",
    description:
      "The geometry of a modern football stadium. Editorial hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Stadium Study",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f0f2f2] text-[#26343a]",
    previewAccentClassName: "text-[#4a6873]",
    titleTypographyId: "manrope",
    previewTitleClassName: "font-sans font-light tracking-tight text-slate-800",
  },
  {
    id: "noir-silhouette",
    name: "Noir Silhouette",
    style: "Showcase / Monochrome Poster",
    description:
      "A player silhouetted in a dark stadium tunnel. Cinematic hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Noir Silhouette",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#121212] text-[#f5f3ef]",
    previewAccentClassName: "text-[#c6c3bd]",
    titleTypographyId: "anton",
    previewTitleClassName: "font-black tracking-tighter text-white",
  },
  {
    id: "vaporwave-grid",
    name: "Vaporwave Grid",
    style: "Showcase / Neon Vapor",
    description:
      "A football above a neon grid field. Poster hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Vaporwave Grid",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#231333] text-[#fbebff]",
    previewAccentClassName: "text-[#f6b4e9]",
    titleTypographyId: "audiowide",
    previewTitleClassName: "font-mono font-black text-pink-400 [text-shadow:4px_4px_0px_#ff00ff]",
  },
  {
    id: "heavy-impact",
    name: "Heavy Impact",
    style: "Showcase / Poster Impact",
    description:
      "A lineman in yellow and charcoal poster art. Poster hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Heavy Impact",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f5ca3c] text-[#252214]",
    previewAccentClassName: "text-[#514619]",
    titleTypographyId: "anton",
    previewTitleClassName: "font-black text-yellow-400",
  },
  {
    id: "blueprint-tech",
    name: "Tech Blueprint",
    style: "Showcase / Technical Blueprint",
    description:
      "A football stadium drawn as a cobalt blueprint. Editorial hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Tech Blueprint",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#103866] text-[#eff9ff]",
    previewAccentClassName: "text-[#b4defc]",
    titleTypographyId: "ibm-plex-mono",
    previewTitleClassName: "font-mono font-light uppercase text-white border-b-2",
  },
  {
    id: "toxic-kinetic",
    name: "Neon Rush",
    style: "Showcase / Acid Arena",
    description:
      "A running back sprinting through lime stadium light. Cinematic hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Neon Rush",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#111a0c] text-[#efffc9]",
    previewAccentClassName: "text-[#c0f278]",
    titleTypographyId: "kanit",
    previewTitleClassName: "font-sans font-black italic uppercase text-lime-400 [-skew-x-6]",
  },
  {
    id: "luxe-magazine",
    name: "Luxe Editorial",
    style: "Showcase / Editorial Luxe",
    description:
      "A vintage football on a stone pedestal. Editorial hero composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Luxe Editorial",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f4f1ec] text-[#302b27]",
    previewAccentClassName: "text-[#786654]",
    titleTypographyId: "cormorant",
    previewTitleClassName: "font-serif font-thin tracking-[1em] text-black",
  },
  {
    id: "chalk-strike",
    name: "Chalkboard Coach",
    style: "Bold / Arena Neon",
    description:
      "A chalk football helmet and tactical routes. Split hero composition with coordinated football styling.",
    group: "bold",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Chalkboard Coach",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#1c2528] text-[#f7f2ed]",
    previewAccentClassName: "text-[#f3b6cf]",
    titleTypographyId: "space-mono",
    previewTitleClassName: "font-black uppercase tracking-tighter",
  },
  {
    id: "podium-lights",
    name: "Championship Lights",
    style: "Premium / Spotlight",
    description:
      "A football trophy under championship spotlights. Cinematic hero composition with coordinated football styling.",
    group: "bold",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Championship Lights",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#101d32] text-[#fff3d1]",
    previewAccentClassName: "text-[#e3c079]",
    titleTypographyId: "oswald",
    previewTitleClassName: "font-sans font-black text-amber-600",
  },
  {
    id: "judges-sheet",
    name: "Coach's Notebook",
    style: "Technical / Paper Trail",
    description:
      "A football coach's notebook and whistle. Editorial hero composition with coordinated football styling.",
    group: "classic",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Coach's Notebook",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f2ebdf] text-[#463730]",
    previewAccentClassName: "text-[#854547]",
    titleTypographyId: "space-mono",
    previewTitleClassName: "font-mono font-bold uppercase tracking-widest",
  },
  {
    id: "spring-energy",
    name: "Spring Scrimmage",
    style: "Youth Club / Bright",
    description:
      "Illustrated players practicing a spring pass. Split hero composition with coordinated football styling.",
    group: "bold",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Spring Scrimmage",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#eef6ee] text-[#244854]",
    previewAccentClassName: "text-[#a13847]",
    titleTypographyId: "poppins",
    previewTitleClassName: "[font-family:'Trebuchet_MS','Avenir_Next',sans-serif]",
  },
  {
    id: "club-classic",
    name: "Booster Club",
    style: "Booster Club / Structured",
    description:
      "Team helmets beneath navy and crimson pennants. Poster hero composition with coordinated football styling.",
    group: "classic",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Booster Club",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f1eee6] text-[#263c59]",
    previewAccentClassName: "text-[#913e43]",
    titleTypographyId: "barlow-condensed",
    previewTitleClassName: "font-sans font-black italic text-orange-900",
  },
  {
    id: "aurora-lift",
    name: "Northern Lights",
    style: "Modern / Luminous",
    description:
      "A football field under the northern lights. Cinematic hero composition with coordinated football styling.",
    group: "bold",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Northern Lights",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#092d35] text-[#e5fff5]",
    previewAccentClassName: "text-[#9ee1c8]",
    titleTypographyId: "exo2",
    previewTitleClassName: "font-sans font-black text-cyan-400",
  },
  {
    id: "ribbon-editorial",
    name: "Sideline Stories",
    style: "Editorial / Magazine",
    description:
      "A football captain pauses on the sideline. Editorial hero composition with coordinated football styling.",
    group: "editorial",
    layoutFamily: "editorial",
    thumbnailMode: "rendered-card",
    previewTitle: "Sideline Stories",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f7ede8] text-[#543637]",
    previewAccentClassName: "text-[#965b66]",
    titleTypographyId: "cormorant",
    previewTitleClassName: "font-serif font-light lowercase tracking-[-0.05em]",
  },
  {
    id: "medal-poster",
    name: "Victory Poster",
    style: "Editorial / Poster Stack",
    description:
      "A raised football in vintage victory poster art. Poster hero composition with coordinated football styling.",
    group: "editorial",
    layoutFamily: "editorial",
    thumbnailMode: "rendered-card",
    previewTitle: "Victory Poster",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#562719] text-[#fff2d7]",
    previewAccentClassName: "text-[#ffd193]",
    titleTypographyId: "kanit",
    previewTitleClassName:
      "font-black italic tracking-[-0.1em] text-[#fff4d6] drop-shadow-[0_2px_10px_rgba(17,24,39,0.24)]",
  },
  {
    id: "vault-grid",
    name: "End Zone Grid",
    style: "Dashboard / Dense",
    description:
      "Aerial view of a football end zone and training cones. Split hero composition with coordinated football styling.",
    group: "dashboard",
    layoutFamily: "dashboard",
    thumbnailMode: "rendered-card",
    previewTitle: "End Zone Grid",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#eceefa] text-[#2c3866]",
    previewAccentClassName: "text-[#526399]",
    titleTypographyId: "league-spartan",
    previewTitleClassName: "[font-family:'Arial_Black','Avenir_Next',sans-serif]",
  },
  {
    id: "travel-briefing",
    name: "Away Game",
    style: "Dashboard / Logistics",
    description:
      "Football travel gear beside a team bus window. Editorial hero composition with coordinated football styling.",
    group: "dashboard",
    layoutFamily: "dashboard",
    thumbnailMode: "rendered-card",
    previewTitle: "Away Game",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#edf1e3] text-[#314837]",
    previewAccentClassName: "text-[#586943]",
    titleTypographyId: "barlow-condensed",
    previewTitleClassName:
      "uppercase [font-family:'Franklin_Gothic_Medium','Arial_Narrow',sans-serif]",
  },
  {
    id: "friday-night",
    name: "Friday Night",
    style: "Friday Night / Floodlit",
    description:
      "Helmet and football at a floodlit Friday-night stadium. Cinematic composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Friday Night",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#101923] text-[#edf7ff]",
    previewAccentClassName: "text-[#a9d8ef]",
    titleTypographyId: "anton",
  },
  {
    id: "coastal-kickoff",
    name: "Coastal Kickoff",
    style: "Coastal / Watercolor",
    description:
      "Watercolor helmet and football beside a coastal field. Editorial composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Coastal Kickoff",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#e8f3ee] text-[#234b49]",
    previewAccentClassName: "text-[#397166]",
    titleTypographyId: "cormorant",
  },
  {
    id: "desert-gridiron",
    name: "Desert Gridiron",
    style: "Regional / Desert",
    description:
      "Desert football stadium framed by terracotta mesas. Poster composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Desert Gridiron",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f3e3d4] text-[#542e24]",
    previewAccentClassName: "text-[#984627]",
    titleTypographyId: "barlow-condensed",
  },
  {
    id: "mountain-league",
    name: "Mountain League",
    style: "Regional / Alpine",
    description:
      "An alpine football field among evergreen mountains. Editorial composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Mountain League",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#e7efe9] text-[#263f37]",
    previewAccentClassName: "text-[#456e53]",
    titleTypographyId: "manrope",
  },
  {
    id: "homecoming",
    name: "Homecoming",
    style: "Tradition / Homecoming",
    description:
      "Burgundy football helmet beneath homecoming pennants. Poster composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Homecoming",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f6e9e3] text-[#5b2b3d]",
    previewAccentClassName: "text-[#973d58]",
    titleTypographyId: "playfair",
  },
  {
    id: "rain-game",
    name: "Rain Game",
    style: "Weather / Rain",
    description:
      "Rain falling on a football beneath blue stadium lights. Cinematic composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Rain Game",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#0b2231] text-[#e1f6ff]",
    previewAccentClassName: "text-[#8fddf5]",
    titleTypographyId: "oswald",
  },
  {
    id: "snow-bowl",
    name: "Snow Bowl",
    style: "Weather / Winter",
    description:
      "Orange helmet and football in fresh winter snow. Split composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Snow Bowl",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#e7f1f7] text-[#29455f]",
    previewAccentClassName: "text-[#4e6985]",
    titleTypographyId: "sora",
  },
  {
    id: "red-zone",
    name: "Red Zone",
    style: "Graphic / Red",
    description:
      "A red football floating above graphic field lines. Poster composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Red Zone",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#8d1e29] text-[#fff3e7]",
    previewAccentClassName: "text-[#ffc394]",
    titleTypographyId: "bungee",
  },
  {
    id: "leather-linen",
    name: "Leather & Linen",
    style: "Editorial / Tactile",
    description:
      "A worn football on natural linen in warm window light. Editorial composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Leather & Linen",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#eee6dc] text-[#4c3d31]",
    previewAccentClassName: "text-[#786044]",
    titleTypographyId: "cormorant",
  },
  {
    id: "chrome-league",
    name: "Chrome League",
    style: "Modern / Chrome",
    description:
      "Chrome football helmet on a cobalt plinth. Split composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Chrome League",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#e4eaf1] text-[#273b58]",
    previewAccentClassName: "text-[#4a6585]",
    titleTypographyId: "exo2",
  },
  {
    id: "saturday-morning",
    name: "Saturday Morning",
    style: "Community / Youth",
    description:
      "Children playing flag football in a sunny park. Split composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Saturday Morning",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#fff0c9] text-[#594522]",
    previewAccentClassName: "text-[#926520]",
    titleTypographyId: "poppins",
  },
  {
    id: "womens-gridiron",
    name: "Women's Gridiron",
    style: "Athlete / Women's Football",
    description:
      "A woman quarterback preparing a pass under violet lights. Cinematic composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Women's Gridiron",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#291d38] text-[#faf0ff]",
    previewAccentClassName: "text-[#e4afea]",
    titleTypographyId: "league-spartan",
  },
  {
    id: "pep-rally",
    name: "Pep Rally",
    style: "Spirit / Pep Rally",
    description:
      "Purple football helmet surrounded by pep-rally streamers. Poster composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Pep Rally",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#ede3f4] text-[#50315e]",
    previewAccentClassName: "text-[#79508e]",
    titleTypographyId: "kanit",
  },
  {
    id: "captains-band",
    name: "Captain's Band",
    style: "Athlete / Captain",
    description:
      "A captain holding a football in olive practice gear. Editorial composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Captain's Band",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#e8ebda] text-[#38432a]",
    previewAccentClassName: "text-[#5d6937]",
    titleTypographyId: "montserrat",
  },
  {
    id: "overtime",
    name: "Overtime",
    style: "Game Day / Overtime",
    description:
      "A stadium clock and football in an amber spotlight. Cinematic composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Overtime",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#211c12] text-[#fff5d6]",
    previewAccentClassName: "text-[#eacd8e]",
    titleTypographyId: "space-mono",
  },
  {
    id: "tailgate-social",
    name: "Tailgate Social",
    style: "Community / Tailgate",
    description:
      "Football and a coral cooler at a sunny tailgate. Split composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Tailgate Social",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f7e2d9] text-[#603d39]",
    previewAccentClassName: "text-[#914c43]",
    titleTypographyId: "manrope",
  },
  {
    id: "bandstand",
    name: "Bandstand",
    style: "Tradition / Marching Band",
    description:
      "Brass instrument and marching drum beside a football helmet. Poster composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Bandstand",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#182833] text-[#fff5df]",
    previewAccentClassName: "text-[#edc57e]",
    titleTypographyId: "oswald",
  },
  {
    id: "goal-line",
    name: "Goal Line",
    style: "Field / Close-up",
    description:
      "White cleats and a football at the goal line. Split composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Goal Line",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#dfefe5] text-[#20452d]",
    previewAccentClassName: "text-[#396f4b]",
    titleTypographyId: "barlow-condensed",
  },
  {
    id: "retro-broadcast",
    name: "Retro Broadcast",
    style: "Retro / Broadcast",
    description:
      "Vintage television and football in a retro living room. Poster composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Retro Broadcast",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#f3e1c8] text-[#654028]",
    previewAccentClassName: "text-[#885426]",
    titleTypographyId: "audiowide",
  },
  {
    id: "rivalry-week",
    name: "Rivalry Week",
    style: "Game Day / Rivalry",
    description:
      "Red and navy football helmets facing each other. Cinematic composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Rivalry Week",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#201a27] text-[#fff0eb]",
    previewAccentClassName: "text-[#f2b4a7]",
    titleTypographyId: "anton",
  },
  {
    id: "city-league",
    name: "City League",
    style: "Regional / Urban",
    description:
      "A neighborhood football field beneath a city skyline. Editorial composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "City League",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#e7e9eb] text-[#354452]",
    previewAccentClassName: "text-[#716050]",
    titleTypographyId: "league-spartan",
  },
  {
    id: "sunday-ink",
    name: "Sunday Ink",
    style: "Illustrated / Linocut",
    description:
      "Indigo linocut illustration of a quarterback passing. Editorial composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Sunday Ink",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#e6edf4] text-[#243f61]",
    previewAccentClassName: "text-[#41668e]",
    titleTypographyId: "playfair",
  },
  {
    id: "pennant-club",
    name: "Pennant Club",
    style: "Graphic / Paper Craft",
    description:
      "Crafted football with colorful felt and paper pennants. Poster composition with coordinated football styling.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Pennant Club",
    previewKicker: "Football season",
    previewClassName: "min-h-screen bg-[#dff1ef] text-[#254d4a]",
    previewAccentClassName: "text-[#3e7065]",
    titleTypographyId: "bungee",
  },
];

export const isGymMeetTemplateId = (value: unknown): value is GymMeetTemplateId =>
  typeof value === "string" && GYM_MEET_TEMPLATE_LIBRARY.some((template) => template.id === value);

export const getGymMeetTemplateMeta = (value: unknown): GymMeetPageTemplateMeta =>
  GYM_MEET_TEMPLATE_LIBRARY.find((template) => template.id === value) ||
  GYM_MEET_TEMPLATE_LIBRARY[0];

const normalizeHex = (value: unknown): string => {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  return /^#[0-9a-f]{6}$/i.test(text) ? text : "";
};

const luminance = (value: string) => {
  if (!value) return 0.5;
  const normalized = value.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const channel = (n: number) => {
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const trimmed = (value: unknown) => (typeof value === "string" ? value.trim().toLowerCase() : "");

export const resolveGymMeetTemplateId = (data: any): GymMeetTemplateId => {
  const explicit = data?.pageTemplateId;
  if (explicit === "session-companion" || explicit === "meet-app-shell") {
    return DEFAULT_GYM_MEET_TEMPLATE_ID;
  }
  if (isGymMeetTemplateId(explicit)) return explicit;

  const themeId = trimmed(data?.themeId || data?.theme?.id || data?.theme?.themeId);
  const fontId = trimmed(data?.fontId);
  const titleFont = trimmed(data?.designTokens?.titleFont);
  const backgroundColor = normalizeHex(data?.designTokens?.bg);
  const surfaceColor = normalizeHex(data?.designTokens?.surface);
  const primaryColor = normalizeHex(data?.designTokens?.primary);
  const lightBackground =
    (backgroundColor && luminance(backgroundColor) > 0.82) ||
    (surfaceColor && luminance(surfaceColor) > 0.82);
  const darkBackground =
    (backgroundColor && luminance(backgroundColor) < 0.26) ||
    /night|dark|electric|impact|edge|cosmic|turbo|elite|spark|flash|neon|galaxy|aqua/.test(themeId);

  if (
    /playfair|cormorant|serif/.test(fontId) ||
    /playfair|cormorant|serif/.test(titleFont) ||
    /classic|regal|gold|heritage/.test(themeId)
  ) {
    return "varsity-classic";
  }

  if (
    /orbitron|syncopate|chakra|rajdhani|mono|technical|report|scout/.test(fontId) ||
    /mono|sfmono|menlo|technical/.test(titleFont) ||
    /report|technical|data/.test(themeId)
  ) {
    return "scouting-report";
  }

  if (
    /weekend|journey|travel|timeline/.test(themeId) ||
    (Array.isArray(data?.advancedSections?.practice?.blocks) &&
      data.advancedSections.practice.blocks.length > 2 &&
      Boolean(data?.advancedSections?.logistics))
  ) {
    return "weekend-journey";
  }

  if (
    /parent|command|utility|accessible/.test(themeId) ||
    (lightBackground &&
      (backgroundColor === "#eff6ff" ||
        backgroundColor === "#dbeafe" ||
        primaryColor === "#2563eb" ||
        primaryColor === "#1d4ed8"))
  ) {
    return "parent-command";
  }

  if (/bento|mint|lavender|aerial|glitter/.test(themeId)) {
    return "bento-box";
  }

  if (lightBackground) return DEFAULT_GYM_MEET_TEMPLATE_ID;

  if (darkBackground) return "elite-athlete";

  return DEFAULT_GYM_MEET_TEMPLATE_ID;
};
