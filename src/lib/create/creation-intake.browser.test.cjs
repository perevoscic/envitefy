const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const ts = require("typescript");
const { chromium } = require("playwright");

test("browser recovery keeps source blobs across reload, isolates accounts, rejects stale writes and expires old work", async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage();
    await page.route("https://creation.test/**", route => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Recovery test</title>" }));
    await page.goto("https://creation.test/");
    const code = ts.transpileModule(fs.readFileSync("src/lib/create/creation-intake.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const install = () => page.evaluate(code => { const exports = {}; new Function("exports", code)(exports); window.intakes = exports; }, code);
    await install();
    const id = await page.evaluate(async () => {
      const api = window.intakes;
      const intake = api.createCreationIntake("owner-a", { kind: "files", files: [new File(["source document"], "packet.pdf", { type: "application/pdf", lastModified: 123 })], text: "Keep this note" });
      const saved = await api.writeCreationIntake(intake);
      await api.writeCreationIntake({ ...saved, phase: "templates" });
      await api.writeCreationIntake({ ...saved, phase: "source" });
      return intake.id;
    });
    await page.reload(); await install();
    const recovered = await page.evaluate(async id => {
      const api = window.intakes, own = await api.readCreationIntake("owner-a", id);
      return { phase: own.phase, note: own.source.text, file: own.source.files[0].name, bytes: await own.source.files[0].text(), other: await api.readCreationIntake("owner-b", id), revision: own.revision };
    }, id);
    assert.deepEqual(recovered, { phase: "templates", note: "Keep this note", file: "packet.pdf", bytes: "source document", other: null, revision: 2 });
    const expired = await page.evaluate(async id => {
      const api = window.intakes;
      const now = Date.now; Date.now = () => now() + api.CREATION_INTAKE_MAX_AGE + 1;
      const rows = await api.listCreationIntakes("owner-a"); Date.now = now;
      const after = await api.readCreationIntake("owner-a", id);
      return { count: rows.length, after };
    }, id);
    assert.deepEqual(expired, { count: 0, after: null });
    const cleared = await page.evaluate(async () => {
      const api = window.intakes;
      for (const owner of ["owner-a", "owner-b"]) await api.writeCreationIntake(api.createCreationIntake(owner, { kind: "scratch", files: [], text: "" }));
      await api.clearCreationIntakes("owner-a");
      const result = [(await api.listCreationIntakes("owner-a")).length, (await api.listCreationIntakes("owner-b")).length];
      await api.clearCreationIntakes(); result.push((await api.listCreationIntakes("owner-b")).length); return result;
    });
    assert.deepEqual(cleared, [0, 1, 0]);
    const discarded = await page.evaluate(async () => {
      const api = window.intakes;
      api.resumeCreationIntakeWrites("owner-a");
      const saved = await api.writeCreationIntake(api.createCreationIntake("owner-a", { kind: "scratch", files: [], text: "Retained before discard" }));
      await api.deleteCreationIntake("owner-a", saved.id);
      const delayed = await api.writeCreationIntake({ ...saved, source: { ...saved.source, text: "Delayed stale callback" } }).then(() => "written", () => "blocked");
      api.suspendCreationIntakeWrites();
      const lateNew = api.createCreationIntake("owner-a", { kind: "scratch", files: [], text: "Timer after sign-out" });
      const late = api.writeCreationIntake(lateNew).then(() => "written", () => "blocked");
      await api.clearCreationIntakes();
      const signout = await late;
      const count = (await api.listCreationIntakes("owner-a")).length;
      api.resumeCreationIntakeWrites("owner-a");
      await api.writeCreationIntake(api.createCreationIntake("owner-a", { kind: "scratch", files: [], text: "New authenticated session" }));
      return { delayed, signout, count, resumed: (await api.listCreationIntakes("owner-a")).length };
    });
    assert.deepEqual(discarded, { delayed: "blocked", signout: "blocked", count: 0, resumed: 1 });
    const rapidSession = await page.evaluate(async () => {
      const api = window.intakes;
      api.suspendCreationIntakeWrites();
      const clearing = api.clearCreationIntakes();
      api.resumeCreationIntakeWrites("owner-a");
      const saved = await api.writeCreationIntake(api.createCreationIntake("owner-a", { kind: "scratch", files: [], text: "Authenticated again before cleanup finishes" }));
      await clearing;
      // A queued old resume must not undo a later sign-out.
      api.resumeCreationIntakeWrites("owner-a");
      api.suspendCreationIntakeWrites();
      const staleResume = await api.writeCreationIntake(api.createCreationIntake("owner-a", { kind: "scratch", files: [], text: "After sign-out" })).then(() => "written", () => "blocked");
      return { resumedText: (await api.readCreationIntake("owner-a", saved.id))?.source.text, staleResume };
    });
    assert.deepEqual(rapidSession, { resumedText: "Authenticated again before cleanup finishes", staleResume: "blocked" });
    const updates = await page.evaluate(async () => {
      const api = window.intakes, changes = [];
      const listener = event => changes.push(event.detail.ownerId);
      window.addEventListener(api.CREATION_INTAKES_UPDATED_EVENT, listener);
      try {
        api.resumeCreationIntakeWrites("owner-events");
        const saved = await api.writeCreationIntake(api.createCreationIntake("owner-events", { kind: "scratch", files: [], text: "Draft notification" }));
        await api.attachCreationIntakeEvent("owner-events", saved.id, "saved-event");
        await api.deleteCreationIntake("owner-events", saved.id);
        await api.writeCreationIntake(saved).catch(() => {});
        await api.clearCreationIntakes("owner-events");
        return changes;
      } finally { window.removeEventListener(api.CREATION_INTAKES_UPDATED_EVENT, listener); }
    });
    assert.deepEqual(updates, ["owner-events", "owner-events", "owner-events", "owner-events"], "successful browser draft mutations notify mounted Drafts, and rejected writes do not");
  } finally { await browser.close(); }
});
