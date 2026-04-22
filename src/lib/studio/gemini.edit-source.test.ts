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

const { editInvitationImageWithGemini, geminiStudioDeps } = await import("./gemini.ts");
const { studioSourceImageDeps } = await import("./source-image.ts");

test.afterEach(() => {
  mock.restoreAll();
});

test("gemini edit mode accepts app-owned blob proxy urls without self-fetching the site", async () => {
  const sourceBytes = Buffer.from("studio-source-image");
  let capturedRequest: any = null;

  const fetchMock = mock.method(studioSourceImageDeps, "fetchRemote", async () => {
    throw new Error("fetch should not be used for app-owned blob proxy urls");
  });
  const getMock = mock.method(studioSourceImageDeps, "getBlob", async (pathname: string) => {
    assert.equal(pathname, "event-media/upload-123/header/display.webp");
    return {
      statusCode: 200,
      stream: new Response(sourceBytes).body,
      headers: new Headers({ "content-type": "image/webp" }),
    };
  });
  mock.method(geminiStudioDeps, "getGeminiClient", () => ({
    models: {
      generateContent: async (request: any) => {
        capturedRequest = request;
        return {
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: "image/png",
                      data: "R0VORVJBVEVE",
                    },
                  },
                ],
              },
            },
          ],
        };
      },
    },
  }));

  const result = await editInvitationImageWithGemini(
    "Refine the invitation art",
    "/api/blob/event-media/upload-123/header/display.webp",
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("Expected editInvitationImageWithGemini to succeed");
  }
  assert.equal(result.imageDataUrl, "data:image/png;base64,R0VORVJBVEVE");
  assert.equal(fetchMock.mock.calls.length, 0);
  assert.equal(getMock.mock.calls.length, 1);
  assert.equal(
    capturedRequest?.contents?.[0]?.parts?.[0]?.inlineData?.data,
    sourceBytes.toString("base64"),
  );
  assert.equal(capturedRequest?.contents?.[0]?.parts?.[0]?.inlineData?.mimeType, "image/webp");
});
