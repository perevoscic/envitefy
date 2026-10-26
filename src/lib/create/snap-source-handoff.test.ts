import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { snapUploadForCreateSource } from "./snap-source-handoff";

test("a recognized memo handoff keeps exact original files and separate host notes", async () => {
  const file = new File(["exact source PDF bytes"], "school-memo.pdf", { type: "application/pdf" });
  const files = [file];
  const pending = snapUploadForCreateSource({ kind: "files", files, text: "Correct the test date to Friday." }, "The full read transcript must not become host instructions.");
  expect(pending.file).toBe(file);
  expect(pending.files).toBe(files);
  expect(await pending.file!.text()).toBe("exact source PDF bytes");
  expect(pending.text).toBe("Correct the test date to Friday.");
});

test("URL and pasted-text handoffs retain readable facts without fabricating an attachment", () => {
  const fromUrl = snapUploadForCreateSource({ kind: "url", files: [], url: "https://school.example/memo", text: "The test moved to Friday." }, "Weekly school memo\nSpelling test Thursday");
  expect(fromUrl.file).toBeUndefined();
  expect(fromUrl.text).toContain("Weekly school memo");
  expect(fromUrl.text).toContain("Host-authored corrections:\nThe test moved to Friday.");
  const pasted = "Weekly school memo\nSpelling test Friday";
  expect(snapUploadForCreateSource({ kind: "text", files: [], text: pasted }, pasted).text).toBe(pasted);
});

test("the client handles a Snap destination before loading any automatic Event Page template", () => {
  const source = readFileSync(new URL("../../app/create/UnifiedCreatePageClient.tsx", import.meta.url), "utf8");
  const start = source.indexOf('if (result.destination === "snap"');
  expect(start).toBeGreaterThan(source.indexOf("const result = await readCreateExtractionResponse"));
  expect(start).toBeLessThan(source.indexOf("template = await defaultTemplateFor(next"));
  const handoff = source.slice(start, source.indexOf("template = await defaultTemplateFor(next"));
  expect(handoff).toContain('allowedProducts.includes("snap")');
  expect(handoff).toContain("snapUploadForCreateSource(source, result.sourceText)");
  expect(handoff).toContain('router.push("/snap?action=upload")');
  expect(source).toContain("schoolMemoCapture");
  expect(source).toContain("!intake?.information && guess?.category === \"general\"");
  expect(source).toContain("Continue with Snap a Flyer");
});
