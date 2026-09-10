import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Exercise the hook's requests and resource lifetime without a browser or real medical files.
function harness(
  fetchDocument = async () =>
    new Response("exact bytes", { headers: { "Content-Type": "image/png" } }),
) {
  const slots = [];
  const effects = [];
  const requests = [];
  const revoked = [];
  let nextUrl = 0;
  let cursor = 0;
  let original = {
    name: "sample.png",
    viewUrl: "/original",
    downloadUrl: "/original?download=1",
    ownerOnly: true,
  };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [
        slots[index],
        (value) => {
          slots[index] = typeof value === "function" ? value(slots[index]) : value;
        },
      ];
    },
    useCallback(callback) {
      return callback;
    },
    useEffect(callback, dependencies) {
      const index = cursor++;
      const previous = slots[index];
      if (previous && dependencies.every((value, i) => Object.is(value, previous.dependencies[i])))
        return;
      effects.push(() => {
        previous?.cleanup?.();
        slots[index] = { dependencies, cleanup: callback() };
      });
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(readFileSync(new URL("./useOriginalDocument.ts", import.meta.url), "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      module,
      exports: module.exports,
      require: () => react,
      File,
      AbortController,
      AbortSignal,
      URL: {
        createObjectURL: () => `blob:document-${++nextUrl}`,
        revokeObjectURL: (url) => revoked.push(url),
      },
      fetch: async (url, options) => {
        requests.push({ url, options });
        return fetchDocument(url, options);
      },
    },
  );
  return {
    requests,
    revoked,
    render(nextOriginal = original) {
      original = nextOriginal;
      cursor = 0;
      // biome-ignore lint/correctness/useHookAtTopLevel: This harness supplies the hook dispatcher.
      const result = module.exports.useOriginalDocument(original);
      for (const effect of effects.splice(0)) effect();
      return result;
    },
    dispose() {
      for (const slot of slots) slot?.cleanup?.();
    },
  };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test("preparing and reopening reuse one exact file and release it only when leaving", async () => {
  const h = harness();
  let state = h.render();
  assert.equal(h.requests.length, 0);
  state.prepare();
  state.prepare();
  h.render();
  await settle();
  state = h.render();
  assert.equal(await state.document.file.text(), "exact bytes");
  const loaded = state.document;
  state.prepare(); // Opening, closing and reopening the dialog must not replace the copy.
  state = h.render();
  assert.equal(state.document, loaded);
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0].options.cache, "no-store");
  assert.equal(h.requests[0].options.credentials, "same-origin");
  assert.equal(h.revoked.length, 0);
  h.dispose();
  assert.deepEqual(h.revoked, [loaded.url]);
});

test("failed preparation can be retried without keeping an error response as the original", async () => {
  let calls = 0;
  const h = harness(async () =>
    ++calls === 1 ? new Response("Not found", { status: 404 }) : new Response("recovered"),
  );
  h.render().prepare();
  h.render();
  await settle();
  const failed = h.render();
  assert.equal(failed.loadError, true);
  assert.equal(failed.document, null);
  failed.retry();
  h.render();
  await settle();
  assert.equal(h.render().loadError, false);
  assert.equal(await h.render().document.file.text(), "recovered");
  assert.equal(calls, 2);
  h.dispose();
});

test("leaving while the file is loading aborts the request and discards late bytes", async () => {
  let finish;
  const h = harness(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  h.render().prepare();
  h.render();
  h.dispose();
  assert.equal(h.requests[0].options.signal.aborted, true);
  finish(new Response("late bytes"));
  await settle();
  assert.equal(h.render().document, null);
  assert.equal(h.revoked.length, 0);
});

test("the small preview appears before the exact file finishes and is never used for saving or sharing", async () => {
  let finishOriginal;
  const h = harness((url) =>
    url.includes("display=1")
      ? new Response("webp preview", {
          headers: { "Content-Type": "image/webp", "X-Document-Variant": "display" },
        })
      : new Promise((resolve) => {
          finishOriginal = resolve;
        }),
  );
  h.render({
    name: "source.jpg",
    viewUrl: "/original",
    displayUrl: "/original?display=1",
    downloadUrl: "/original?download=1",
    ownerOnly: true,
  }).prepare();
  h.render();
  await settle();
  let state = h.render();
  assert.equal(await state.displayDocument.file.text(), "webp preview");
  assert.equal(state.document, null, "the viewing copy must not become the downloadable original");
  assert.deepEqual(
    h.requests.map(({ url }) => url),
    ["/original?display=1", "/original"],
  );
  finishOriginal(new Response("exact camera bytes", { headers: { "Content-Type": "image/jpeg" } }));
  await settle();
  state = h.render();
  assert.equal(state.document.file.name, "source.jpg");
  assert.equal(state.document.file.type, "image/jpeg");
  assert.equal(await state.document.file.text(), "exact camera bytes");
  assert.notEqual(state.document.url, state.displayDocument.url);
  h.dispose();
  assert.equal(h.revoked.length, 2);
});

test("original preparation failure keeps a successfully loaded preview visible", async () => {
  const h = harness((url) =>
    url.includes("display=1")
      ? new Response("webp", { headers: { "X-Document-Variant": "display" } })
      : new Response("Unavailable", { status: 502 }),
  );
  h.render({
    name: "source.png",
    viewUrl: "/original",
    displayUrl: "/original?display=1",
  }).prepare();
  h.render();
  await settle();
  const state = h.render();
  assert.equal(state.loadError, false);
  assert.equal(state.originalLoadError, true);
  assert.equal(await state.displayDocument.file.text(), "webp");
  assert.equal(state.document, null);
  h.dispose();
});

test("a display response containing the original needs only one request", async () => {
  const h = harness();
  h.render({
    name: "source.pdf",
    viewUrl: "/original",
    displayUrl: "/original?display=1",
  }).prepare();
  h.render();
  await settle();
  assert.equal(h.render().document, h.render().displayDocument);
  assert.equal(h.requests.length, 1);
  h.dispose();
});
