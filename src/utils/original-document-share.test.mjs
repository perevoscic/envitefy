import assert from "node:assert/strict";
import test from "node:test";
import { shareOriginalDocument } from "./original-document-share.ts";

const file = new File([new Uint8Array([1, 2, 3, 4])], "appointment.jpg", { type: "image/jpeg" });

test("shares the exact original file without publishing an owner-only URL", async () => {
  let shared;
  const promise = shareOriginalDocument(file, {
    canShare: (data) => data.files?.[0] === file,
    share: async (data) => {
      shared = data;
    },
  });
  // The native call happens during the click, before any asynchronous fetching.
  assert.deepEqual(shared, { files: [file] });
  assert.equal(await promise, "opened");
  assert.deepEqual(
    new Uint8Array(await shared.files[0].arrayBuffer()),
    new Uint8Array([1, 2, 3, 4]),
  );
});

test("unsupported browsers do not attempt to share a private link instead", async () => {
  let calls = 0;
  assert.equal(await shareOriginalDocument(file, {}), "unsupported");
  assert.equal(
    await shareOriginalDocument(file, {
      share: async () => {
        calls++;
      },
    }),
    "unsupported",
  );
  assert.equal(
    await shareOriginalDocument(file, {
      canShare: () => false,
      share: async () => {
        calls++;
      },
    }),
    "unsupported",
  );
  assert.equal(calls, 0);
});

test("canceling the share chooser is not reported as an error", async () => {
  assert.equal(
    await shareOriginalDocument(file, {
      canShare: () => true,
      share: async () => {
        throw new DOMException("Canceled", "AbortError");
      },
    }),
    "cancelled",
  );
});

test("blocked sharing reports a recoverable failure", async () => {
  assert.equal(
    await shareOriginalDocument(file, {
      canShare: () => true,
      share: async () => {
        throw new DOMException("Blocked", "NotAllowedError");
      },
    }),
    "failed",
  );
});

test("capability checks that throw do not escape the viewer", async () => {
  assert.equal(
    await shareOriginalDocument(file, {
      canShare: () => {
        throw new Error("Unavailable");
      },
      share: async () => {
        assert.fail("must not share");
      },
    }),
    "failed",
  );
});
