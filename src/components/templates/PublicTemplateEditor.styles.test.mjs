import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { stylesheetDependencies } from "../../../scripts/lib/stylesheet-dependencies.mjs";

test("public template routes eagerly include every native editor and nested form stylesheet", () => {
  const entry = "src/components/templates/PublicTemplateEditor.tsx";
  const required = stylesheetDependencies(entry);
  const eager = new Set(stylesheetDependencies(entry, { includeDynamic: false }));
  assert.ok(required.includes("src/components/events/event-section-builder.module.css"));
  assert.ok(required.includes("src/components/event-templates/gymnastics-schedule-editor.module.css"));
  assert.deepEqual(required.filter(style => !eager.has(style)), [],
    "A lazy editor gained CSS outside its route stylesheet. Add the missing imports to template-editor-styles.ts.");
});

test("stylesheet coverage catches new nested lazy CSS and follows aliases and re-exports", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "envitefy-editor-styles-"));
  try {
    fs.mkdirSync(path.join(root, "src"));
    const write = (file, content) => fs.writeFileSync(path.join(root, "src", file), content);
    write("entry.ts", 'import "./base.css"; import type { Shape } from "./types"; const Editor = () => import("@/editor");');
    write("editor.ts", 'export { Form } from "./nested";');
    write("nested.tsx", 'import styles from "./form.module.css"; export const Form = () => <div className={styles.form} />;');
    write("types.ts", 'import "./types-only.css"; export type Shape = string;');
    for (const file of ["base.css", "form.module.css", "types-only.css"]) write(file, "");
    const all = stylesheetDependencies("src/entry.ts", { root });
    const eager = stylesheetDependencies("src/entry.ts", { root, includeDynamic: false });
    assert.deepEqual(all, ["src/base.css", "src/form.module.css"]);
    assert.deepEqual(eager, ["src/base.css"]);
    fs.appendFileSync(path.join(root, "src/entry.ts"), ' import "./form.module.css";');
    assert.deepEqual(stylesheetDependencies("src/entry.ts", { root, includeDynamic: false }), all);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
