import assert from "node:assert/strict";
import test from "node:test";

import { normalizeEnvitefySender } from "./email-sender.ts";

test("campaign sender always uses the Envitefy display name", () => {
  assert.equal(normalizeEnvitefySender("hello@envitefy.com"), "Envitefy <hello@envitefy.com>");
  assert.equal(
    normalizeEnvitefySender("hello <hello@envitefy.com>"),
    "Envitefy <hello@envitefy.com>",
  );
  assert.equal(
    normalizeEnvitefySender("Envitefy <hello@envitefy.com>"),
    "Envitefy <hello@envitefy.com>",
  );
});

test("campaign sender removes header-breaking newlines", () => {
  assert.equal(
    normalizeEnvitefySender("Envitefy\r\n <hello@envitefy.com>"),
    "Envitefy <hello@envitefy.com>",
  );
});
