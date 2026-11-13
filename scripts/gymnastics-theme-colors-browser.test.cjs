const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { chromium } = require('playwright');
const compiled = require('next/dist/compiled/webpack/webpack');
compiled.init();

test('all 60 gymnastics templates and all six choices change real titles without changing any canvas backgrounds', { timeout: 180000 }, async () => {
  const output = path.resolve('.qa/gymnastics-theme-colors');
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({ mode: 'development', target: 'web', devtool: false,
      entry: path.resolve('scripts/fixtures/gymnastics-theme-colors.tsx'), output: { path: output, filename: 'fixture.js' },
      plugins: [new compiled.webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }), new compiled.webpack.DefinePlugin({ 'process.env': JSON.stringify({ NODE_ENV: 'test' }) })],
      resolve: { extensions: ['.tsx', '.ts', '.js', '.json'], alias: { '@': path.resolve('src'), 'next/navigation': path.resolve('scripts/fixtures/signup-editor/navigation.ts'), 'next-auth/react': path.resolve('scripts/fixtures/event-editor-auth.tsx') } },
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve('scripts/lib/create-guest-ts-loader.cjs') },
        { test: /\.css$/, use: path.resolve('scripts/lib/event-editor-css-loader.cjs') },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors() ? reject(error || Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const script = fs.readFileSync(path.join(output, 'fixture.js'));
  const appCss = (await require('postcss')([require('@tailwindcss/postcss')()]).process(
    fs.readFileSync('src/app/globals.css', 'utf8'), { from: path.resolve('src/app/globals.css') },
  )).css;
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64');
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/app.css') return route.fulfill({ contentType: 'text/css', body: appCss });
      if (url.pathname === '/fixture.js') return route.fulfill({ contentType: 'text/javascript', body: script });
      if (url.pathname === '/media/event-media/retained.png') return route.fulfill({ contentType: 'image/png', body: pixel });
      if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><style>body{margin:0} [data-audit-controls]{position:fixed;right:0;top:0;max-width:24rem;z-index:100} [data-audit-canvas]{max-width:1200px} button{cursor:pointer}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>' });
      return route.abort();
    });
    await page.goto('http://localhost:43142/');
    await page.waitForFunction(() => window.themeAudit);
    for (const profile of [{ width: 1440, dark: false, editing: true }, { width: 1440, dark: true, editing: false }, { width: 390, dark: false, editing: false }, { width: 390, dark: true, editing: true }]) {
      await page.setViewportSize({ width: profile.width, height: 900 });
      await page.emulateMedia({ colorScheme: profile.dark ? 'dark' : 'light' });
      const result = await page.evaluate(async profile => {
        document.documentElement.classList.toggle('dark', profile.dark);
        const failures = [], records = [];
        const frame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const rgb = hex => { const node = document.createElement('span'); node.style.color = hex; return node.style.color; };
        const read = () => {
          const root = document.querySelector('[data-gym-design]');
          return {
            title: getComputedStyle(root.querySelector('h1')).color,
            background: [...root.querySelectorAll('*'), root].filter(el => !el.closest('button, a, input, select, textarea')).map(el => {
              const css = getComputedStyle(el); return [el.tagName, el.getAttribute("class"), css.backgroundColor, css.backgroundImage];
            }),
            font: getComputedStyle(root.querySelector('h1')).fontFamily,
            sectionHeadings: [...root.querySelectorAll('[class*="_chapterHeading"] h2, [class*="_panel"] > h2')].map(el => ({
              color: getComputedStyle(el).color, inverse: root.dataset.heading === 'ribbon' && Boolean(el.closest('[class*="_chapterHeading"]')),
            })),
            link: getComputedStyle(root.querySelector('a[href="https://example.test/visitor-guide"]')).color,
          };
        };
        for (const [designIndex, design] of window.themeAudit.designs.entries()) {
          window.themeAudit.open({ id: design.id, variant: designIndex % 4, editing: profile.editing });
          await frame();
          const root = document.querySelector('[data-gym-design]');
          const controls = document.querySelector('[aria-label="Theme color combinations"]');
          const buttons = [...controls.querySelectorAll('button')];
          if (buttons.length !== 6 || buttons.some(button => /Ocean blue|Rose & violet/.test(button.textContent))) failures.push(`${design.id}: old palette controls`);
          // Start from the native template even for saved accent choices.
          buttons[0].click(); await frame();
          const before = read();
          const generated = designIndex % 4 === 0 || designIndex % 4 === 3;
          if (getComputedStyle(root).getPropertyValue('--gym-paper').trim() !== (generated ? '#111b3a' : design.background)) failures.push(`${design.id}: saved background lost`);
          const titleColors = [before.title];
          for (let index = 0; index < 6; index++) {
            document.querySelector('[aria-label="Theme color combinations"]').querySelectorAll('button')[index].click();
            await frame();
            const after = read(), expected = (generated ? design.generatedCombinations : design.combinations)[index];
            if (JSON.stringify(after.background) !== JSON.stringify(before.background)) {
              const differences = after.background.map((row, i) => JSON.stringify(row) === JSON.stringify(before.background[i]) ? null : { before: before.background[i], after: row }).filter(Boolean);
              failures.push(`${design.id}/${index}: background changed ${designIndex === 0 && index === 1 ? JSON.stringify(differences.slice(0, 5)) : ''}`);
            }
            if (after.font !== before.font) failures.push(`${design.id}/${index}: font changed`);
            if (index) {
              titleColors.push(after.title);
              if (after.title !== rgb(expected.heading) || after.title === before.title) failures.push(`${design.id}/${index}: title did not change to selected color`);
              if (!after.sectionHeadings.length) failures.push(`${design.id}/${index}: section headings missing`);
              for (const heading of after.sectionHeadings) if (heading.color !== rgb(heading.inverse ? expected.inverseHeading : expected.heading)) failures.push(`${design.id}/${index}: section title color`);
              if (after.link !== rgb(expected.link)) failures.push(`${design.id}/${index}: link color`);
            }
            if (!root.querySelector('img[src="/media/event-media/retained.png"]')) failures.push(`${design.id}/${index}: artwork changed`);
          }
          if (new Set(titleColors).size !== 6) failures.push(`${design.id}: six choices need six distinct title colors`);
          records.push({ id: design.id, titleColors });
        }
        return { failures, count: records.length, records };
      }, profile);
      fs.writeFileSync(path.join(output, `colors-${profile.width}-${profile.dark ? 'dark' : 'light'}-${profile.editing ? 'editor' : 'guest'}.json`), JSON.stringify(result, null, 2));
      assert.equal(result.count, 60);
      assert.deepEqual(result.failures, [], JSON.stringify(profile));
      process.stdout.write(`Verified ${result.count} templates × 6 choices at ${profile.width}px, ${profile.dark ? "dark" : "light"}, ${profile.editing ? "editor" : "guest"}.\n`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
