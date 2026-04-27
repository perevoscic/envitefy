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

const ORIGINAL_OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ORIGINAL_IMAGE_MODEL = process.env.STUDIO_OPENAI_IMAGE_MODEL;
const ORIGINAL_IMAGE_EDIT_MODEL = process.env.STUDIO_OPENAI_IMAGE_EDIT_MODEL;

const {
  editInvitationImageWithOpenAi,
  generateInvitationImageWithOpenAi,
  openAiStudioDeps,
} = await import("./openai.ts");

function restoreEnvValue(key, value) {
  if (typeof value === "undefined") {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

test.afterEach(() => {
  mock.restoreAll();
  restoreEnvValue("OPENAI_API_KEY", ORIGINAL_OPENAI_API_KEY);
  restoreEnvValue("STUDIO_OPENAI_IMAGE_MODEL", ORIGINAL_IMAGE_MODEL);
  restoreEnvValue("STUDIO_OPENAI_IMAGE_EDIT_MODEL", ORIGINAL_IMAGE_EDIT_MODEL);
});

test("OpenAI studio image generation defaults to gpt-image-2", async () => {
  let requestedModel = "";

  process.env.OPENAI_API_KEY = "test-openai-key";
  delete process.env.STUDIO_OPENAI_IMAGE_MODEL;
  delete process.env.STUDIO_OPENAI_IMAGE_EDIT_MODEL;

  mock.method(openAiStudioDeps, "getOpenAiClient", () => ({
    images: {
      generate: async (request) => {
        requestedModel = request.model;
        return { data: [{ b64_json: "R0VORVJBVEVE" }] };
      },
    },
  }));

  const result = await generateInvitationImageWithOpenAi("Create a birthday invite.");

  assert.equal(result.ok, true);
  assert.equal(requestedModel, "gpt-image-2");
});

test("OpenAI studio image edits default independently to gpt-image-2", async () => {
  let requestedModel = "";

  process.env.OPENAI_API_KEY = "test-openai-key";
  process.env.STUDIO_OPENAI_IMAGE_MODEL = "gpt-image-1";
  delete process.env.STUDIO_OPENAI_IMAGE_EDIT_MODEL;

  mock.method(openAiStudioDeps, "resolveStudioSourceImage", async () => ({
    mimeType: "image/png",
    data: "U09VUkNF",
  }));
  mock.method(openAiStudioDeps, "toUploadableImage", async () => "uploadable-image");
  mock.method(openAiStudioDeps, "getOpenAiClient", () => ({
    images: {
      edit: async (request) => {
        requestedModel = request.model;
        return { data: [{ b64_json: "RURJVEVE" }] };
      },
    },
  }));

  const result = await editInvitationImageWithOpenAi(
    "Replace only the changed time digit.",
    "/api/blob/event-media/upload-123/header/display.webp",
  );

  assert.equal(result.ok, true);
  assert.equal(requestedModel, "gpt-image-2");
});
