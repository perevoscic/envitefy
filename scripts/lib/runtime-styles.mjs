import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, gzipSync } from "node:zlib";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));

// Paths are relative to globals.css, just like Tailwind's ordinary @source rules.
// Keep the public dialogs, deferred showcase and persistent chrome in this set.
// The sidebar, account onboarding and event editor load the complete stylesheet.
export const LANDING_STYLE_SOURCES = [
  "./landing",
  "./layout.tsx",
  "./AppShell.tsx",
  "./providers.tsx",
  "./event-cache-context.tsx",
  "./sidebar-context.tsx",
  "./GlobalEventCreate.tsx",
  "./GlobalSmartSignup.tsx",
  "../components/auth/AuthModal.tsx",
  "../components/auth/LoginForm.tsx",
  "../components/auth/SignupForm.tsx",
  "../components/branding/EnvitefyBrandImage.tsx",
  "../components/branding/EnvitefySocialLinks.tsx",
  "../components/branding/EnvitefyWordmark.tsx",
  "../components/navigation/ConciergeLauncher.tsx",
  "../components/navigation/ConciergeSheet.tsx",
  "../components/navigation/MenuBottomSheet.tsx",
  "../components/navigation/concierge-popover.ts",
  "../components/navigation/useScrollAwareHeader.ts",
  "../components/ui/AnimatedBorderButton.tsx",
  "../components/ui/ArrowFillButton.tsx",
  "../components/ui/ArrowFillLink.tsx",
  "../components/ui/LiquidMetalButton.tsx",
  "../components/ui/button.tsx",
  "../components/ui/gradient-backgrounds.tsx",
  "../components/landing/LandingLiveCardShowcase.tsx",
  "../components/AppearanceProvider.tsx",
  "../components/AppearanceSelector.tsx",
  "../components/CalendarAction.tsx",
  "../components/CalendarIcons.tsx",
  "../components/CoHostInvitationProvider.tsx",
  "../components/ConditionalFooter.tsx",
  "../components/MainContentWrapper.tsx",
  "../components/MobileOverflowReporter.tsx",
  "../components/PrivacyControls.tsx",
  "../components/PwaInstallToast.tsx",
  "../components/UnsavedProgressProvider.tsx",
  "../components/marketing/MarketingPage.tsx",
  "../components/marketing/MarketingMotion.tsx",
  "../components/studio/LiveCardArtworkFrame.tsx",
  "../components/studio/LiveCardHeroTextOverlay.tsx",
  "../components/studio/SharedCardTextLayer.tsx",
  "../components/studio/StudioLiveCardActionSurface.tsx",
  "../components/studio/StudioShowcaseLiveCard.tsx",
  "../config/navigation.ts",
  "../config/navigation-config.tsx",
  "../config/feature-visibility.ts",
  "../contexts/MenuContext.tsx",
  "../hooks/use-artwork-aspect-ratio.ts",
  "../hooks/useCalendarPreference.ts",
  "../hooks/useEventCategories.ts",
  "../hooks/useFeatureVisibility.ts",
  "../hooks/useModalDialog.ts",
  "../hooks/useRecaptcha.ts",
];

// Retain every descriptor (including language ranges and weights) for a family
// referenced by public source or its CSS modules. Resolve the global font-stack
// variables first so var(--font-...) choices cannot silently lose their faces.
export function selectGalleryFontFaces(catalog, references, canonical = "") {
  let expanded = references;
  postcss.parse(canonical).walkDecls((declaration) => {
    if (declaration.prop.startsWith("--font-") && references.includes(`var(${declaration.prop}`)) {
      expanded += `\n${declaration.value}`;
    }
  });
  const faces = [];
  postcss.parse(catalog).walkAtRules("font-face", (rule) => {
    const family = rule.nodes.find((node) => node.prop === "font-family")?.value.replace(/^["']|["']$/g, "");
    if (!family) throw new Error("Gallery font descriptor is missing its family");
    const escaped = family.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const quoted = new RegExp(`["']\\s*${escaped}\\s*(?:["']|,)`, "i");
    const unquoted = new RegExp(`(?:font-family|fontFamily)\\s*:\\s*${escaped}\\s*(?:[,;}]|$)`, "i");
    if (quoted.test(expanded) || unquoted.test(expanded)) faces.push(rule.toString());
  });
  return faces.join("\n");
}

export function createLandingStylesheet(source, { sources = LANDING_STYLE_SOURCES, galleryFontCss = "" } = {}) {
  const document = postcss.parse(source);
  let foundTailwind = false;
  let foundGallery = false;
  document.walkAtRules("import", (rule) => {
    if (/^["']tailwindcss["'](?:\s|$)/.test(rule.params)) {
      rule.params = '"tailwindcss" source(none)';
      foundTailwind = true;
    }
    if (/^["']\.\/gallery-fonts\.css["']$/.test(rule.params)) {
      rule.remove();
      foundGallery = true;
    }
  });
  if (!foundTailwind || !foundGallery) {
    throw new Error("Expected the canonical Tailwind and gallery-fonts imports in globals.css");
  }
  if (galleryFontCss) {
    const lastImport = [...document.nodes].reverse().find((node) => node.type === "atrule" && node.name === "import");
    document.insertAfter(lastImport, postcss.parse(galleryFontCss).nodes);
  }
  // Retain canonical negative rules, but replace its broad/dynamic sources.
  document.walkAtRules("source", (rule) => {
    if (!rule.params.startsWith("not ")) rule.remove();
  });
  for (const sourcePath of sources) {
    if (typeof sourcePath !== "string" || /["\r\n\\]/.test(sourcePath)) {
      throw new Error(`Invalid landing stylesheet source: ${sourcePath}`);
    }
    document.append(postcss.atRule({ name: "source", params: JSON.stringify(sourcePath) }));
  }
  return document.toString();
}

async function publicFontReferences(root, sources) {
  const visited = new Set();
  const references = [];
  const canonical = path.join(root, "src/app/globals.css");
  async function visit(filename) {
    if (visited.has(filename) || filename === canonical || /\.(?:test|spec|stories|story)\./.test(filename)) return;
    visited.add(filename);
    const entry = await stat(filename);
    if (entry.isDirectory()) {
      for (const name of await readdir(filename)) {
        if (["__tests__", "__fixtures__", "fixtures"].includes(name)) continue;
        await visit(path.join(filename, name));
      }
    } else if (/\.(?:[cm]?[jt]sx?|css|json|mdx?|html)$/.test(filename)) {
      const text = await readFile(filename, "utf8");
      references.push(text);
      for (const match of text.matchAll(/["']((?:@\/|\.{1,2}\/)[^"']+\.css)["']/g)) {
        const imported = match[1].startsWith("@/")
          ? path.join(root, "src", match[1].slice(2))
          : path.resolve(path.dirname(filename), match[1]);
        await visit(imported);
      }
    }
  }
  for (const source of sources) await visit(path.resolve(path.dirname(canonical), source));
  return references.join("\n");
}

export function describeRuntimeStylesheet(css, scope) {
  const bytes = Buffer.from(css);
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  return {
    href: `/styles/runtime/${scope}.${hash}.css`,
    bytes: bytes.length,
    gzipBytes: gzipSync(bytes).length,
    brotliBytes: brotliCompressSync(bytes).length,
  };
}

export async function compileRuntimeStyles({ root = projectRoot, sources = LANDING_STYLE_SOURCES } = {}) {
  const stylesheet = path.join(root, "src/app/globals.css");
  const source = await readFile(stylesheet, "utf8");
  const galleryFontCss = selectGalleryFontFaces(
    await readFile(path.join(root, "src/app/gallery-fonts.css"), "utf8"),
    await publicFontReferences(root, sources),
    source,
  );
  const inputs = {
    application: source,
    landing: createLandingStylesheet(source, { sources, galleryFontCss }),
  };
  const result = {};
  // Separate virtual input names prevent candidate caches crossing scopes.
  for (const [scope, input] of Object.entries(inputs)) {
    const compiled = await postcss([
      tailwind({ base: path.join(root, "src"), optimize: { minify: true } }),
    ]).process(input, {
      from: scope === "application" ? stylesheet : path.join(root, "src/app/.runtime-landing.css"),
      map: false,
    });
    if (compiled.warnings().length) {
      throw new Error(`Runtime ${scope} CSS: ${compiled.warnings().map((warning) => warning.text).join("; ")}`);
    }
    result[scope] = { css: compiled.css, ...describeRuntimeStylesheet(compiled.css, scope) };
  }
  return result;
}

async function writeIfChanged(filename, value) {
  try {
    if (await readFile(filename, "utf8") === value) return false;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, value, "utf8");
  return true;
}

export async function writeRuntimeStyles(compiled, {
  root = projectRoot,
  outputDirectory = path.join(root, "public/styles/runtime"),
  manifestPath = path.join(root, "src/generated/runtime-styles.json"),
  deploymentId = process.env.VERCEL_SKEW_PROTECTION_ENABLED === "1"
    ? process.env.VERCEL_DEPLOYMENT_ID
    : undefined,
} = {}) {
  const manifest = { version: 1 };
  for (const scope of ["application", "landing"]) {
    const { css, ...description } = compiled[scope];
    await writeIfChanged(path.join(outputDirectory, path.basename(description.href)), css);
    // Custom public assets need the same deployment pin as Next-managed assets
    // so a tab opened before a rollout can still load its application CSS.
    manifest[scope] = deploymentId
      ? { ...description, href: `${description.href}?dpl=${encodeURIComponent(deploymentId)}` }
      : description;
  }
  // Keep previous hashes in this workspace for overlapping local builds. Fresh
  // deployment environments retain only assets available in their own build.
  await writeIfChanged(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

export async function generateRuntimeStyles(options = {}) {
  return writeRuntimeStyles(await compileRuntimeStyles(options), options);
}
