const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { chromium } = require("playwright");
const ts = require("typescript");

const file = path.resolve("src/components/templates/ThemedEventHeader.tsx");
const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
  fileName: file, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const mod = { exports: {} };
new Function("require", "module", "exports", source)((name) => name.endsWith(".css")
  ? name.includes("module.css") ? { shell: "shell", header: "header", artwork: "artworkSlot", copy: "copySlot" } : {} : require(name), mod, mod.exports);
const Header = mod.exports.default;
const css = fs.readFileSync(path.resolve("src/components/templates/themed-event-header.module.css"), "utf8")
  .replace(/\.artwork\b/g, ".artworkSlot").replace(/\.copy\b/g, ".copySlot");
const h = React.createElement;
const artwork = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#32694f"/><circle cx="300" cy="350" r="170" fill="#d5b976"/></svg>')}`;

test("all authored artwork/page arrangements remain distinct, fit editor widths, and keep image controls usable", { timeout: 60000 }, async () => {
  const compositions = ["editorial", "arch", "oval", "postcard", "poster", "framed", "organic", "panorama", "journal"];
  const layouts = ["split", "banner", "poster", "editorial", "spotlight", "minimal", "cards"];
  const cases = layouts.flatMap((editorLayout) => compositions.map((composition) => ({ editorLayout, composition, id: `${editorLayout}-${composition}` })));
  const markup = cases.map(({ editorLayout, composition, id }) => {
    const design = { id, composition, editorLayout, font: "Georgia, serif", background: "#f8f2e8", ink: "#332b25", accent: "#936e43" };
    return `<article data-case="${id}">${renderToStaticMarkup(h(Header, { design },
      h("div", { className: "media" }, h("img", { src: artwork, alt: "Original event artwork" }), h("button", { type: "button", className: "change", "aria-label": `Change ${id}` }, "Change image")),
      h("div", { className: "eventCopy" }, h("p", null, "You’re invited"), h("h1", null, "A celebration together"), h("p", null, "Saturday · 2:00 PM"), h("p", null, "Useful details and guest information.")),
    ))}</article>`;
  }).join("");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage();
  try {
    await page.setContent(`<style>${css}*{box-sizing:border-box}body{margin:0}article{max-width:1100px;margin:20px auto;background:#f8f2e8;color:#332b25}.media{position:relative;aspect-ratio:16/9}.eventCopy{padding:32px}h1{font-size:clamp(24px,4vw,48px);overflow-wrap:anywhere}p{line-height:1.6}.change{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);height:44px;min-width:140px;z-index:10;border-radius:24px}</style>${markup}`);
    for (const width of [360, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const { editorLayout, composition, id } of cases) {
        const article = page.locator(`[data-case="${id}"]`);
        assert.ok(await article.evaluate((element) => element.scrollWidth <= element.clientWidth + 1), `${id} fits ${width}px`);
        const image = await article.locator("img").boundingBox();
        const copy = await article.locator("[data-themed-header-copy]").boundingBox();
        assert.ok(image.width > 100 && image.height > 100, `${id} retains usable artwork at ${width}px`);
        assert.ok(copy.width > 100, `${id} retains usable event copy at ${width}px`);
        const artworkAllowance = composition === "postcard" ? 20 : 1;
        if (editorLayout === "split") assert.equal(image.x + image.width <= copy.x + artworkAllowance, width >= 768, `split has image beside copy at ${width}px`);
        if (editorLayout === "editorial" && width >= 768) assert.ok(copy.x + copy.width <= image.x + 1, `${composition} editorial reverses its columns`);
        if (editorLayout === "poster" || editorLayout === "minimal") assert.ok(copy.y >= image.y + image.height - artworkAllowance, `${id} keeps its headline below its artwork`);
        const button = article.getByRole("button");
        await button.scrollIntoViewIfNeeded();
        assert.ok(await button.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === element;
        }), `${id} image controls remain clickable at ${width}px`);
      }
    }
    await page.addStyleTag({ content: "article{max-width:430px}" });
    const narrow = page.locator('[data-case="split-editorial"]');
    const image = await narrow.locator("img").boundingBox();
    const copy = await narrow.locator("[data-themed-header-copy]").boundingBox();
    assert.ok(copy.y >= image.y + image.height - 1, "narrow editor stacks even when desktop viewport is wide");
    await page.addStyleTag({ content: "article{background:#15242f;color:#ffe1ea}" });
    for (const editorLayout of layouts) {
      const header = page.locator(`[data-case="${editorLayout}-editorial"] [data-themed-event-header]`);
      assert.deepEqual(await header.evaluate((element) => ({ background: getComputedStyle(element).backgroundColor, ink: getComputedStyle(element).color })),
        { background: "rgb(21, 36, 47)", ink: "rgb(255, 225, 234)" }, `${editorLayout} retains the host's current palette`);
      assert.equal(await header.locator("h1").evaluate((element) => getComputedStyle(element).color), "rgb(255, 225, 234)");
    }
  } finally { await browser.close(); }
});
