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
const ORIGINAL_IMAGE_QUALITY = process.env.STUDIO_OPENAI_IMAGE_QUALITY;
const ORIGINAL_IMAGE_MODEL = process.env.STUDIO_OPENAI_IMAGE_MODEL;
const ORIGINAL_IMAGE_EDIT_MODEL = process.env.STUDIO_OPENAI_IMAGE_EDIT_MODEL;

const { editInvitationImageWithOpenAi, generateInvitationImageWithOpenAi, openAiStudioDeps } =
  await import("./openai.ts");

function restoreEnvValue(key, value) {
  if (typeof value === "undefined") {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

test.afterEach(() => {
  mock.restoreAll();
  restoreEnvValue("STUDIO_OPENAI_IMAGE_QUALITY", ORIGINAL_IMAGE_QUALITY);
  restoreEnvValue("OPENAI_API_KEY", ORIGINAL_OPENAI_API_KEY);
  restoreEnvValue("STUDIO_OPENAI_IMAGE_MODEL", ORIGINAL_IMAGE_MODEL);
  restoreEnvValue("STUDIO_OPENAI_IMAGE_EDIT_MODEL", ORIGINAL_IMAGE_EDIT_MODEL);
});

test("OpenAI studio image generation defaults to gpt-image-2.5-flare", async () => {
  let requestedModel = "";
  delete process.env.STUDIO_OPENAI_IMAGE_QUALITY;

  process.env.OPENAI_API_KEY = "test-openai-key";
  delete process.env.STUDIO_OPENAI_IMAGE_MODEL;
  delete process.env.STUDIO_OPENAI_IMAGE_EDIT_MODEL;

  mock.method(openAiStudioDeps, "getOpenAiClient", () => ({
    images: {
      generate: async (request) => {
        requestedModel = request.model;
        assert.equal(request.quality, "high");
        return { data: [{ b64_json: "R0VORVJBVEVE" }] };
      },
    },
  }));

  const result = await generateInvitationImageWithOpenAi("Create a birthday invite.");

  assert.equal(result.ok, true);
  assert.equal(requestedModel, "gpt-image-2.5-flare");
});

test("OpenAI studio image edits default independently to gpt-image-2.5-flare", async () => {
  let requestedModel = "";
  delete process.env.STUDIO_OPENAI_IMAGE_QUALITY;

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
        assert.equal(request.quality, "high");
        return { data: [{ b64_json: "RURJVEVE" }] };
      },
    },
  }));

  const result = await editInvitationImageWithOpenAi(
    "Replace only the changed time digit.",
    "/api/blob/event-media/upload-123/header/display.webp",
  );

  assert.equal(result.ok, true);
  assert.equal(requestedModel, "gpt-image-2.5-flare");
});

test("explicit image quality override remains available", async () => {
  process.env.STUDIO_OPENAI_IMAGE_QUALITY = "medium";
  mock.method(openAiStudioDeps, "getOpenAiClient", () => ({
    images: {
      generate: async (request) => {
        assert.equal(request.quality, "medium");
        return { data: [{ b64_json: "VEVTVA==" }] };
      },
    },
  }));
  assert.equal((await generateInvitationImageWithOpenAi("An invitation")).ok, true);
});

test("scan heroes request portrait dimensions without changing landscape page defaults", async () => {
  const sizes = [];
  mock.method(openAiStudioDeps, "getOpenAiClient", () => ({
    images: {
      generate: async (request) => {
        sizes.push(request.size);
        return { data: [{ b64_json: "VEVTVA==" }] };
      },
    },
  }));
  await generateInvitationImageWithOpenAi("Background", undefined, "event_page");
  await generateInvitationImageWithOpenAi("Hero", undefined, "event_page", { size: "1024x1536" });
  assert.deepEqual(sizes, ["1536x1024", "1024x1536"]);
});

test("edited Event Page heroes forward explicit landscape dimensions to the actual provider request", async () => {
  mock.method(openAiStudioDeps, "resolveStudioSourceImage", async () => ({ mimeType: "image/png", data: "U09VUkNF" }));
  mock.method(openAiStudioDeps, "toUploadableImage", async () => "source-image");
  mock.method(openAiStudioDeps, "getOpenAiClient", () => ({ images: { edit: async (request) => {
    assert.equal(request.size, "1536x1024");
    return { data: [{ b64_json: "VEVTVA==" }] };
  } } }));
  const result = await editInvitationImageWithOpenAi("Darken the hero background.", "/api/blob/existing.webp", undefined, { size: "1536x1024" });
  assert.equal(result.ok, true);
});

test("tall Live Card dimensions reach generation, reference generation and edit requests", async () => {
  const sizes = [];
  const response = async (request) => {
    sizes.push(request.size);
    return { data: [{ b64_json: "VEVTVA==" }] };
  };
  mock.method(openAiStudioDeps, "getOpenAiClient", () => ({ images: {generate: response, edit: response} }));
  mock.method(openAiStudioDeps, "resolveStudioSourceImage", async () => ({ mimeType: "image/png", data: "U09VUkNF" }));
  mock.method(openAiStudioDeps, "toUploadableImage", async () => "source-image");
  assert.equal((await generateInvitationImageWithOpenAi("Tall birthday scene", undefined, "live_card")).ok, true);
  assert.equal((await generateInvitationImageWithOpenAi("Tall birthday scene", [{mimeType:"image/png", data:"U09VUkNF"}], "live_card")).ok, true);
  assert.equal((await editInvitationImageWithOpenAi("Keep the tall scene", "/api/blob/existing.webp", undefined, {size:"1024x2176"})).ok, true);
  assert.deepEqual(sizes, ["1024x2176", "1024x2176", "1024x2176"]);
});

test("streamed Live Card generation forwards the same tall dimensions", async () => {
  mock.method(openAiStudioDeps, "getOpenAiClient", () => ({
    post: async (_url, options) => {
      assert.equal(options.body.size, "1024x2176");
      return (async function* () { yield {type:"image_generation.completed", b64_json:"VEVTVA=="}; })();
    },
  }));
  assert.equal((await generateInvitationImageWithOpenAi("Tall birthday scene", undefined, "live_card", {onPartialImage: () => {}})).ok, true);
});
