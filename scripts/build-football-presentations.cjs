/*
 * Art direction source for all football content surfaces. Run with Node after
 * editing a recipe. The emitted CSS ships with the app, without SVG backgrounds.
 * Palettes come from the design catalog; geometry is explicitly authored here.
 */
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { execFileSync } = require("node:child_process");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const dir = path.join(root, "src/components/football-season-templates");
const loadTs = (name) => {
  const file = path.join(dir, name);
  const mod = new Module(file, module);
  mod.paths = Module._nodeModulePaths(dir);
  mod._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    file,
  );
  return mod.exports;
};
const { FOOTBALL_DESIGNS: designs } = loadTs("footballDesigns.ts");
const { GYM_MEET_TEMPLATE_LIBRARY: registry } = loadTs("registry.ts");
const recipes = [];
const add = (id, concept, rules) => recipes.push({ id, concept, rules });
// Tokens keep the geometric recipes legible; they do not choose a layout.
// A accent, I ink, L fine line, W light wash, P paper, G canvas.
const expand = (css) =>
  css.replace(
    /\$([AILWPG])/g,
    (_, token) =>
      `var(--ft-${{ A: "accent", I: "ink", L: "line", W: "wash", P: "paper", G: "ground" }[token]})`,
  );

add("launchpad-editorial", "Newspaper spread · masthead rules, folio columns, open cards", {
  section:
    "--ft-columns:minmax(150px,.7fr) minmax(0,2fr);border-top:5px solid $I;border-bottom:1px solid $I;",
  sectionHeader: "border-right:1px solid $L;",
  sectionTitle: "font-size:clamp(32px,5cqi,54px);",
  sectionBody: "padding-top:28px;",
  card: "border:0;border-top:1px solid $I;padding-inline:0;background:transparent;",
  navigation: "border-block:1px solid $I;background:transparent;",
  activeTab: "color:$I;background:transparent;border-bottom:3px solid;",
});
add("elite-athlete", "Reinforced equipment · speed stripe, cut-corner plates", {
  section: "border-left:8px solid $A;border-radius:0 32px 0 0;box-shadow:inset 0 1px $L;",
  sectionHeader:
    "border-bottom:1px solid $L;background:linear-gradient(115deg,transparent 82%,$L 82% 85%,transparent 85% 88%,$L 88% 91%,transparent 91%);",
  sectionTitle: "text-transform:uppercase;font-style:italic;font-size:clamp(34px,5cqi,58px);",
  card: "border:0;border-left:3px solid $A;border-radius:0 20px 0 0;",
  navigation: "border-left:8px solid $A;",
  activeTab: "border-radius:0 14px 0 0;font-style:italic;",
});
add("bento-box", "Bento compartments · cushioned title tile and interlocking modules", {
  section: "--ft-columns:minmax(170px,.8fr) minmax(0,2fr);gap:10px;background:transparent;",
  sectionHeader: "align-items:center;border-radius:28px 8px 28px 28px;background:$W;",
  sectionTitle: "letter-spacing:-.06em;",
  sectionBody: "border-radius:8px 28px 28px 28px;padding:28px;background:$P;",
  card: "border:0;border-radius:22px;box-shadow:0 5px 0 $L;",
  navigation: "border-radius:24px;",
  activeTab: "border-radius:18px;",
});
add("parent-command", "Team command board · labeled rail and recessed task compartments", {
  section: "border:1px solid $L;border-radius:14px;border-top:0;",
  sectionHeader: "border-top:6px solid $A;border-radius:14px 14px 0 0;background:$W;",
  headingGroup: "display:flex;flex-direction:column-reverse;gap:8px;",
  sectionTitle: "font-size:27px;letter-spacing:-.04em;",
  card: "border:0;border-radius:6px;box-shadow:inset 4px 0 $L;padding-left:26px;",
  navigation: "border-radius:10px;box-shadow:inset 0 -3px $L;",
  activeTab: "border-radius:6px;border-bottom:3px solid $A;",
});
add("varsity-classic", "Varsity stationery · double frame, centered crest, ruled labels", {
  section: "border:5px double $A;",
  sectionHeader:
    "justify-content:center;text-align:center;border-bottom:3px double $L;margin:10px 18px 0;",
  eyebrow: "letter-spacing:.35em;",
  sectionTitle: "text-transform:uppercase;letter-spacing:.08em;",
  card: "border:0;border-block:3px double $L;background:transparent;",
  navigation: "border-block:4px double $A;",
  activeTab: "background:transparent;color:$I;text-decoration:underline;text-underline-offset:8px;",
});
add("weekend-journey", "Road itinerary · route rail, stop markers, tear-off tickets", {
  section:
    "--ft-columns:minmax(150px,.6fr) minmax(0,2fr);border-left:2px dashed $A;margin-left:10px;",
  sectionHeader: "border-right:1px dashed $L;",
  sectionTitle: "text-transform:uppercase;font-size:38px;",
  sectionBody: "padding-top:28px;",
  card: "border:0;border-right:3px dashed $A;box-shadow:0 4px 10px $L;",
  navigation: "border-bottom:2px dashed $A;",
  activeTab: "border-radius:22px 22px 22px 2px;",
});
add("scouting-report", "Scouting file · index strip and monospaced record forms", {
  section: "border:1px solid $I;border-top-width:12px;",
  sectionHeader: "border-bottom:1px solid $I;padding-block:14px;",
  headingGroup: "display:flex;flex-wrap:wrap;align-items:baseline;gap:12px 28px;",
  sectionTitle: "font-size:26px;text-transform:uppercase;",
  card: "background:transparent;border:1px solid $I;box-shadow:3px 3px 0 $L;",
  navigation: "border:1px solid $I;padding:0;",
  activeTab: "border-bottom:4px solid $A;",
});
add("cyber-athlete", "Cyber instrument · corner brackets and separated readout channels", {
  section: "border:1px solid $L;border-right:5px solid $A;",
  sectionHeader: "margin:12px;padding:20px 16px;border-bottom:1px dashed $A;",
  sectionTitle: "letter-spacing:.06em;text-transform:uppercase;",
  card: "border:0;box-shadow:inset 0 2px $A,inset 0 -1px $L;",
  navigation: "border:1px solid $A;border-inline-width:5px;",
  activeTab: "box-shadow:inset 0 -4px $A;",
});
add("paper-proto", "Pencil playbook · hand-drawn edges and notebook margin", {
  section: "border:2px solid $I;border-radius:3px 8px 4px 12px;box-shadow:5px 5px 0 $L;",
  sectionHeader: "border-bottom:2px dashed $L;margin-inline:20px;padding-inline:8px;",
  sectionTitle: "font-style:italic;",
  sectionBody: "border-left:2px solid $L;margin-left:27px;padding-left:20px;",
  card: "border:1px dashed $I;border-radius:6px 2px 12px 3px;background:transparent;",
  navigation: "border-bottom:2px solid $I;background:transparent;",
  activeTab: "border-radius:45% 4px 40% 6px;",
});
add("sunset-arena", "Sunset terraces · stepped horizon and low information bands", {
  section: "border-radius:70px 70px 8px 8px;border-top:12px solid $A;box-shadow:inset 0 8px $L;",
  sectionHeader: "text-align:center;justify-content:center;padding-top:38px;",
  sectionTitle: "letter-spacing:-.04em;",
  card: "border:0;border-radius:20px 20px 2px 2px;border-bottom:4px solid $A;",
  navigation: "border-radius:32px 32px 0 0;border-bottom:3px solid $A;",
  activeTab: "border-radius:24px 24px 0 0;",
});
add("pop-art", "Comic panel · speech balloon heading, ink offset, halftone dots", {
  section: "border:3px solid $I;box-shadow:8px 8px 0 $A;margin:0 8px 8px 0;",
  sectionHeader:
    "background-image:radial-gradient($L 1.5px,transparent 1.5px);background-size:9px 9px;",
  headingGroup:
    "background:$P;border:3px solid $I;border-radius:40px 40px 40px 4px;padding:16px 24px;",
  sectionTitle: "text-transform:uppercase;",
  card: "border:2px solid $I;box-shadow:4px 4px 0 $I;",
  navigation: "border:3px solid $I;",
  activeTab: "border-radius:50%;box-shadow:3px 3px 0 $A;",
});
add("swiss-grid", "Swiss grid · asymmetric type, registration lines, open matrix", {
  section:
    "--ft-columns:minmax(140px,1fr) minmax(0,3fr);background:transparent;border-top:2px solid $I;",
  sectionHeader: "border-right:1px solid $I;padding-left:0;",
  sectionTitle: "font-size:46px;letter-spacing:-.075em;",
  sectionBody: "padding-top:28px;padding-right:0;",
  cards: "gap:0;",
  card: "border:0;border-left:1px solid $L;border-top:1px solid $L;background:transparent;",
  navigation: "background:transparent;border-bottom:1px solid $I;",
  activeTab: "padding-left:30px;box-shadow:inset 8px 0 $A;",
});
add("art-deco", "Deco invitation · nested gilt lines and stepped central plaque", {
  section: "border:1px solid $A;outline:1px solid $L;outline-offset:-8px;padding:12px;",
  sectionHeader: "justify-content:center;text-align:center;",
  headingGroup: "border-inline:4px double $A;padding:8px 24px;",
  sectionTitle: "text-transform:uppercase;letter-spacing:.16em;font-size:clamp(24px,3cqi,36px);",
  card: "border:1px solid $A;border-top:5px double $A;background:transparent;",
  navigation: "border-block:4px double $A;border-inline:1px solid $A;",
  activeTab:
    "background:transparent;color:$I;border:1px solid $A;box-shadow:inset 0 0 0 3px $P,inset 0 0 0 4px $A;",
});
add("concrete-gym", "Cast concrete · heavy base, recessed seams, slab labels", {
  section: "border:1px solid $L;border-bottom:12px solid $A;box-shadow:6px 6px 0 $L;",
  sectionHeader: "border-bottom:4px solid $L;padding-block:20px;",
  eyebrow: "padding-left:14px;border-left:18px solid $A;",
  sectionTitle: "text-transform:uppercase;font-size:48px;",
  card: "border:0;box-shadow:inset 3px 3px 0 $L;",
  navigation: "border-bottom:8px solid $A;",
  activeTab: "border:2px solid $I;background:transparent;color:$I;",
});
add("midnight-frost", "Frost panes · crystalline edges and translucent inset frames", {
  section:
    "border:1px solid $L;border-radius:2px 36px 2px 36px;box-shadow:inset 0 0 0 7px $W,0 12px 30px $L;",
  sectionHeader: "margin:10px 20px;border-bottom:1px solid $A;",
  sectionTitle: "letter-spacing:.12em;font-size:30px;",
  card: "border-radius:2px 18px 2px 18px;border:1px solid $L;box-shadow:inset 0 1px $A;",
  navigation: "border:1px solid $L;border-radius:2px 22px;",
  activeTab: "border-radius:2px 16px;",
});
add("eco-motion", "Grassroots field · seedbed curves and grass-marked title rail", {
  section:
    "--ft-columns:minmax(150px,.7fr) minmax(0,2fr);border-radius:8px 52px 8px 8px;border-bottom:4px solid $A;",
  sectionHeader:
    "border-right:1px dashed $L;background:linear-gradient(0deg,$W 12px,transparent 12px);",
  sectionTitle: "font-size:34px;line-height:1.2;",
  sectionBody: "padding-top:28px;",
  card: "border:0;border-radius:24px 4px 24px 4px;border-left:3px solid $A;",
  navigation: "border-radius:8px 30px 8px 8px;",
  activeTab: "border-radius:18px 3px 18px 3px;",
});
add("holo-elite", "Holographic display · floating windows and prismatic folds", {
  section:
    "border:2px solid $A;border-radius:28px;box-shadow:7px 7px 0 $L,-5px -5px 0 $W;margin:5px 7px 7px 5px;",
  sectionHeader:
    "justify-content:center;text-align:center;margin:12px;border-radius:16px;background:$W;",
  sectionTitle: "letter-spacing:-.04em;",
  card: "border-radius:16px 16px 3px 16px;border:1px solid $A;box-shadow:3px 3px 0 $L;",
  navigation: "border-radius:30px;border:2px solid $L;",
  activeTab: "border-radius:30px;box-shadow:3px 3px 0 $A;",
});
add("glitch-sport", "Broadcast interference · interrupted rules and offset blocks", {
  section: "border-left:5px solid $A;border-bottom:2px solid $I;box-shadow:7px -5px 0 -3px $L;",
  sectionHeader: "background:repeating-linear-gradient(0deg,transparent 0 8px,$W 8px 10px);",
  sectionTitle:
    "text-transform:uppercase;letter-spacing:-.065em;text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:8px;",
  card: "border:0;border-top:3px solid $A;box-shadow:-5px 5px 0 $L;",
  navigation: "border-block:2px dashed $A;",
  activeTab: "box-shadow:4px -3px 0 $L;",
});
add("organic-flow", "Contour landscape · asymmetric panel and pebble cards", {
  section: "border-radius:50px 8px 50px 8px;border:1px solid $L;",
  sectionHeader: "padding-top:36px;padding-left:36px;",
  sectionTitle: "font-style:italic;font-weight:500;font-size:44px;",
  sectionBody: "padding-inline:36px;",
  card: "border:0;border-radius:30px 8px 24px 8px;border-bottom:2px solid $L;",
  navigation: "border-radius:30px 5px;border-bottom:2px solid $L;",
  activeTab: "border-radius:22px 6px 22px 6px;",
});
add("pixel-arena", "Arcade cartridge · pixel frame, scanline masthead, inset buttons", {
  section: "border:4px solid $I;box-shadow:6px 0 $A,-6px 0 $A,0 6px $A,0 -6px $A;margin:6px;",
  sectionHeader:
    "border-bottom:4px solid $I;background:repeating-linear-gradient(0deg,$P 0 3px,$W 3px 6px);",
  sectionTitle: "font-size:clamp(18px,2.5cqi,26px);line-height:1.6;",
  card: "border:3px solid $L;box-shadow:inset -4px -4px $L;",
  navigation: "border:4px solid $A;padding:0;",
  activeTab: "box-shadow:inset -4px -4px $L;font-size:10px;",
  idleTab: "font-size:10px;",
});
add("architect-clean", "Architectural study · datum rail and registration crosshairs", {
  section: "--ft-columns:minmax(160px,.8fr) minmax(0,2fr);border:1px solid $L;",
  sectionHeader: "border-right:1px solid $L;padding-left:36px;",
  sectionTitle: "font-size:31px;font-weight:500;",
  sectionBody: "padding-top:28px;",
  card: "background:transparent;border:1px solid $L;outline:1px solid $L;outline-offset:-6px;",
  navigation: "border:1px solid $L;background:transparent;padding:0;",
  activeTab: "color:$I;background:transparent;border-inline:1px solid;border-bottom:2px solid;",
});
add("noir-silhouette", "Noir title sequence · negative space and luminous side rule", {
  section: "background:transparent;border-left:1px solid $A;",
  sectionHeader: "padding:40px 34px 24px;",
  eyebrow: "letter-spacing:.45em;",
  sectionTitle: "font-size:clamp(38px,6cqi,68px);font-weight:400;text-transform:uppercase;",
  sectionBody: "padding-left:34px;",
  card: "background:transparent;border:0;border-left:1px solid $L;padding:8px 20px 24px;",
  navigation: "background:transparent;",
  activeTab: "background:transparent;color:$I;border-left:2px solid $A;letter-spacing:.12em;",
});
add("vaporwave-grid", "Retro horizon · neon grid edge and floating window tabs", {
  section: "border:2px solid $A;border-bottom-width:9px;box-shadow:0 8px 0 $L;",
  sectionHeader: "justify-content:center;text-align:center;border-bottom:1px solid $L;",
  headingGroup: "background:$P;padding:12px 24px;border:1px solid $L;",
  card: "border:1px solid $A;box-shadow:5px 5px 0 $L;border-radius:10px 10px 0 0;",
  navigation: "border:2px solid $A;padding-bottom:0;",
  activeTab: "border-radius:12px 12px 0 0;border-top:3px solid $A;",
});
add("heavy-impact", "Impact poster · massive type slab and bolted blocks", {
  section: "border:4px solid $I;border-left-width:16px;",
  sectionHeader: "border-bottom:8px solid $A;",
  sectionTitle: "text-transform:uppercase;font-size:clamp(42px,7cqi,76px);line-height:.98;",
  card: "border:3px solid $I;border-bottom-width:8px;",
  navigation: "border:3px solid $I;padding:0;",
  activeTab: "text-transform:uppercase;font-size:17px;border-right:6px solid $A;",
});
add("blueprint-tech", "Technical blueprint · dimension grid and dashed planning frames", {
  section: "border:1px solid $A;padding:10px;",
  sectionHeader: "border:1px dashed $A;margin:8px;padding:16px;",
  headingGroup: "display:flex;flex-wrap:wrap;align-items:baseline;gap:12px 30px;",
  sectionTitle: "font-size:28px;",
  card: "border:1px dashed $A;background:$P;box-shadow:5px 5px 0 -4px $A;",
  navigation: "border:1px dashed $A;",
  activeTab: "border:1px solid $A;background:$W;color:$I;",
});
add("toxic-kinetic", "Kinetic warning panel · diagonal edge marks and sharp tags", {
  section: "border:2px solid $A;border-left:14px solid $A;",
  sectionHeader: "background:repeating-linear-gradient(125deg,transparent 0 16px,$W 16px 32px);",
  eyebrow: "display:inline-block;border-bottom:4px solid $A;",
  sectionTitle: "text-transform:uppercase;font-style:italic;letter-spacing:-.05em;",
  card: "border:0;border-top:2px solid $A;border-right:6px solid $A;",
  navigation: "border-left:14px solid $A;padding:0;",
  activeTab: "font-style:italic;box-shadow:inset -6px 0 $A;",
});
add("luxe-magazine", "Luxury magazine · oversized italic type and hairline columns", {
  section:
    "--ft-columns:minmax(180px,1fr) minmax(0,1.7fr);background:transparent;border-block:1px solid $A;",
  sectionHeader: "padding:36px 24px;",
  eyebrow: "letter-spacing:.32em;font-weight:400;",
  sectionTitle: "font-size:clamp(40px,6cqi,64px);font-weight:400;font-style:italic;",
  sectionBody: "border-left:1px solid $L;padding-top:36px;",
  card: "border:0;border-bottom:1px solid $A;background:transparent;padding-inline:0;",
  navigation: "background:transparent;border-bottom:1px solid $A;padding-block:16px;",
  activeTab: "color:$I;background:transparent;font-style:italic;font-size:20px;",
});
add("chalk-strike", "Chalkboard coach · chalk rails and sketched play boxes", {
  section: "border:7px solid $L;outline:1px dashed $A;outline-offset:-14px;",
  sectionHeader: "margin:10px 12px;border-bottom:2px dashed $A;",
  sectionTitle: "text-transform:uppercase;letter-spacing:.06em;",
  card: "border:2px dashed $L;border-radius:5px 12px 3px 8px;background:transparent;",
  navigation: "border-bottom:3px dashed $A;background:transparent;",
  activeTab: "background:transparent;color:$I;border:2px dashed $A;border-radius:40%;",
});
add("podium-lights", "Championship stage · marquee heading and raised podium blocks", {
  section: "border-top:3px solid $A;",
  sectionHeader: "justify-content:center;text-align:center;padding-top:36px;",
  headingGroup: "border-bottom:4px double $A;padding-bottom:16px;",
  sectionTitle: "text-transform:uppercase;letter-spacing:.1em;",
  card: "border:0;border-top:6px solid $A;box-shadow:0 8px 0 $L;margin-bottom:8px;",
  navigation: "border-top:3px solid $A;",
  activeTab: "border-radius:10px 10px 0 0;border-bottom:5px solid $A;",
});
add("judges-sheet", "Coach notebook · binder holes, ruled notes and index tabs", {
  section: "border:1px solid $L;border-left:24px solid $W;",
  sectionHeader: "margin-left:20px;border-bottom:2px solid $L;",
  sectionTitle: "font-size:30px;",
  sectionBody: "margin-left:20px;border-left:1px solid $L;",
  card: "border:0;border-bottom:1px solid $A;background:transparent;padding-left:0;",
  navigation: "border-bottom:2px solid $L;padding-bottom:0;",
  activeTab: "border-radius:8px 16px 0 0;border:1px solid $L;",
});
add("spring-energy", "Spring scrimmage · capsule heading and lively open-field cards", {
  section: "border-radius:34px 6px 34px 6px;border:2px solid $A;",
  sectionHeader: "padding-bottom:0;",
  headingGroup: "border-radius:40px;border:2px solid $A;padding:14px 26px;background:$W;",
  sectionTitle: "font-size:32px;letter-spacing:-.05em;",
  sectionBody: "padding-top:26px;",
  card: "border:0;border-radius:4px 24px 4px 24px;box-shadow:inset 0 -4px $L;",
  navigation: "border-radius:8px 28px;border:2px solid $A;",
  activeTab: "border-radius:50px;border:3px solid $P;outline:1px solid $A;",
});
add("club-classic", "Booster society · engraved nameplate and formal ledger borders", {
  section: "border:1px solid $A;border-top:7px double $A;border-radius:2px 2px 16px 16px;",
  sectionHeader: "justify-content:center;text-align:center;",
  headingGroup: "border:1px solid $L;padding:18px 32px;",
  sectionTitle: "font-size:36px;font-variant:small-caps;letter-spacing:.06em;",
  card: "background:transparent;border-inline:0;border-block:1px solid $A;",
  navigation: "border:1px solid $A;border-radius:2px 2px 12px 12px;",
  activeTab: "border-radius:2px;outline:1px solid $A;outline-offset:3px;",
});
add("aurora-lift", "Aurora ribbons · sweeping corners and luminous vertical seams", {
  section: "border-radius:60px 4px 4px 60px;border-left:5px solid $A;",
  sectionHeader: "padding-left:38px;",
  sectionTitle: "font-weight:400;letter-spacing:.04em;",
  sectionBody: "padding-left:38px;",
  card: "border:0;border-left:1px solid $A;border-radius:22px 0 0 22px;",
  navigation: "border-radius:32px 4px 4px 32px;border-left:4px solid $A;",
  activeTab: "border-radius:24px 4px 4px 24px;",
});
add("ribbon-editorial", "Sideline feature · ribbon masthead and story columns", {
  section: "--ft-columns:minmax(170px,.8fr) minmax(0,2fr);border-bottom:3px double $L;",
  sectionHeader: "background:$W;border-bottom:12px solid $P;padding-top:32px;",
  eyebrow: "border-bottom:1px solid $A;padding-bottom:8px;",
  sectionTitle: "font-style:italic;font-size:38px;",
  sectionBody: "padding-top:32px;",
  card: "background:transparent;border:0;border-left:3px double $L;",
  navigation: "border-bottom:6px solid $L;",
  activeTab: "border-radius:0 0 15px 0;",
});
add("medal-poster", "Victory placard · ribbon tails and medal-inspired footers", {
  section: "border:3px solid $A;border-top-width:10px;border-radius:0 0 28px 28px;",
  sectionHeader: "justify-content:center;text-align:center;",
  eyebrow: "display:inline-block;border-inline:12px solid $L;padding-inline:12px;",
  sectionTitle: "text-transform:uppercase;font-size:46px;",
  card: "border:2px solid $L;border-radius:3px 3px 24px 24px;border-bottom:5px solid $A;",
  navigation: "border-block:3px solid $A;",
  activeTab: "border-radius:0 0 18px 18px;",
});
add("vault-grid", "End-zone matrix · data band and yard-grid compartments", {
  section: "border:2px solid $A;",
  sectionHeader: "background:$W;border-bottom:2px solid $A;",
  headingGroup: "display:flex;flex-wrap:wrap;align-items:center;gap:16px;",
  eyebrow: "border-right:2px solid $A;padding-right:20px;margin:0;",
  sectionTitle: "font-size:28px;text-transform:uppercase;",
  cards: "gap:0;",
  card: "border:1px solid $L;border-bottom:4px solid $A;",
  navigation: "padding:0;border:2px solid $A;",
  activeTab: "border-inline:3px solid $A;",
});
add("travel-briefing", "Travel wallet · perforated spine and luggage-tag cards", {
  section:
    "--ft-columns:minmax(160px,.65fr) minmax(0,2fr);border:1px solid $A;border-radius:14px 0 0 14px;",
  sectionHeader: "border-right:2px dashed $L;background:$W;border-radius:14px 0 0 14px;",
  sectionTitle: "font-size:34px;text-transform:uppercase;",
  sectionBody: "padding-top:28px;",
  card: "border:1px solid $L;border-radius:12px 0 0 12px;border-right:3px dashed $A;",
  navigation: "border:1px solid $A;border-radius:12px 0 0 12px;",
  activeTab: "border-radius:10px 0 0 10px;border-right:2px dashed $P;",
});

add("friday-night", "Floodlit stadium · light-bar masthead and scoreboard trays", {
  section: "border-radius:12px 12px 0 0;border:1px solid $L;border-top:6px solid $A;",
  sectionHeader: "border-bottom:1px solid $L;box-shadow:inset 0 8px 16px $W;",
  eyebrow: "letter-spacing:.4em;",
  sectionTitle: "text-transform:uppercase;font-size:44px;",
  card: "border:1px solid $A;box-shadow:inset 0 5px $L;border-radius:6px;padding-top:25px;",
  navigation: "border-block:2px solid $A;box-shadow:0 5px 15px $L;",
  activeTab: "border-radius:4px;box-shadow:0 0 0 2px $P,0 0 0 3px $A;",
  atmosphere: "radial-gradient(ellipse at 50% -20%,$L,transparent 70%)",
});
add("coastal-kickoff", "Coastal watercolor · tide-line dividers and scalloped shoreline panels", {
  section: "border-radius:8px 8px 48px 48px;border-bottom:6px double $A;",
  sectionHeader:
    "justify-content:center;text-align:center;border-bottom:1px solid $L;margin-inline:26px;",
  sectionTitle: "font-style:italic;font-size:42px;font-weight:500;",
  sectionBody: "padding-top:22px;",
  card: "border:0;border-radius:6px 6px 30px 30px;border-bottom:3px solid $L;",
  navigation: "border-bottom:4px double $A;border-radius:0 0 22px 22px;",
  activeTab: "border-radius:4px 4px 20px 20px;",
  atmosphere: "linear-gradient(0deg,$W,transparent 65%)",
});
add("desert-gridiron", "Desert strata · stepped mesa headings and sediment bands", {
  section: "border-left:12px solid $L;border-bottom:6px solid $A;border-radius:0 24px 0 0;",
  sectionHeader: "padding-bottom:24px;border-bottom:8px double $L;",
  headingGroup: "border-left:3px solid $A;padding-left:18px;",
  sectionTitle: "text-transform:uppercase;letter-spacing:.05em;",
  card: "border:0;border-top:4px solid $A;box-shadow:inset 0 8px $W;border-radius:0 16px 0 0;",
  navigation: "border-bottom:6px double $A;",
  activeTab: "border-radius:0 12px 0 0;border-bottom:4px solid $A;",
  atmosphere: "linear-gradient(175deg,transparent 45%,$W 45% 60%,transparent 60% 75%,$W 75%)",
});
add("mountain-league", "Mountain lodge · peaked border rhythm and trail-marker panels", {
  section: "--ft-columns:minmax(150px,.75fr) minmax(0,2fr);border:2px solid $A;border-radius:3px;",
  sectionHeader: "border-right:5px double $A;align-items:center;",
  sectionTitle: "font-size:36px;text-transform:uppercase;",
  sectionBody: "padding-top:28px;",
  card: "border:0;border-block:2px solid $A;box-shadow:inset 0 6px $W;",
  navigation: "border-block:5px double $A;",
  activeTab: "border-radius:3px;border:1px solid $A;outline:1px solid $P;outline-offset:-5px;",
  atmosphere: "linear-gradient(145deg,$W 20%,transparent 20% 80%,$W 80%)",
});
add("homecoming", "Homecoming banner · arched title crest and pennant cards", {
  section: "border:2px solid $A;border-radius:42px 42px 4px 4px;",
  sectionHeader:
    "justify-content:center;text-align:center;border-bottom:1px solid $L;margin:10px 20px 0;",
  headingGroup: "border-top:4px double $A;border-radius:50% 50% 0 0;padding:16px 20px 0;",
  sectionTitle: "font-size:40px;letter-spacing:.03em;",
  card: "border:1px solid $L;border-bottom:7px double $A;border-radius:0 0 20px 2px;",
  navigation: "border-radius:24px 24px 0 0;border-top:4px double $A;",
  activeTab: "border-radius:20px 20px 2px 2px;",
  atmosphere: "radial-gradient(ellipse at 50% 0,$W,transparent 75%)",
});
add("rain-game", "Rain shelter · sloped awning rule and water-beaded window cards", {
  section: "border:1px solid $L;border-top:8px solid $A;border-radius:18px 2px 18px 2px;",
  sectionHeader: "border-bottom:1px dashed $A;",
  sectionTitle: "letter-spacing:-.025em;font-size:38px;",
  card: "border:1px solid $L;border-radius:3px 3px 18px 3px;box-shadow:0 6px 12px $W;",
  navigation: "border-top:3px solid $A;border-radius:12px 0 0 0;",
  activeTab: "border-radius:12px 2px 12px 2px;border-bottom:2px solid $A;",
  atmosphere: "linear-gradient(120deg,$W,transparent 55%)",
});
add("snow-bowl", "Winter field · soft snowcap masthead and frosted ticket frames", {
  section: "border:1px solid $L;border-radius:36px 36px 10px 10px;box-shadow:inset 0 12px $W;",
  sectionHeader: "padding-top:38px;justify-content:center;text-align:center;",
  sectionTitle: "letter-spacing:.08em;font-size:34px;",
  card: "border:2px solid $L;border-radius:18px 18px 6px 6px;outline:1px dashed $L;outline-offset:-7px;",
  navigation: "border-radius:24px 24px 6px 6px;box-shadow:inset 0 5px $W;",
  activeTab: "border-radius:18px 18px 4px 4px;",
  atmosphere: "radial-gradient(ellipse at 50% 100%,$W,transparent 70%)",
});
add("red-zone", "Red-zone drive · goal-post title brackets and field-stripe rails", {
  section: "border-inline:3px solid $A;border-bottom:3px solid $A;",
  sectionHeader: "border-top:12px solid $A;border-bottom:2px dashed $L;",
  headingGroup: "border-inline:3px solid $A;padding-inline:18px;",
  sectionTitle: "text-transform:uppercase;font-size:48px;",
  card: "border:0;border-inline:4px solid $L;border-bottom:2px solid $A;",
  navigation: "border-top:7px solid $A;border-bottom:2px dashed $A;",
  activeTab: "border-inline:2px solid $A;text-transform:uppercase;",
  atmosphere: "linear-gradient(90deg,$W 0 4%,transparent 4% 96%,$W 96%)",
});
add("leather-linen", "Leather and linen · stitched inset border and leather label rail", {
  section: "border:9px solid $L;border-radius:16px;outline:1px dashed $A;outline-offset:-6px;",
  sectionHeader: "border-bottom:1px dashed $A;margin-inline:12px;",
  sectionTitle: "font-size:38px;font-weight:500;",
  card: "border:1px dashed $A;border-radius:8px;box-shadow:0 3px 0 $L;",
  navigation: "border:1px dashed $A;border-radius:10px;outline:4px solid $W;",
  activeTab: "border-radius:6px;outline:1px dashed $P;outline-offset:-5px;",
  atmosphere: "linear-gradient(90deg,$W,transparent 30% 70%,$W)",
});
add("chrome-league", "Chrome chassis · beveled rails and machined metal plates", {
  section: "border:6px ridge $L;border-radius:20px 2px 20px 2px;",
  sectionHeader:
    "border-bottom:4px ridge $L;background:linear-gradient(100deg,transparent,$W,transparent);",
  sectionTitle: "text-transform:uppercase;letter-spacing:.1em;font-size:36px;",
  card: "border:3px ridge $L;border-radius:10px 2px;box-shadow:inset 0 0 0 3px $P;",
  navigation: "border:3px ridge $L;border-radius:12px 0;",
  activeTab: "border:2px outset $A;border-radius:7px 0;",
  atmosphere: "linear-gradient(135deg,transparent 30%,$W 45%,transparent 60%)",
});
add(
  "saturday-morning",
  "Morning kickoff · sunrise arch, friendly headline and rounded score slips",
  {
    section: "border-radius:60px 12px 12px 12px;border:2px solid $L;",
    sectionHeader: "padding-top:34px;padding-left:34px;",
    eyebrow: "border-bottom:3px solid $A;display:inline-block;padding-bottom:4px;",
    sectionTitle: "font-size:40px;letter-spacing:-.04em;",
    card: "border:0;border-radius:20px 6px 20px 6px;box-shadow:4px 4px 0 $L;",
    navigation: "border-radius:30px 8px 8px 8px;",
    activeTab: "border-radius:24px 5px 5px 5px;",
    atmosphere: "radial-gradient(circle at 0 0,$L,transparent 55%)",
  },
);
add("womens-gridiron", "Women’s gridiron · confident vertical banner and athletic badge corners", {
  section:
    "--ft-columns:minmax(160px,.85fr) minmax(0,2fr);border-left:7px solid $A;border-radius:0 28px 28px 0;",
  sectionHeader: "background:$W;border-right:1px solid $L;",
  sectionTitle: "font-size:42px;text-transform:uppercase;letter-spacing:-.05em;",
  sectionBody: "padding-top:28px;",
  card: "border:2px solid $L;border-radius:0 20px 0 20px;border-bottom:5px solid $A;",
  navigation: "border-left:7px solid $A;border-radius:0 22px 22px 0;",
  activeTab: "border-radius:0 16px 0 16px;",
  atmosphere: "linear-gradient(155deg,$W 22%,transparent 22%)",
});
add("pep-rally", "Pep rally · cheer bursts, megaphone banner and confetti panels", {
  section: "border:3px solid $A;border-radius:4px 30px 4px 30px;box-shadow:6px 6px 0 $L;",
  sectionHeader: "border-bottom:3px dotted $A;",
  headingGroup: "border-left:12px solid $A;padding-left:18px;",
  sectionTitle: "text-transform:uppercase;font-size:44px;",
  card: "border:2px solid $A;border-radius:14px 2px 14px 2px;box-shadow:3px -3px 0 $L;",
  navigation: "border-block:3px dotted $A;",
  activeTab: "border-radius:4px 18px 4px 18px;",
  atmosphere: "radial-gradient(circle at 90% 10%,$W,transparent 60%)",
});
add("captains-band", "Captain’s armband · wraparound stripes and embroidered name tabs", {
  section: "border-block:7px solid $A;border-radius:24px 4px 24px 4px;",
  sectionHeader: "border-bottom:3px double $L;",
  headingGroup: "display:flex;flex-wrap:wrap;align-items:baseline;gap:14px 30px;",
  sectionTitle: "font-size:34px;text-transform:uppercase;",
  card: "border:0;border-left:7px double $A;border-right:1px solid $L;border-radius:5px;",
  navigation: "border-block:5px double $A;border-radius:12px;",
  activeTab: "border-radius:8px;border-inline:3px solid $A;",
  atmosphere: "linear-gradient(0deg,$W 0 8%,transparent 8% 92%,$W 92%)",
});
add("overtime", "Overtime clock · segmented timer band and compact display housings", {
  section:
    "border:2px solid $A;border-radius:8px;box-shadow:inset 0 0 0 5px $P,inset 0 0 0 6px $L;",
  sectionHeader: "margin:8px;border-bottom:3px dotted $A;",
  sectionTitle: "letter-spacing:.12em;font-size:32px;",
  card: "border:1px solid $A;border-radius:4px;box-shadow:inset 0 0 12px $W;border-top:4px solid $A;",
  navigation: "border:2px solid $A;border-radius:6px;",
  activeTab: "border-radius:3px;outline:1px dashed $A;outline-offset:2px;",
  atmosphere: "radial-gradient(ellipse at 50% 50%,$W,transparent 75%)",
});
add("tailgate-social", "Tailgate picnic · gingham edges and folded place cards", {
  section: "border:8px solid $W;border-radius:6px;outline:1px solid $L;outline-offset:-8px;",
  sectionHeader:
    "justify-content:center;text-align:center;border-bottom:2px dashed $A;margin-inline:16px;",
  sectionTitle: "font-size:38px;",
  card: "border:1px solid $L;border-top:6px solid $W;box-shadow:0 5px 0 $L;border-radius:3px;",
  navigation: "border:6px solid $W;border-radius:6px;",
  activeTab: "border-radius:3px;border-bottom:3px solid $A;",
  atmosphere: "linear-gradient(0deg,$W,transparent 35%)",
});
add("bandstand", "Marching band · staff-line masthead and brass-button cards", {
  section: "border-top:8px double $A;border-bottom:2px solid $A;",
  sectionHeader: "border-left:5px solid $A;margin-left:20px;",
  sectionTitle: "text-transform:uppercase;letter-spacing:.08em;font-size:40px;",
  card: "border:1px solid $A;border-radius:12px 12px 2px 2px;border-top:5px double $A;",
  navigation: "border-block:6px double $A;",
  activeTab: "border-radius:12px 12px 0 0;border-inline:1px solid $A;",
  atmosphere: "linear-gradient(90deg,$W,transparent 60%)",
});
add("goal-line", "Goal-line field · end-zone hatching and sideline marker cards", {
  section: "border:2px solid $A;border-inline-width:10px;",
  sectionHeader: "border-bottom:2px solid $A;padding-block:22px;",
  eyebrow: "border-inline:2px solid $A;padding-inline:12px;display:inline-block;",
  sectionTitle: "text-transform:uppercase;font-size:50px;",
  card: "border:0;border-block:2px solid $A;border-left:12px solid $W;",
  navigation: "border-inline:10px solid $A;border-bottom:2px solid $A;",
  activeTab: "border-bottom:5px double $A;text-transform:uppercase;",
  atmosphere: "repeating-linear-gradient(90deg,transparent 0 95px,$W 95px 96px)",
});
add("retro-broadcast", "Retro television · rounded tube frame and channel-strip headings", {
  section: "border:8px solid $L;border-radius:38px;box-shadow:inset 0 0 0 2px $A;",
  sectionHeader: "border-bottom:3px solid $L;margin:6px 18px 0;",
  sectionTitle: "font-size:36px;text-transform:uppercase;",
  card: "border:2px solid $L;border-radius:20px;box-shadow:inset 0 -4px $W;",
  navigation: "border:5px solid $L;border-radius:24px;",
  activeTab: "border-radius:15px;border-bottom:3px solid $A;",
  atmosphere: "repeating-linear-gradient(0deg,transparent 0 5px,$W 5px 6px)",
});
add("rivalry-week", "Rivalry matchup · split banner, opposing stripes and divider cards", {
  section: "border-left:8px solid $A;border-right:8px solid $I;",
  sectionHeader:
    "background:linear-gradient(110deg,$W 50%,transparent 50%);border-bottom:3px solid $A;",
  sectionTitle: "text-transform:uppercase;font-size:48px;letter-spacing:-.04em;",
  card: "border:0;border-left:4px solid $A;border-right:4px solid $I;border-bottom:1px solid $L;",
  navigation: "border-left:8px solid $A;border-right:8px solid $I;",
  activeTab: "border-left:4px solid $A;border-right:4px solid $P;",
  atmosphere: "linear-gradient(110deg,transparent 49.8%,$L 49.8% 50.2%,transparent 50.2%)",
});
add("city-league", "City league · street-grid rail and stacked building cards", {
  section:
    "--ft-columns:minmax(150px,.65fr) minmax(0,2fr);border-top:4px solid $I;border-bottom:8px solid $A;",
  sectionHeader: "border-right:3px solid $L;",
  sectionTitle: "font-size:40px;text-transform:uppercase;",
  sectionBody: "padding-top:28px;",
  card: "border:0;border-top:8px solid $A;border-left:2px solid $L;box-shadow:5px 5px 0 $W;",
  navigation: "border-top:4px solid $I;border-bottom:2px solid $A;",
  activeTab: "border-bottom:6px solid $A;border-radius:0;",
  atmosphere: "linear-gradient(90deg,$W 0 3%,transparent 3%)",
});
add("sunday-ink", "Linocut Sunday · carved borders and rough print blocks", {
  section: "border:4px solid $I;outline:2px solid $L;outline-offset:-10px;",
  sectionHeader: "border-bottom:5px double $I;margin:8px 14px 0;",
  sectionTitle: "text-transform:uppercase;font-size:46px;",
  eyebrow: "letter-spacing:.1em;",
  card: "border:2px solid $I;box-shadow:5px 5px 0 -1px $I;background:transparent;",
  navigation: "border-top:5px double $I;border-bottom:3px solid $I;",
  activeTab: "border:2px solid $I;outline:1px solid $P;outline-offset:-4px;",
  atmosphere: "linear-gradient(155deg,$W,transparent 45%)",
});
add("pennant-club", "Pennant club · banner-shaped heading and stitched flag labels", {
  section:
    "--ft-columns:minmax(170px,.8fr) minmax(0,2fr);border-top:3px solid $A;border-bottom:3px solid $A;",
  sectionHeader: "background:$W;border-right:6px double $A;",
  sectionTitle: "font-size:38px;text-transform:uppercase;",
  sectionBody: "padding-top:28px;",
  card: "border:1px solid $L;border-radius:0 24px 24px 0;border-left:5px solid $A;",
  navigation: "border-block:3px solid $A;border-left:6px double $A;",
  activeTab: "border-radius:0 24px 24px 0;border-left:4px solid $A;",
  atmosphere: "linear-gradient(90deg,$W,transparent 75%)",
});

add("stadium-mosaic", "Ceramic mosaic · grouted tile frame and tessellated heading strip", {
  section: "border:10px solid $W;outline:2px solid $A;outline-offset:-10px;border-radius:6px;",
  sectionHeader:
    "border-bottom:6px double $A;background:repeating-linear-gradient(90deg,transparent 0 47px,$L 47px 50px);",
  headingGroup: "background:$P;padding:12px 18px;border:1px solid $L;",
  sectionTitle: "font-size:36px;",
  card: "border:4px solid $W;outline:1px solid $L;outline-offset:-4px;border-radius:2px;",
  navigation: "border:6px solid $W;outline:1px solid $A;outline-offset:-6px;",
  activeTab: "border:3px solid $P;outline:1px solid $L;",
  atmosphere: "linear-gradient(135deg,$W,transparent 50%)",
});
add("copper-kickoff", "Hammered copper · riveted spine and embossed metal labels", {
  section: "--ft-columns:minmax(170px,.75fr) minmax(0,2fr);border:3px ridge $A;border-radius:3px;",
  sectionHeader: "border-right:8px double $A;align-items:center;",
  sectionTitle: "font-size:38px;letter-spacing:.05em;",
  sectionBody: "padding-top:28px;",
  card: "border:1px solid $A;box-shadow:inset 0 0 0 4px $P,inset 0 0 0 5px $L;border-radius:5px;",
  navigation: "border-block:3px ridge $A;",
  activeTab: "border:1px solid $A;box-shadow:inset 0 0 0 3px $I,inset 0 0 0 4px $P;",
  atmosphere: "linear-gradient(115deg,transparent 20%,$L 50%,transparent 80%)",
});
add("clay-play", "Sculpted clay · hand-shaped soft slab and pressed thumbprint cards", {
  section:
    "border-radius:42px 22px 36px 14px;border:2px solid $L;box-shadow:inset 0 -8px $W,5px 6px 0 $L;",
  sectionHeader: "padding-top:32px;",
  sectionTitle: "font-size:42px;letter-spacing:-.06em;",
  headingGroup: "border-bottom:4px solid $L;border-radius:0 0 50% 4px;padding-bottom:12px;",
  card: "border:0;border-radius:24px 12px 20px 9px;box-shadow:inset 3px 3px 0 $L;",
  navigation: "border-radius:25px 15px 21px 10px;box-shadow:inset 0 -4px $L;",
  activeTab: "border-radius:18px 8px 16px 7px;box-shadow:2px 3px 0 $L;",
  atmosphere: "radial-gradient(ellipse at 0 100%,$L,transparent 65%)",
});
add("paper-stadium", "Layered paper stadium · folded grandstand header and lifted paper cards", {
  section:
    "border:1px solid $L;border-top:0;box-shadow:5px 5px 0 $W,10px 10px 0 $L;margin:0 10px 10px 0;",
  sectionHeader:
    "border-top:12px solid $L;border-bottom:1px solid $A;background:linear-gradient(135deg,$W 24px,transparent 24px);",
  sectionTitle: "font-size:40px;letter-spacing:-.04em;",
  card: "border:1px solid $L;border-top:0;box-shadow:0 -5px 0 $W,3px 4px 0 $L;border-radius:0;",
  navigation: "border-top:6px solid $W;box-shadow:0 3px 0 $L;",
  activeTab: "border-radius:0;box-shadow:3px 3px 0 $L;",
  atmosphere: "linear-gradient(165deg,transparent 60%,$W 60%)",
});
add("stitched-season", "Embroidered team patch · overlocked fabric frame and stitched pockets", {
  section:
    "border:3px dashed $A;border-radius:22px;box-shadow:0 0 0 5px $W,inset 0 0 0 6px $W;margin:5px;",
  sectionHeader:
    "margin:10px 16px;border-bottom:2px dashed $A;justify-content:center;text-align:center;",
  sectionTitle: "font-size:36px;text-transform:uppercase;letter-spacing:.07em;",
  card: "border:2px dashed $A;border-radius:14px;box-shadow:inset 0 0 0 4px $W;",
  navigation: "border:2px dashed $A;border-radius:16px;",
  activeTab: "border-radius:10px;outline:1px dashed $P;outline-offset:-6px;",
  atmosphere: "linear-gradient(0deg,$W,transparent 50%)",
});
add("risograph-rush", "Risograph print · misregistered masthead and ink-trap offsets", {
  section:
    "border-top:6px solid $I;border-left:1px solid $L;box-shadow:7px 5px 0 $L;margin-right:7px;",
  sectionHeader:
    "border-bottom:2px solid $I;background:linear-gradient(175deg,transparent 80%,$W 80%);",
  sectionTitle: "font-size:48px;text-transform:uppercase;letter-spacing:-.06em;",
  eyebrow: "border-left:24px solid $A;padding-left:12px;",
  card: "border:0;border-top:4px solid $I;box-shadow:4px 4px 0 $L;background:$W;",
  navigation: "border-block:2px solid $I;box-shadow:5px 3px 0 $L;",
  activeTab: "box-shadow:4px 3px 0 $A;",
  atmosphere: "linear-gradient(130deg,$W 30%,transparent 30%)",
});
add("cyanotype-club", "Cyanotype proof · contact-print border and botanical specimen captions", {
  section: "border:10px solid $W;border-radius:2px;outline:1px solid $A;outline-offset:-10px;",
  sectionHeader:
    "border-bottom:1px solid $A;margin:8px 12px 0;justify-content:center;text-align:center;",
  sectionTitle: "font-size:38px;font-weight:400;letter-spacing:.04em;",
  card: "background:transparent;border:1px solid $A;border-bottom:5px double $L;",
  navigation: "border-top:5px solid $W;border-bottom:1px solid $A;background:transparent;",
  activeTab: "background:transparent;color:$I;border-bottom:5px double $A;",
  atmosphere: "radial-gradient(ellipse at center,transparent 40%,$W)",
});
add("stained-glass-sunday", "Stained glass · leaded arch, faceted frame and window-panel cards", {
  section: "border:4px solid $I;border-radius:72px 72px 4px 4px;",
  sectionHeader:
    "justify-content:center;text-align:center;padding-top:42px;border-bottom:5px double $A;",
  headingGroup: "border-inline:2px solid $L;padding-inline:24px;",
  sectionTitle: "font-size:38px;letter-spacing:.04em;",
  card: "border:3px solid $I;border-radius:32px 32px 2px 2px;border-bottom:6px solid $A;",
  navigation: "border:3px solid $I;border-radius:25px 25px 0 0;",
  activeTab: "border-radius:18px 18px 0 0;border-inline:2px solid $A;",
  atmosphere:
    "conic-gradient(from 30deg at 50% 0,$W,transparent 90deg,$W 180deg,transparent 270deg,$W)",
});
add("terrazzo-touchdown", "Terrazzo slab · inset stone tablet and polished chip-edged cards", {
  section:
    "border:14px solid $W;border-radius:20px 4px 20px 4px;outline:1px solid $L;outline-offset:-14px;",
  sectionHeader: "border-bottom:1px solid $L;",
  sectionTitle: "font-size:38px;letter-spacing:-.04em;",
  card: "border:1px solid $L;border-radius:12px 3px 12px 3px;box-shadow:0 4px 0 $W;",
  navigation: "border:8px solid $W;border-radius:12px 3px;",
  activeTab: "border-radius:7px 2px;border-bottom:3px solid $A;",
  atmosphere: "linear-gradient(120deg,$W,transparent 60%)",
});
add("origami-offense", "Origami fold · diagonal corner fold, crease rail and folded card flaps", {
  section:
    "--ft-columns:minmax(170px,.8fr) minmax(0,2fr);border:1px solid $L;box-shadow:6px 6px 0 $W;",
  sectionHeader:
    "border-right:1px solid $A;background:linear-gradient(135deg,$L 26px,$W 26px 27px,transparent 27px);padding-top:38px;",
  sectionTitle: "font-size:38px;letter-spacing:-.05em;",
  sectionBody: "padding-top:28px;",
  card: "border:1px solid $L;border-bottom:4px solid $W;background:linear-gradient(225deg,$L 18px,transparent 18px),$G;",
  navigation: "border-bottom:4px solid $L;",
  activeTab: "border-radius:0;border-right:10px solid $A;",
  atmosphere: "linear-gradient(135deg,transparent 49.8%,$W 50% 50.2%,transparent 50.2%)",
});
add("velvet-victory", "Velvet presentation box · padded surround, inset label and piping", {
  section: "border:12px solid $W;border-radius:28px;box-shadow:inset 0 0 0 1px $A,0 8px 24px $L;",
  sectionHeader: "justify-content:center;text-align:center;",
  headingGroup: "border-bottom:3px double $A;padding:10px 24px 20px;",
  sectionTitle: "font-size:42px;font-weight:400;",
  card: "border:1px solid $A;border-radius:16px;box-shadow:inset 0 0 0 5px $G,inset 0 0 0 6px $L;",
  navigation: "border:6px solid $W;border-radius:20px;",
  activeTab: "border-radius:12px;box-shadow:inset 0 0 0 1px $A;",
  atmosphere: "radial-gradient(ellipse at 50% 0,$L,transparent 70%)",
});
add("blue-hour-stands", "Blue-hour grandstand · terrace bands and long bench-like panels", {
  section: "border-top:1px solid $A;border-bottom:8px double $L;",
  sectionHeader: "border-bottom:1px solid $L;padding-top:34px;",
  headingGroup: "display:flex;flex-wrap:wrap;align-items:baseline;gap:12px 32px;",
  sectionTitle: "font-size:36px;font-weight:500;letter-spacing:.08em;",
  card: "border:0;border-block:1px solid $A;box-shadow:0 5px 0 $W;border-radius:2px;",
  navigation: "border-block:1px solid $A;padding-block:4px;",
  activeTab: "background:$W;color:$I;border-bottom:2px solid $A;",
  atmosphere: "linear-gradient(0deg,$L,transparent 80%)",
});
add("aerial-playbook", "Aerial formation · field diagram panel, coaching rail and route cards", {
  section: "--ft-columns:minmax(150px,.65fr) minmax(0,2fr);border:2px solid $A;border-radius:8px;",
  sectionHeader: "border-right:2px dashed $A;",
  sectionTitle: "font-size:32px;text-transform:uppercase;",
  sectionBody: "padding-top:28px;",
  card: "border:1px solid $L;border-left:6px double $A;border-radius:0 8px 8px 0;",
  navigation: "border:2px solid $A;border-bottom-style:dashed;",
  activeTab: "border-radius:4px;border-left:5px double $A;",
  atmosphere: "repeating-linear-gradient(0deg,transparent 0 59px,$W 59px 60px)",
});
add("locker-room", "Locker-room steel · vented title plate, riveted doors and inset handles", {
  section: "border:3px solid $L;border-radius:3px;box-shadow:inset 0 0 0 4px $W;",
  sectionHeader: "border-bottom:3px solid $L;border-top:12px double $L;margin:8px 12px 0;",
  headingGroup: "border:1px solid $A;padding:12px 18px;background:$G;",
  sectionTitle: "font-size:30px;text-transform:uppercase;letter-spacing:.1em;",
  card: "border:2px solid $L;border-radius:2px;box-shadow:inset -7px 0 $W;padding-right:28px;",
  navigation: "border:3px solid $L;box-shadow:inset 0 4px $W;",
  activeTab: "border:1px solid $A;box-shadow:inset 0 -4px $L;",
  atmosphere: "linear-gradient(90deg,$W,transparent 10% 90%,$W)",
});
add("tunnel-vision", "Stadium tunnel · receding nested frame and portal-shaped cards", {
  section:
    "border:1px solid $A;box-shadow:inset 0 0 0 7px $P,inset 0 0 0 8px $L,inset 0 0 0 15px $P,inset 0 0 0 16px $L;padding:16px;border-radius:36px 36px 0 0;",
  sectionHeader: "justify-content:center;text-align:center;",
  sectionTitle: "font-size:42px;text-transform:uppercase;",
  card: "border:1px solid $A;border-radius:20px 20px 0 0;box-shadow:inset 0 0 0 5px $G,inset 0 0 0 6px $L;",
  navigation: "border:1px solid $A;border-radius:20px 20px 0 0;",
  activeTab: "border-radius:14px 14px 0 0;border-top:3px solid $A;",
  atmosphere: "radial-gradient(ellipse at 50% 100%,$L,transparent 65%)",
});
add("foggy-morning", "Misty morning field · floating translucent sheet and horizon dividers", {
  section: "border:0;border-radius:2px 2px 30px 30px;box-shadow:0 16px 30px $W;",
  sectionHeader: "border-bottom:1px solid $L;margin-inline:26px;padding-inline:0;",
  sectionTitle: "font-size:44px;font-weight:400;font-style:italic;",
  eyebrow: "letter-spacing:.3em;font-weight:500;",
  card: "border:0;border-bottom:1px solid $L;background:linear-gradient(0deg,$W,transparent);border-radius:0 0 16px 16px;",
  navigation: "background:transparent;border-bottom:1px solid $L;border-radius:0 0 18px 18px;",
  activeTab: "background:$W;color:$I;border-radius:2px 2px 16px 16px;",
  atmosphere: "linear-gradient(0deg,$W,transparent 35%,$W 70%,transparent)",
});
add("harvest-kickoff", "Harvest gathering · woven border, leaf-stem rail and warm paper labels", {
  section:
    "--ft-columns:minmax(160px,.75fr) minmax(0,2fr);border:3px solid $L;border-bottom:8px double $A;border-radius:3px 24px 3px 3px;",
  sectionHeader: "border-right:2px dashed $A;",
  sectionTitle: "font-size:38px;font-weight:500;",
  sectionBody: "padding-top:28px;",
  card: "border:1px solid $L;border-radius:3px 18px 3px 3px;border-left:4px solid $A;",
  navigation: "border-block:4px double $A;border-radius:0 16px 0 0;",
  activeTab: "border-radius:2px 14px 2px 2px;",
  atmosphere: "linear-gradient(135deg,$W,transparent 70%)",
});
add("riverside-lights", "Riverside reflections · flowing edge lines and mirrored light strips", {
  section: "border-radius:5px 36px 5px 36px;border-top:2px solid $A;border-bottom:6px double $A;",
  sectionHeader: "border-bottom:1px solid $L;",
  sectionTitle: "font-size:38px;letter-spacing:.04em;",
  card: "border:0;border-top:1px solid $A;border-bottom:4px double $L;border-radius:0 16px 0 16px;",
  navigation: "border-top:1px solid $A;border-bottom:4px double $L;",
  activeTab: "border-radius:2px 14px 2px 14px;box-shadow:0 3px 0 $L;",
  atmosphere: "linear-gradient(0deg,$L,transparent 45%,$W)",
});
add("steel-town", "Steel-town truss · riveted beam rail and industrial gusset cards", {
  section:
    "--ft-columns:minmax(155px,.7fr) minmax(0,2fr);border:4px solid $A;border-bottom-width:10px;",
  sectionHeader: "border-right:8px double $A;background:$W;",
  sectionTitle: "font-size:42px;text-transform:uppercase;",
  sectionBody: "padding-top:28px;",
  card: "border:2px solid $A;border-top:8px solid $L;box-shadow:3px 3px 0 $L;",
  navigation: "border:3px solid $A;border-bottom-width:7px;",
  activeTab: "border:2px solid $P;outline:1px solid $A;",
  atmosphere: "linear-gradient(135deg,$W 20%,transparent 20% 80%,$W 80%)",
});
add("desert-moon", "Desert moon · moon-gate heading, quiet dune contours and crescent cards", {
  section: "border-radius:60px 60px 4px 4px;border:1px solid $A;border-bottom:4px solid $L;",
  sectionHeader: "justify-content:center;text-align:center;padding-top:38px;",
  headingGroup: "border-top:1px solid $A;border-radius:50% 50% 0 0;padding:20px 28px 0;",
  sectionTitle: "font-size:38px;font-weight:400;letter-spacing:.08em;",
  card: "border:1px solid $L;border-left:5px solid $A;border-radius:28px 4px 4px 28px;",
  navigation: "border-block:1px solid $A;border-radius:20px 20px 0 0;",
  activeTab: "border-radius:22px 4px 4px 22px;",
  atmosphere: "radial-gradient(circle at 80% 0,$L,transparent 55%)",
});
add("tropical-touchdown", "Tropical pavilion · leaf-framed heading and woven palm panels", {
  section: "border-radius:4px 48px 4px 48px;border:2px solid $A;border-left-width:7px;",
  sectionHeader: "border-bottom:2px dashed $L;",
  headingGroup: "border-left:3px solid $A;padding-left:18px;",
  sectionTitle: "font-size:40px;letter-spacing:-.04em;",
  card: "border:0;border-radius:2px 26px 2px 26px;border-block:3px solid $L;",
  navigation: "border-radius:3px 26px 3px 26px;border-bottom:3px solid $A;",
  activeTab: "border-radius:2px 20px 2px 20px;",
  atmosphere: "linear-gradient(120deg,$W,transparent 55%)",
});
add("flag-football", "Flag football · pull-tag heading, dashed routes and soft flag pockets", {
  section: "border:2px dashed $A;border-radius:10px 30px 10px 10px;",
  sectionHeader: "border-bottom:2px dashed $L;",
  eyebrow: "background:$W;display:inline-block;padding:6px 14px;border-radius:0 16px 16px 0;",
  sectionTitle: "font-size:42px;text-transform:uppercase;",
  card: "border:0;border-left:5px solid $A;border-radius:3px 20px 20px 3px;box-shadow:0 3px 0 $L;",
  navigation: "border-bottom:3px dashed $A;",
  activeTab: "border-radius:3px 22px 22px 3px;border-left:4px solid $A;",
  atmosphere: "linear-gradient(180deg,$W,transparent 70%)",
});
add("backyard-bowl", "Backyard field · hand-painted fence rail and friendly garden cards", {
  section: "border-radius:18px 5px 18px 5px;border:3px solid $L;border-bottom:8px solid $A;",
  sectionHeader: "border-bottom:2px dashed $L;justify-content:center;text-align:center;",
  sectionTitle: "font-size:40px;",
  card: "border:2px solid $L;border-radius:10px 3px 10px 3px;box-shadow:4px 4px 0 $W;",
  navigation: "border-bottom:6px solid $A;border-radius:12px 4px 12px 4px;",
  activeTab: "border-radius:8px 3px;outline:1px dashed $P;outline-offset:-5px;",
  atmosphere: "linear-gradient(0deg,$W 10%,transparent 65%)",
});
add(
  "senior-night",
  "Senior-night tribute · portrait mat, commemorative ribbon and keepsake cards",
  {
    section:
      "border:2px solid $A;border-radius:8px;outline:1px solid $L;outline-offset:-9px;padding:9px;",
    sectionHeader:
      "justify-content:center;text-align:center;border-bottom:3px double $A;margin:8px 14px 0;",
    eyebrow: "letter-spacing:.4em;",
    sectionTitle: "font-size:42px;font-weight:500;",
    card: "border:1px solid $A;border-top:7px double $L;border-radius:3px;box-shadow:0 4px 0 $W;",
    navigation: "border:1px solid $A;border-block-width:4px;border-radius:6px;",
    activeTab: "border-radius:3px;border-bottom:4px double $A;",
    atmosphere: "radial-gradient(ellipse at 50% 0,$W,transparent 70%)",
  },
);
add("saturday-scrapbook", "Saturday scrapbook · tape tabs, photo corners and layered paper notes", {
  section: "border:1px solid $L;border-radius:3px;box-shadow:6px 6px 0 $W;margin:10px 6px 6px 0;",
  sectionHeader:
    "border-top:12px solid $W;margin:0 24px;border-bottom:1px dashed $A;padding-inline:8px;",
  sectionTitle: "font-size:40px;font-style:italic;",
  card: "border:5px solid $P;border-bottom-width:16px;outline:1px solid $L;box-shadow:4px 5px 0 $L;",
  navigation: "border-top:8px solid $W;border-bottom:1px dashed $A;",
  activeTab: "border-radius:2px;box-shadow:3px 3px 0 $L;",
  atmosphere: "linear-gradient(175deg,$W 7%,transparent 7% 92%,$W 92%)",
});
add(
  "midcentury-matchup",
  "Midcentury program · asymmetrical color-block rail and atomic geometry",
  {
    section:
      "--ft-columns:minmax(165px,.8fr) minmax(0,2fr);border:1px solid $A;border-radius:28px 0 0 0;",
    sectionHeader: "background:$W;border-right:2px solid $A;border-radius:28px 0 0 0;",
    sectionTitle: "font-size:40px;letter-spacing:-.055em;",
    sectionBody: "padding-top:28px;",
    card: "border:0;border-radius:18px 0 0 0;border-bottom:3px solid $A;border-right:1px solid $L;",
    navigation: "border:1px solid $A;border-radius:18px 0 0 0;",
    activeTab: "border-radius:14px 0 0 0;border-right:4px solid $A;",
    atmosphere: "linear-gradient(90deg,$W 22%,transparent 22%)",
  },
);
add("quilted-gridiron", "Patchwork quilt · pieced border, quilt-block heading and sewn pockets", {
  section: "border:12px solid $W;outline:2px dashed $A;outline-offset:-8px;border-radius:10px;",
  sectionHeader:
    "background:linear-gradient(135deg,$W 25%,transparent 25% 75%,$W 75%);border-bottom:2px dashed $A;",
  headingGroup: "background:$P;border:1px dashed $L;padding:14px 20px;",
  sectionTitle: "font-size:34px;",
  card: "border:2px dashed $L;border-radius:5px;box-shadow:0 0 0 4px $W;",
  navigation: "border:6px solid $W;outline:1px dashed $A;outline-offset:-4px;",
  activeTab: "border-radius:4px;border:2px dashed $P;",
  atmosphere: "linear-gradient(45deg,transparent 40%,$W 40% 60%,transparent 60%)",
});
add("electric-lime", "Electric pulse · charge rail, energized title underline and circuit cards", {
  section:
    "border-top:3px solid $A;border-left:3px solid $A;border-radius:0 24px 0 24px;box-shadow:6px 6px 0 $L;",
  sectionHeader: "border-bottom:1px solid $A;",
  sectionTitle: "font-size:46px;text-transform:uppercase;font-style:italic;",
  eyebrow: "border-bottom:4px solid $A;display:inline-block;",
  card: "border:1px solid $A;border-radius:0 14px 0 14px;border-left:6px solid $A;",
  navigation: "border-top:3px solid $A;border-radius:0 18px 0 18px;",
  activeTab: "border-radius:0 12px 0 12px;box-shadow:3px 3px 0 $A;",
  atmosphere: "radial-gradient(ellipse at 0 0,$L,transparent 60%)",
});
add("monochrome-motion", "Motion photography · speed-line edge and staggered photo-strip cards", {
  section: "border-block:3px solid $I;border-left:14px double $I;",
  sectionHeader:
    "border-bottom:1px solid $I;background:linear-gradient(100deg,transparent 70%,$W 70%);",
  sectionTitle:
    "font-size:clamp(40px,6cqi,66px);font-style:italic;text-transform:uppercase;letter-spacing:-.06em;",
  card: "border:0;border-bottom:3px solid $I;border-left:8px double $I;background:transparent;",
  navigation: "border-block:3px solid $I;border-left:10px double $I;",
  activeTab: "font-style:italic;background:transparent;color:$I;border-bottom:4px solid $I;",
  atmosphere: "repeating-linear-gradient(160deg,transparent 0 38px,$W 38px 40px)",
});
add("rooftop-league", "Rooftop court · fenced perimeter, skyline masthead and court tiles", {
  section: "border:2px solid $A;border-top:10px double $A;border-radius:2px 2px 16px 16px;",
  sectionHeader: "border-bottom:2px solid $L;",
  headingGroup: "border-left:5px solid $A;padding-left:18px;",
  sectionTitle: "font-size:40px;text-transform:uppercase;",
  card: "border:1px solid $A;border-radius:2px 2px 12px 12px;box-shadow:inset 0 -5px $W;",
  navigation: "border-top:6px double $A;border-bottom:2px solid $A;",
  activeTab: "border-radius:0 0 12px 12px;border-bottom:3px solid $A;",
  atmosphere: "linear-gradient(0deg,$W 15%,transparent 80%)",
});

function build() {
  const ids = Object.keys(designs);
  if (
    recipes.length !== ids.length ||
    new Set(recipes.map((x) => x.id)).size !== ids.length ||
    ids.some((id) => !recipes.some((x) => x.id === id))
  )
    throw new Error("Every design needs one explicit art direction.");
  const fonts = {
    anton: "Anton,Impact,sans-serif",
    audiowide: "Audiowide,sans-serif",
    "barlow-condensed": '"Barlow Condensed","Arial Narrow",sans-serif',
    bungee: "Bungee,Impact,sans-serif",
    cormorant: '"Cormorant Garamond",Georgia,serif',
    exo2: '"Exo 2",sans-serif',
    "ibm-plex-mono": '"IBM Plex Mono",monospace',
    kanit: "Kanit,sans-serif",
    "league-spartan": '"League Spartan",sans-serif',
    manrope: "Manrope,sans-serif",
    montserrat: "Montserrat,sans-serif",
    orbitron: "Orbitron,sans-serif",
    oswald: "Oswald,sans-serif",
    playfair: '"Playfair Display",Georgia,serif',
    poppins: "Poppins,sans-serif",
    "press-start-2p": '"Press Start 2P",monospace',
    sora: "Sora,sans-serif",
    "space-mono": '"Space Mono",monospace',
  };
  const chunks = [];
  for (const recipe of recipes) {
    const { id, concept, rules } = recipe;
    const design = designs[id];
    const paper = design.headerClass.match(/bg-\[(#[a-f0-9]+)\]/i)[1];
    const ground = design.pageClass.match(/bg-\[(#[a-f0-9]+)\]/i)[1];
    const font = fonts[registry.find((x) => x.id === id).titleTypographyId];
    if (!font) throw new Error(`Missing font: ${id}`);
    chunks.push(
      `/* ${concept} */\n.${id} { --ft-ink:${design.ink}; --ft-accent:${design.accent}; --ft-paper:${paper}; --ft-ground:${ground}; --ft-font:${font}; --ft-atmosphere:${expand((rules.atmosphere || "radial-gradient(ellipse at 100% 0,$W,transparent 68%)").replaceAll("$L", "$W"))}; }`,
    );
    for (const [part, css] of Object.entries(rules)) {
      if (part === "atmosphere") continue;
      const selector = part === "navigation" ? `.${id}.navigation` : `.${id} .${part}`;
      chunks.push(`${selector} { ${expand(css)} }`);
    }
  }
  const cssFile = path.join(dir, "football-page-content.module.css");
  const marker = "/* BEGIN GENERATED ART DIRECTIONS";
  const base = fs.readFileSync(cssFile, "utf8").split(marker)[0].trimEnd();
  fs.writeFileSync(
    cssFile,
    `${base}\n\n${marker} — scripts/build-football-presentations.cjs */\n${chunks.join("\n")}\n`,
  );
  execFileSync(path.join(root, "node_modules/.bin/biome"), ["format", "--write", cssFile], {
    cwd: root,
    stdio: "pipe",
  });
  fs.writeFileSync(
    path.join(root, "docs/football-content-art-directions.md"),
    `# Football content art directions\n\nAll 90 designs have explicitly authored section, heading, card and navigation treatments with restrained CSS gradients. The editor and guest page use the same renderer. Shared editing controls remain separate from the designed sections.\n\nEdit the recipes in \`scripts/build-football-presentations.cjs\`, then run that script to rebuild the CSS. Do not add SVG background patterns; the user requested their removal. Original hero artwork is preserved.\n\n| Design | Content treatment |\n| --- | --- |\n${recipes.map((r) => `| ${designs[r.id].name} | ${r.concept} |`).join("\n")}\n`,
  );
  console.log(`Built ${recipes.length} football art directions.`);
}
if (require.main === module) build();
module.exports = { recipes, build };
