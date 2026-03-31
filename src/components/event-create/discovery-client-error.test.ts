import assert from "node:assert/strict";
import test from "node:test";

import {
  createDiscoveryStatusClientError,
  formatDiscoveryTechnicalDetails,
  resolveDiscoveryFriendlyErrorMessage,
} from "./discovery-client-error.ts";

test("resolveDiscoveryFriendlyErrorMessage returns a friendly extract failure message", () => {
  const message = resolveDiscoveryFriendlyErrorMessage({
    errorCode: "failed_extract",
    errorStage: "extract",
    errorMessage: "Not enough text extracted to parse",
    errorDetails: {
      normalizedErrorCode: "not_enough_text",
    },
  });

  assert.equal(message, "We could not extract enough readable text from that file on the server.");
});

test("createDiscoveryStatusClientError preserves technical details for copyable UI output", () => {
  const error = createDiscoveryStatusClientError({
    errorCode: "failed_extract",
    errorStage: "extract",
    errorMessage: "Not enough text extracted to parse",
    errorDetails: {
      normalizedErrorCode: "not_enough_text",
      runtimeHints: {
        pdfTextEngine: "pdfjs-dist",
        pdfWorkerDisabled: true,
      },
    },
  });

  assert.equal(error.code, "failed_extract");
  assert.equal(error.stage, "extract");
  assert.match(error.technicalDetails || "", /"normalizedErrorCode": "not_enough_text"/);
  assert.match(error.technicalDetails || "", /"pdfWorkerDisabled": true/);
});

test("createDiscoveryStatusClientError falls back to a friendly message when only errorCode exists", () => {
  const error = createDiscoveryStatusClientError({
    errorCode: "failed_extract",
  });

  assert.equal(error.message, "We could not extract enough readable text from that file on the server.");
  assert.equal(
    formatDiscoveryTechnicalDetails({
      errorCode: "failed_extract",
    }),
    '{\n  "errorCode": "failed_extract",\n  "errorStage": null,\n  "errorMessage": null,\n  "errorDetails": null\n}',
  );
});
