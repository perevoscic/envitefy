import weddingTemplateCatalog from "../../templates/weddings/index.json" with { type: "json" };

type WeddingDesignDetail = {
  style: string;
  color: string;
  season: string;
  description: string;
  signature: string;
};

type WeddingCatalogEntry = {
  id: string;
  name: string;
  category: string;
  family: string;
  layout: string;
  thumbnail: string;
  primaryColor: string;
  secondaryColor: string;
  headlineFont: string;
  bodyFont: string;
  heroImage: string;
};

export type WeddingDesign = WeddingCatalogEntry &
  WeddingDesignDetail & {
    previewNames: string;
  };

const DESIGN_DETAILS: Record<string, WeddingDesignDetail> = {
  "gilded-wedding": {
    style: "Black Tie",
    color: "Ivory & Gold",
    season: "Any season",
    description: "A grand-hotel composition with gilded frames, editorial serif type, and heirloom details.",
    signature: "Gilded portrait arch",
  },
  "modern-editorial": {
    style: "Editorial",
    color: "Black & Lime",
    season: "Any season",
    description: "Bold magazine typography, asymmetric image crops, and a fashion-forward acid accent.",
    signature: "Oversized editorial grid",
  },
  "rustic-boho": {
    style: "Bohemian",
    color: "Warm Neutral",
    season: "Fall",
    description: "Sunset warmth, tactile paper surfaces, and relaxed botanical details for an elevated outdoor affair.",
    signature: "Vineyard story panels",
  },
  "cinematic-wedding": {
    style: "Cinematic",
    color: "Midnight",
    season: "Any season",
    description: "A dramatic widescreen love story with film-title typography and immersive photography.",
    signature: "Full-bleed film frames",
  },
  "celestial-wedding": {
    style: "Celestial",
    color: "Navy & Gold",
    season: "Winter",
    description: "Moonlit arches, constellation accents, and luminous gold type beneath a midnight sky.",
    signature: "Star-map ceremony arch",
  },
  "ethereal-classic": {
    style: "Classic",
    color: "Ivory",
    season: "Any season",
    description: "Quiet European luxury with balanced typography, generous white space, and timeless portraiture.",
    signature: "Formal centered monogram",
  },
  "museum-wedding": {
    style: "Gallery",
    color: "White & Black",
    season: "Any season",
    description: "A modern gallery system with exhibition labels, architectural spacing, and curated image walls.",
    signature: "Museum exhibition grid",
  },
  "ethereal-wedding": {
    style: "Romantic",
    color: "Champagne Blush",
    season: "Spring",
    description: "Soft-focus photography, floating cards, and delicate serif flourishes in a champagne palette.",
    signature: "Floating champagne layers",
  },
  "noir-luxury": {
    style: "Black Tie",
    color: "Black & Gold",
    season: "Winter",
    description: "Velvet-black surfaces, fine gold rules, and formal typography for an evening celebration.",
    signature: "Noir invitation suite",
  },
  "retro-70s": {
    style: "Retro Luxe",
    color: "Ochre & Terracotta",
    season: "Summer",
    description: "Sculptural curves and sun-washed tones reinterpreted with polished modern spacing.",
    signature: "Sculpted sunset geometry",
  },
  "newspaper-wedding": {
    style: "Editorial",
    color: "Monochrome",
    season: "Any season",
    description: "A bespoke wedding gazette with masthead drama, column rhythm, and documentary photography.",
    signature: "Wedding-day front page",
  },
  "bauhaus-wedding": {
    style: "Modern Art",
    color: "Primary Color",
    season: "Any season",
    description: "Museum-grade geometry, crisp sans serif type, and playful color blocking with a luxe finish.",
    signature: "Geometric art composition",
  },
  "europe-coastal-wedding": {
    style: "Destination",
    color: "Cobalt & Gold",
    season: "Summer",
    description: "A Mediterranean editorial with postcard layering, cobalt details, and sunlit coastal imagery.",
    signature: "Riviera postcard collage",
  },
  "florida-coastal-wedding": {
    style: "Tropical Luxe",
    color: "Emerald & Pink",
    season: "Summer",
    description: "Palm Beach glamour with emerald structure, playful pink accents, and resort-style photography.",
    signature: "Palm Beach resort arch",
  },
  "california-coastal-wedding": {
    style: "Coastal",
    color: "Sand & Clay",
    season: "Summer",
    description: "Airy West Coast minimalism with warm sand tones, organic forms, and horizon-led imagery.",
    signature: "Pacific horizon split",
  },
  "winter-wedding": {
    style: "Seasonal Luxe",
    color: "Evergreen & Copper",
    season: "Winter",
    description: "Alpine refinement with evergreen depth, copper accents, and a warm chalet atmosphere.",
    signature: "Evergreen chalet frame",
  },
  "industrial-wedding": {
    style: "Industrial Luxe",
    color: "Charcoal & Copper",
    season: "Fall",
    description: "Architectural grids, burnished metal, and modern typography softened by candlelit imagery.",
    signature: "Copper architectural grid",
  },
  "library-wedding": {
    style: "Old World",
    color: "Oxblood & Parchment",
    season: "Fall",
    description: "A literary invitation inspired by private libraries, leather bindings, and engraved bookplates.",
    signature: "Private-library bookplate",
  },
  "garden-wedding": {
    style: "Romantic",
    color: "Blush & Green",
    season: "Spring",
    description: "A botanical conservatory brought to life with layered florals, glasshouse light, and graceful script.",
    signature: "Conservatory floral arch",
  },
  "skyline-wedding": {
    style: "City Luxe",
    color: "Navy & Amber",
    season: "Any season",
    description: "A rooftop-night composition with panoramic photography, luminous type, and metropolitan polish.",
    signature: "Illuminated skyline stage",
  },
  "midnight-elegance": {
    style: "Black Tie",
    color: "Midnight & Champagne",
    season: "Any season",
    description: "A midnight salon with a dramatic split portrait, champagne rules, and restrained formal typography.",
    signature: "Midnight split portrait",
  },
  "wild-rose-halo": {
    style: "Romantic",
    color: "Wine & Rose",
    season: "Spring",
    description: "A rich floral portrait framed by wild roses, painterly shadows, and softly engraved type.",
    signature: "Wild-rose portrait halo",
  },
  "golden-hour-promise": {
    style: "Modern Rustic",
    color: "Amber & Cream",
    season: "Fall",
    description: "A sunlit two-column story balancing vineyard photography with warm editorial typography.",
    signature: "Golden-hour story split",
  },
  "ivory-lace-crest": {
    style: "Classic",
    color: "Ivory & Pewter",
    season: "Any season",
    description: "An heirloom crest, lace-like borders, and symmetrical stationery styling for a timeless ceremony.",
    signature: "Heirloom lace crest",
  },
  "emerald-garden-vignette": {
    style: "Botanical",
    color: "Emerald & Mist",
    season: "Spring",
    description: "Deep garden greens and architectural botanical borders surround a refined central vignette.",
    signature: "Emerald botanical border",
  },
  "blush-linen-romance": {
    style: "Soft Minimal",
    color: "Blush & Linen",
    season: "Spring",
    description: "A tactile pastel composition with cloud-soft photography, modern spacing, and quiet romance.",
    signature: "Blush linen portrait",
  },
  "sapphire-moonlit-arch": {
    style: "Evening Luxe",
    color: "Sapphire & Silver",
    season: "Winter",
    description: "A luminous moonlit arch set in deep sapphire with silver detailing and sweeping serif type.",
    signature: "Sapphire moon arch",
  },
  "rustic-oak-storybook": {
    style: "Storybook",
    color: "Oak & Parchment",
    season: "Fall",
    description: "A hand-bound storybook treatment with parchment textures, oak tones, and chapter-like details.",
    signature: "Parchment storybook cover",
  },
  "champagne-velvet": {
    style: "Grand Luxury",
    color: "Champagne & Bronze",
    season: "Any season",
    description: "A full-width ballroom statement with velvet depth, metallic accents, and couture-scale typography.",
    signature: "Champagne ballroom stage",
  },
  "celestial-whisper": {
    style: "Celestial Minimal",
    color: "Indigo & Ice",
    season: "Winter",
    description: "A quieter night-sky design with star trails, airy type, and an intimate celestial atmosphere.",
    signature: "Whispered star field",
  },
  "pearl-tide-horizon": {
    style: "Coastal Minimal",
    color: "Pearl & Tide Blue",
    season: "Summer",
    description: "A centered ocean-horizon composition with pearl space, tidal blue, and gallery-like restraint.",
    signature: "Pearl horizon window",
  },
  "crimson-orchard": {
    style: "Dramatic Floral",
    color: "Crimson & Petal",
    season: "Fall",
    description: "A deep orchard palette with split textures, sculptural florals, and ceremonial drama.",
    signature: "Crimson orchard banner",
  },
  "opaline-crest": {
    style: "Regency",
    color: "Opal & Slate",
    season: "Any season",
    description: "A centered crest and ribbon system inspired by engraved stationery and Regency-era polish.",
    signature: "Opaline ribbon crest",
  },
  "velvet-midnight-lily": {
    style: "Nocturne",
    color: "Midnight & Antique Gold",
    season: "Winter",
    description: "A velvet-dark photographic overlay with lily-like curves and warm antique-gold details.",
    signature: "Velvet lily overlay",
  },
  "lavender-mist-cascade": {
    style: "Romantic Floral",
    color: "Lavender & Pearl",
    season: "Spring",
    description: "Cascading lavender florals drift into a light-filled ceremony composition with graceful type.",
    signature: "Lavender floral cascade",
  },
  "coral-sands-keepsake": {
    style: "Coastal Keepsake",
    color: "Coral & Shell",
    season: "Summer",
    description: "An airy horizontal keepsake with shell-toned paper, coral accents, and relaxed coastal imagery.",
    signature: "Coral keepsake panorama",
  },
  "eternal-marble": {
    style: "Neoclassical",
    color: "Marble & Silver",
    season: "Any season",
    description: "A sculptural marble slab, cool silver typography, and neoclassical symmetry create enduring grandeur.",
    signature: "Neoclassical marble slab",
  },
  "willow-fern-embrace": {
    style: "Organic",
    color: "Fern & Sage",
    season: "Spring",
    description: "A living arch of willow and fern wraps the page in soft sage botanical elegance.",
    signature: "Willow fern embrace",
  },
  "silver-frost-gala": {
    style: "Winter Gala",
    color: "Silver & Frost",
    season: "Winter",
    description: "A crystalline gradient, mirrored details, and gala typography evoke a polished winter evening.",
    signature: "Silver frost gradient",
  },
  "autumn-ember-waltz": {
    style: "Autumn Romance",
    color: "Ember & Rosewood",
    season: "Fall",
    description: "Warm leaves, ember tones, and a dance-like header create a richly layered autumn celebration.",
    signature: "Ember leaf waltz",
  },
};

const PREVIEW_NAMES: Record<string, string> = {
  "gilded-wedding": "Amara & Julian",
  "modern-editorial": "Sloane & Ellis",
  "rustic-boho": "Maya & Theo",
  "cinematic-wedding": "Nora & Luca",
  "celestial-wedding": "Zara & Elias",
  "ethereal-classic": "Clara & Henry",
  "museum-wedding": "Imani & Felix",
  "ethereal-wedding": "Elena & Mateo",
  "noir-luxury": "Naomi & Adrian",
  "retro-70s": "Daisy & Jude",
  "newspaper-wedding": "Margot & Simon",
  "bauhaus-wedding": "Remi & Alex",
  "europe-coastal-wedding": "Sofia & Nico",
  "florida-coastal-wedding": "Camila & Rafael",
  "california-coastal-wedding": "Willa & Rowan",
  "winter-wedding": "Freya & Callum",
  "industrial-wedding": "Harper & Miles",
  "library-wedding": "Beatrice & Arthur",
  "garden-wedding": "Lily & James",
  "skyline-wedding": "Simone & Marcus",
  "midnight-elegance": "Celeste & Antoine",
  "wild-rose-halo": "Rosalie & Bennett",
  "golden-hour-promise": "Leila & Owen",
  "ivory-lace-crest": "Vivienne & Graham",
  "emerald-garden-vignette": "Esme & Dominic",
  "blush-linen-romance": "Maeve & Oliver",
  "sapphire-moonlit-arch": "Selene & August",
  "rustic-oak-storybook": "Hazel & Everett",
  "champagne-velvet": "Arielle & Sebastian",
  "celestial-whisper": "Lyra & Orion",
  "pearl-tide-horizon": "Marina & Dean",
  "crimson-orchard": "Scarlett & Vincent",
  "opaline-crest": "Odette & Laurent",
  "velvet-midnight-lily": "Liana & Cassian",
  "lavender-mist-cascade": "Iris & Emmett",
  "coral-sands-keepsake": "Isla & Kai",
  "eternal-marble": "Alessia & Roman",
  "willow-fern-embrace": "Willow & Finn",
  "silver-frost-gala": "Bianca & Nikolai",
  "autumn-ember-waltz": "Autumn & Wesley",
};

export const weddingDesignCatalog: WeddingDesign[] = (
  weddingTemplateCatalog as WeddingCatalogEntry[]
).map((design) => {
  const details = DESIGN_DETAILS[design.id];
  if (!details) {
    throw new Error(`Wedding design metadata is missing for ${design.id}`);
  }

  return {
    ...design,
    ...details,
    previewNames: PREVIEW_NAMES[design.id] || "Your Names",
  };
});

export const weddingDesignStyles = [
  "All styles",
  ...Array.from(new Set(weddingDesignCatalog.map((design) => design.style))).sort(),
];

export const weddingDesignColors = [
  "All colors",
  ...Array.from(new Set(weddingDesignCatalog.map((design) => design.color))).sort(),
];

export const weddingDesignSeasons = [
  "All seasons",
  ...Array.from(new Set(weddingDesignCatalog.map((design) => design.season))).sort(),
];

export function getWeddingDesign(id?: string | null) {
  return weddingDesignCatalog.find((design) => design.id === id) || weddingDesignCatalog[0];
}
