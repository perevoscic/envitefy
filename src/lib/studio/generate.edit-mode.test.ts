import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import path from "node:path";
import test, { mock } from "node:test";
import { pathToFileURL } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const resolvedPath = path.join(process.cwd(), "src", specifier.slice(2));
      const withExtension = /\.[a-z]+$/i.test(resolvedPath) ? resolvedPath : `${resolvedPath}.ts`;
      return nextResolve(pathToFileURL(withExtension).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { generateStudioInvitation, studioGenerationDeps } = await import("./generate.ts");

test.afterEach(() => {
  mock.restoreAll();
});

test("generateStudioInvitation uses edit mode when imageEdit carries an app-owned blob proxy url", async () => {
  let capturedPrompt = "";
  let capturedSourceImage = "";

  mock.method(studioGenerationDeps, "resolveStudioProvider", () => "gemini");
  mock.method(studioGenerationDeps, "normalizeStudioTheme", async () => ({
    riskLevel: "safe",
    normalizedTheme: "",
    visualMotifs: [],
    paletteHints: [],
    notes: "",
  }));
  mock.method(studioGenerationDeps, "applyStudioThemeNormalization", (request: any) => request);
  mock.method(studioGenerationDeps, "resolveStudioReferenceImages", async () => []);
  mock.method(studioGenerationDeps, "generateInvitationImageWithGemini", async () => {
    throw new Error("expected edit path, not generate path");
  });
  mock.method(studioGenerationDeps, "editInvitationImageWithGemini", async (prompt, source) => {
    capturedPrompt = String(prompt);
    capturedSourceImage = String(source);
    return {
      ok: true,
      imageDataUrl: "data:image/png;base64,RURJVEVE",
      warnings: [],
    };
  });

  const result = await generateStudioInvitation({
    mode: "image",
    surface: "page",
    event: {
      title: "Lara's 7th Dino-Quest",
      category: "Birthday",
      occasion: "Birthday",
      honoreeName: "Lara Bennett",
      ageOrMilestone: "7",
      userIdea: "Jurassic birthday adventure",
      date: "2026-05-23",
      startTime: "12:00 PM",
      venueName: "AMC Boulevard 10",
      venueAddress: "Franklin, TN",
      links: [],
    },
    guidance: {
      style: "Editorial cinematic invitation art with clean hierarchy.",
      tone: "Adventurous and celebratory",
      audience: "Parents and young guests",
      colorPalette: "green, stone, amber",
    },
    imageEdit: {
      sourceImageDataUrl: "/api/blob/event-media/upload-123/header/display.webp",
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.imageDataUrl, "data:image/png;base64,RURJVEVE");
  assert.equal(capturedSourceImage, "/api/blob/event-media/upload-123/header/display.webp");
  assert.ok(capturedPrompt.length > 0);
});
