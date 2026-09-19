import type { StudioProduct } from "./product-contract.ts";
import { stripArtworkPreservationInstructions } from "../concierge/visual-direction.ts";

export type PageTypography = { scale?: number; contrast?: "high"; foreground?: "dark" | "light" };
export type ProductEditPlan = {
  rasterInstruction: string;
  hasRasterChanges: boolean;
  pageTypography: PageTypography;
  unsupportedPageChanges: string[];
};

function splitEditClauses(instruction: string): string[] {
  const quotedCopy: string[] = [];
  const protectedInstruction = instruction.replace(/"[^"]*"|“[^”]*”|‘[^’]*’|(?<![\p{L}\p{N}])'(?:[^']|'(?=[\p{L}\p{N}]))*'(?![\p{L}\p{N}])/gu, (copy) => {
    quotedCopy.push(copy);
    return `__COPY_${quotedCopy.length - 1}__`;
  });
  return protectedInstruction
    .split(/(?:[,;.!]|\b(?:and|plus|while|with)\b(?=\s+(?:the\s+|make\b|change\b|set\b|move\b|use\b|add\b|include\b|remove\b|reorder\b|darken\b|lighten\b|background\b|lettering\b|text\b|font\b|title\b|larger\b|bigger\b|smaller\b|bold\b|italic\b|cursive\b|dark(?:er)?\b|light(?:er)?\b|white\b|black\b)))\s*/i)
    .filter(Boolean)
    .map((clause) => clause.replace(/__COPY_(\d+)__/g, (_, index: string) => quotedCopy[Number(index)] ?? ""));
}

/** Keep HTML type requirements out of text-free image generation and vision checks. */
export function resolveProductEditPlan(product: StudioProduct, instruction: string): ProductEditPlan {
  const cleaned = instruction.trim();
  if (product !== "event_page") return { rasterInstruction: cleaned, hasRasterChanges: Boolean(cleaned), pageTypography: {}, unsupportedPageChanges: [] };
  const pageTypography: PageTypography = {};
  const rasterClauses: string[] = [];
  const unsupportedPageChanges: string[] = [];
  const scoped = stripArtworkPreservationInstructions(cleaned)
    .replace(/\b(?:keep|preserve|leave)\b[^.!;\n]*(?:\b(?:same|unchanged|approved|facts|copy)\b)[^.!;\n]*/gi, "")
    .replace(/\b(?:do not|don't|don’t)\s+(?:change|alter|redraw|regenerate)\b[^.!;\n]*/gi, "")
    .replace(/\b(larger|bigger)\s+and\s+(more\s+)?(readable|legible)/gi, "$1 $2$3");
  for (const clause of splitEditClauses(scoped)) {
    const typeMention = clause.match(/\b(?:text|type|typography|lettering|letters|font|heading|headline|title|wording)\b/i);
    const typeTarget = Boolean(typeMention);
    const copyOperation = /^(?:please\s+)?(?:add|include|insert|remove|delete|drop|omit|show|display|use|keep)\s+(?:(?:the|this|an?|exact|required|following)\s+)*(?:title|heading|headline|name|wording|text|line|date|time|venue|location|address|rsvp|contact)\b/i.test(clause);
    const requestedCopyPlacement = !/["“‘']/.test(clause) && /\b(?:title|heading|headline|name|wording|text|line|date|time|details)\s+(?:above|below|under|beneath|beside|at\s+the\s+(?:top|bottom)|to\s+the\s+(?:left|right)|in\s+(?:the\s+)?(?:center|centre|columns?|cursive|italic|bold|serif|blue|red|green|black|white))\b/i.test(clause);
    if (copyOperation && !requestedCopyPlacement) continue;
    const replacement = clause.match(/\b(?:change|set|rename|correct|update)\b.*?\b(?:title|name|wording|text|line|date|time|venue|location|address|contact)\s+(?:to|with|is)\s+(.+)/i)?.[1];
    const styleOnlyReplacement = replacement && /^(?:(?:a|the)\s+)?(?:cursive|serif|sans[- ]serif|italic|bold|calligraphy|larger|bigger|smaller|blue|red|green|white|black|darker|lighter)(?:\s+(?:font|type|text|lettering))?$/i.test(replacement.trim());
    const contentChange = (
      (replacement && !styleOnlyReplacement) ||
      /\breplace\b.+\bwith\b/i.test(clause) ||
      /\b(?:add|include|use|keep)\b.*\b(?:exact\s+(?:line|wording|text)|line\s+["“‘'])/i.test(clause)
    );
    if (contentChange || /\b(?:change|move|correct|update|set)\b.*\b(?:date|time|venue|location|address|rsvp|contact)\b/i.test(clause)) continue;
    // An incidental title reference does not make the title the edit target.
    // For example, darkening the background behind it changes only the raster.
    const rasterMention = clause.match(/\b(?:background|artwork|image|illustration|scene|photo|picture|hero|area|region|balloons?|flowers?|props?|people|characters?|decorations?|objects?|shapes?)\b(?!\s+(?:title|heading|headline|text|lettering)\b)/i);
    if (rasterMention && (!typeMention || (rasterMention.index ?? 0) < (typeMention.index ?? 0))) {
      rasterClauses.push(clause.trim());
      continue;
    }
    const larger = /\b(?:larger|bigger|increase|enlarge)\b/i.test(clause);
    const readable = /\b(?:readable|legible|contrast|readability|white|black|dark(?:er)?|light(?:er)?|brighter)\b/i.test(clause);
    if (typeTarget && (larger || readable)) {
      if (larger) pageTypography.scale = 1.2;
      if (readable || larger) pageTypography.contrast = "high";
      if (/\b(?:black|dark(?:er)?)\b/i.test(clause)) pageTypography.foreground = "dark";
      else if (/\b(?:white|light(?:er)?|brighter)\b/i.test(clause)) pageTypography.foreground = "light";
      // Preserve an independently requested background change in a mixed clause.
      const background = clause.match(/\b(?:make\s+)?(?:the\s+)?(?:background|artwork|image|hero)\s+(?:a\s+bit\s+)?(?:darker|lighter|brighter|dark|light)\b/i)?.[0];
      if (background) rasterClauses.push(background);
    } else if (typeTarget || /\b(?:cursive|serif|sans[- ]serif|italic|bold|calligraphy|columns?|page\s+layout|section\s+(?:order|layout)|move\s+(?:the\s+)?(?:heading|title|section)|reorder\s+(?:the\s+)?sections?)\b/i.test(clause)) {
      unsupportedPageChanges.push(clause.trim());
    } else {
      rasterClauses.push(clause.trim());
    }
  }
  const rasterInstruction = rasterClauses.join(". ");
  return { rasterInstruction, hasRasterChanges: Boolean(rasterInstruction), pageTypography, unsupportedPageChanges };
}
