import assert from "node:assert/strict";
import test from "node:test";

import { renderMagazineEmail } from "./magazine-1.ts";

test("renderMagazineEmail rewrites loopback origins to envitefy.com", () => {
  const html = renderMagazineEmail({ baseUrl: "http://localhost:3000" });

  assert.doesNotMatch(html, /localhost|127\.0\.0\.1|0\.0\.0\.0|\.local/i);
  assert.match(
    html,
    /https:\/\/envitefy\.com\/api\/blob\/event-media\/system\/email-assets\/envitefy-magazine-1\.webp/i,
  );
  assert.match(html, /https:\/\/envitefy\.com\/email\/envitefy-wordmark-email\.png/i);
  assert.match(
    html,
    /https:\/\/envitefy\.com\/api\/blob\/event-media\/system\/email-assets\/ava-james-garden-vows\.webp/i,
  );
  assert.match(
    html,
    /https:\/\/envitefy\.com\/api\/blob\/event-media\/system\/email-assets\/elena-beary-sweet-shower\.webp/i,
  );
  assert.match(
    html,
    /https:\/\/envitefy\.com\/api\/blob\/event-media\/system\/email-assets\/friday-night-lights-email\.webp/i,
  );
  assert.match(html, /https:\/\/envitefy\.com\/showcase\/garden-vows/i);
  assert.match(html, /https:\/\/envitefy\.com\/showcase\/elena-s-beary-sweet-shower/i);
  assert.match(html, /https:\/\/envitefy\.com\/showcase\/friday-night-lights-a/i);
  assert.match(html, /https:\/\/envitefy\.com\/studio/i);
});
