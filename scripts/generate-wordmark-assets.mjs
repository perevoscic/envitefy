import { mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { chromium } from "playwright";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);

// Render the actual component with its bundled font so web and image logos share
// the same pair spacing. Legacy PNGs stay intact for previously sent mail/ads.
export async function wordmarkMarkup(tone) {
  const source = await readFile(join(root, "src/components/branding/EnvitefyWordmark.tsx"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    exports: module.exports,
    require: (name) => name.endsWith(".css") ? { adaptiveWordmark: "adaptiveWordmark" } : require(name),
  });
  return renderToStaticMarkup(React.createElement(module.exports.default, {
    scaled: false, appearance: "fixed", tone,
  }));
}

export async function wordmarkDocument(body) {
  const font = await readFile(join(root, "public/fonts/Josefin_Slab/JosefinSlab-VariableFont_wght.ttf"));
  return `<!doctype html><style>
    @font-face{font-family:"Josefin Slab";src:url(data:font/ttf;base64,${font.toString("base64")});font-weight:100 700;font-style:normal}
    :root{--font-josefin-slab:"Josefin Slab"}
    *{box-sizing:border-box}body{margin:0;background:transparent}
    .inline-block{display:inline-block}.whitespace-nowrap{white-space:nowrap}.align-middle{vertical-align:middle}
    .josefin-slab-variable{line-height:1.16;padding:.04em .14em .16em .02em}
    .adaptiveWordmark{background-image:none!important;color:white!important;-webkit-text-fill-color:white!important}
    #wordmark{display:inline-block;font-size:400px}
    </style>${body}`;
}

export async function generateWordmarkAssets() {
  const destination = join(root, "public/brand/wordmark-v2");
  const emailDestination = join(root, "public/email/wordmark-v2");
  await mkdir(destination, { recursive: true });
  await mkdir(join(emailDestination, "matte"), { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage({ viewport: { width: 1800, height: 700 }, deviceScaleFactor: 1 });
    for (const [tone, filename] of [["gradient", "envitefy-wordmark.webp"], ["light", "envitefy-wordmark-white.webp"]]) {
      await page.setContent(await wordmarkDocument(`<div id="wordmark">${await wordmarkMarkup(tone)}</div>`));
      await page.evaluate(() => document.fonts.ready);
      const fontLoaded = await page.evaluate(() => [...document.fonts].some((font) => font.family === "Josefin Slab" && font.status === "loaded"));
      if (!fontLoaded) throw new Error("The bundled Josefin Slab font did not load.");
      const capture = await page.locator("#wordmark").screenshot({ omitBackground: true });
      const trimmed = await sharp(capture).trim().png().toBuffer();
      const output = join(destination, filename);
      const result = spawnSync(process.env.FFMPEG_PATH || "ffmpeg", [
        "-hide_banner", "-loglevel", "error", "-y", "-i", "pipe:0",
        "-c:v", "libwebp", "-q:v", "85", "-compression_level", "6", output,
      ], { input: trimmed });
      if (result.status !== 0) throw new Error(result.error?.message || result.stderr.toString());
      const metadata = await sharp(output).metadata();
      if (metadata.format !== "webp" || !metadata.hasAlpha) throw new Error(`Invalid transparent WebP: ${output}`);
      // GIF is supported by inboxes that cannot display WebP. The matte variant
      // preserves all antialiased edges on the fixed email branding band.
      const emailName = tone === "light" ? "envitefy-wordmark-email-white.gif" : "envitefy-wordmark-email.gif";
      await sharp(trimmed).gif({ colours: 256, dither: 0 }).toFile(join(emailDestination, emailName));
      if (tone === "light") {
        await sharp(trimmed).flatten({ background: "#251F2D" }).gif({ colours: 256, dither: 0 })
          .toFile(join(emailDestination, "matte/envitefy-wordmark-email.gif"));
      }
      console.log(`${filename}: ${metadata.width} x ${metadata.height}, transparent WebP`);
    }
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await generateWordmarkAssets();
}
