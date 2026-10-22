import type { GeneralEventDesign } from "@/lib/general-event-designs";

export type ThemedEventCollectionId = "bridal-showers" | "graduations" | "housewarming" | "open-house" | "religious-events" | "dance" | "cheerleading" | "basketball" | "baseball" | "softball" | "soccer" | "volleyball" | "hockey" | "lacrosse" | "tennis" | "track-field" | "swimming" | "wrestling";
export type ThemedEventEditorLayout = "split" | "banner" | "poster" | "editorial" | "spotlight" | "minimal" | "cards";
export type ThemedEventBodyPresentation = { surface: "paper" | "dark" | "tinted"; sectionStyle: "cards" | "ruled" | "open" | "panels" | "timeline"; alignment: "left" | "center"; borderRadius: string; spacing: "airy" | "compact" | "balanced" };
export type ArtMedium = "photography" | "gouache" | "watercolor" | "cut-paper" | "screenprint" | "linocut" | "clay-3d" | "collage";
export type ArtTreatment = keyof typeof ART_TREATMENTS;
export type ArtDirection = { version: 2; medium: ArtMedium; treatment: string; camera: string; lighting: string; composition: string; avoid: string[]; promptOverride?: string };
export type PageRecipe = { background: string; ink: string; accent: string; font: string; composition: GeneralEventDesign["composition"]; editorLayout: ThemedEventEditorLayout; bodyPresentation: ThemedEventBodyPresentation };
export type AuthoredScene = { name: string; brief: string; artDirection: ArtDirection; page: PageRecipe };
export type AuthoredTheme = { name: string; subtype: string; style: string; scenes: AuthoredScene[] };
const serif = '"Playfair Display", Georgia, serif';
const classic = '"Libre Baskerville", Georgia, serif';
const sans = '"Space Grotesk", Arial, sans-serif';
const display = '"Bebas Neue", Impact, sans-serif';

// A treatment is an intentional visual/page pairing. Authors choose one per
// scene; no scene index or collection index assigns its appearance.
export const ART_TREATMENTS = {
  crisp: { medium: "photography", treatment: "crisp contemporary editorial photograph with natural colors and deep readable depth", colors: ["#edf4f2", "#193d3a", "#297f75"], font: sans, composition: "editorial", layout: "split", surface: "tinted", sections: "ruled" },
  documentary: { medium: "photography", treatment: "candid environmental documentary photograph, human gesture and authentic spatial context", colors: ["#f2eee6", "#292d32", "#9c5038"], font: classic, composition: "journal", layout: "editorial", surface: "paper", sections: "open" },
  architectural: { medium: "photography", treatment: "precise architectural photograph, strong perspective and deliberate geometric framing", colors: ["#edf1f7", "#233450", "#416997"], font: sans, composition: "panorama", layout: "banner", surface: "tinted", sections: "panels" },
  dramatic: { medium: "photography", treatment: "cinematic editorial photograph with bold directional contrast and convincing material texture", colors: ["#122b3e", "#f2f7ff", "#80d0e5"], font: display, composition: "framed", layout: "spotlight", surface: "dark", sections: "cards" },
  macro: { medium: "photography", treatment: "tactile close-focus fine-art photograph, abstract material rhythm and precise subject detail", colors: ["#f8f0e6", "#433126", "#986145"], font: serif, composition: "oval", layout: "minimal", surface: "paper", sections: "open" },
  aerial: { medium: "photography", treatment: "high-vantage graphic editorial photograph, spatial patterns and clean convincing scale", colors: ["#e8f0e2", "#25402b", "#628344"], font: sans, composition: "postcard", layout: "cards", surface: "tinted", sections: "cards" },
  gouache: { medium: "gouache", treatment: "original hand-painted gouache and colored-pencil illustration, matte pigments and visibly irregular painted edges", colors: ["#fbf0de", "#313352", "#b15154"], font: serif, composition: "organic", layout: "poster", surface: "paper", sections: "panels" },
  watercolor: { medium: "watercolor", treatment: "original expressive watercolor illustration, transparent washes and loose intentional brushwork on textured paper", colors: ["#f7f3ea", "#354340", "#7e6c97"], font: classic, composition: "arch", layout: "split", surface: "paper", sections: "ruled" },
  paper: { medium: "cut-paper", treatment: "tangible layered cut-paper sculpture, crisp dimensional shadows and visible paper fibers", colors: ["#18294e", "#f5f5fc", "#e1c55e"], font: sans, composition: "poster", layout: "poster", surface: "dark", sections: "panels" },
  screenprint: { medium: "screenprint", treatment: "original limited-ink screenprint illustration, confident flat shapes, slight ink registration and tactile grain", colors: ["#fbecd5", "#302c4d", "#b64439"], font: display, composition: "poster", layout: "banner", surface: "paper", sections: "ruled" },
  linocut: { medium: "linocut", treatment: "original hand-carved linocut illustration, expressive carved marks and striking positive-negative shapes", colors: ["#f5f0db", "#25463f", "#b46842"], font: classic, composition: "framed", layout: "editorial", surface: "paper", sections: "timeline" },
  clay: { medium: "clay-3d", treatment: "sophisticated handcrafted clay miniature sculpture, tactile thumbprint surfaces, sculptural depth, editorial studio art", colors: ["#f4e8ef", "#4a2843", "#ac547e"], font: sans, composition: "oval", layout: "cards", surface: "tinted", sections: "cards" },
  collage: { medium: "collage", treatment: "original mixed-paper editorial collage, torn-paper edges, unexpected scale and drawn connecting marks", colors: ["#ebedf7", "#30304f", "#6b59a7"], font: serif, composition: "journal", layout: "minimal", surface: "tinted", sections: "open" },
} as const;

export function scene(name: string, brief: string, treatment: ArtTreatment, camera: string, lighting: string, composition: string, page?: Partial<PageRecipe>, promptOverride?: string): AuthoredScene {
  const recipe = ART_TREATMENTS[treatment];
  return { name, brief, artDirection: { version: 2, medium: recipe.medium, treatment: recipe.treatment, camera, lighting, composition, avoid: ["generic warm window-lit tabletop still life", "identical centered prop arrangement", "unrelated category motifs"], ...(promptOverride ? { promptOverride } : {}) }, page: { background: recipe.colors[0], ink: recipe.colors[1], accent: recipe.colors[2], font: recipe.font, composition: recipe.composition, editorLayout: recipe.layout, bodyPresentation: { surface: recipe.surface, sectionStyle: recipe.sections, alignment: ["paper", "gouache", "screenprint"].includes(treatment) ? "center" : "left", borderRadius: ["architectural", "screenprint", "paper", "linocut"].includes(treatment) ? "0rem" : "1rem", spacing: ["macro", "clay"].includes(treatment) ? "compact" : "airy" }, ...page } };
}
export function theme(name: string, subtype: string, style: string, scenes: AuthoredScene[]): AuthoredTheme { return { name, subtype, style, scenes }; }
