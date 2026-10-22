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
  ? name.includes("module.css") ? { shell: "shell", header: "header" } : {} : require(name), mod, mod.exports);
const Header = mod.exports.default;
const css = fs.readFileSync(path.resolve("src/components/templates/themed-event-header.module.css"), "utf8");
const h = React.createElement;
const artwork = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#32694f"/><circle cx="300" cy="350" r="170" fill="#d5b976"/></svg>')}`;

test("authored Event Page headers fit mobile and narrow desktop editors while retaining their desktop composition", { timeout: 60000 }, async () => {
  const cases = ["editorial", "arch", "oval", "postcard", "poster", "framed", "organic", "panorama", "journal"];
  const markup = cases.map((composition, index) => {
    const design = { id: composition, composition, editorLayout: index === 0 ? "split" : "banner", font: "Georgia, serif", background: "#f8f2e8", ink: "#332b25", accent: "#936e43" };
    return `<article data-case="${composition}">${renderToStaticMarkup(h(Header, { design },
      h("div", { className: "artwork" }, h("img", { src: artwork, alt: "Original event artwork" })),
      h("div", { className: "copy" }, h("p", null, "You’re invited"), h("h1", null, "A celebration together"), h("p", null, "Saturday · 2:00 PM"), h("p", null, "Useful details and guest information.")),
    ))}</article>`;
  }).join("");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage();
  try {
    await page.setContent(`<style>${css}*{box-sizing:border-box}body{margin:0}article{max-width:1100px;margin:20px auto;background:#f8f2e8;color:#332b25}.artwork{aspect-ratio:16/9}.copy{padding:32px}h1{font-size:clamp(24px,4vw,48px);overflow-wrap:anywhere}p{line-height:1.6}</style>${markup}`);
    for (const width of [360, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const composition of cases) {
        const article = page.locator(`[data-case="${composition}"]`);
        assert.ok(await article.evaluate((element) => element.scrollWidth <= element.clientWidth + 1), `${composition} fits ${width}px`);
        const image = await article.locator("img").boundingBox();
        const copy = await article.locator(".copy").boundingBox();
        assert.ok(image.width > 100 && image.height > 100, `${composition} retains usable artwork at ${width}px`);
        assert.ok(copy.width > 100, `${composition} retains usable event copy at ${width}px`);
        if (composition === "editorial") assert.equal(Math.abs(image.y - copy.y) < 1, width >= 768, `split header composition at ${width}px`);
      }
    }
    await page.addStyleTag({ content: "article{max-width:430px}" });
    const narrow = page.locator('[data-case="editorial"]');
    const image = await narrow.locator("img").boundingBox();
    const copy = await narrow.locator(".copy").boundingBox();
    assert.ok(copy.y >= image.y + image.height - 1, "narrow editor stacks even when desktop viewport is wide");
  } finally { await browser.close(); }
});
