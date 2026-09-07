import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { NextRequest } from "next/server.js";
import ts from "typescript";

const require = createRequire(import.meta.url);
const dependencies = {
  "next-auth/jwt": { getToken: async () => ({ sub: "test-user" }) },
  "@/config/feature-visibility": { DISABLED_EVENT_ROUTE_PREFIXES: [] },
  "@/lib/signup-intent": {
    getCreateActionForSignupIntent: () => null,
    signupIntentForMarketingPath: () => null,
    signupSourceForIntent: () => null,
  },
};
const { outputText } = ts.transpileModule(readFileSync(new URL("./middleware.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const module = { exports: {} };
new Function("require", "module", "exports", outputText)(
  (name) => dependencies[name] ?? require(name), module, module.exports,
);
const { middleware } = module.exports;

test("every retired V2 page redirects to chat for signed-in and signed-out visitors", async () => {
  for (const cookie of ["", "next-auth.session-token=test-session"]) {
    for (const path of [
      "/concierge-v2", "/concierge-v2/", "/concierge-v2?session=old-session",
      "/concierge-v2/drafts", "/concierge-v2/events/old-event/calendar",
      "/concierge-v2/invitations/old-token?redirect=elsewhere",
    ]) {
      const response = await middleware(new NextRequest(`https://envitefy.test${path}`, { headers: { cookie } }));
      assert.equal(response.status, 308, path);
      assert.equal(response.headers.get("location"), "https://envitefy.test/chat", path);
    }
  }
});

test("current chat, published cards, and current Concierge APIs do not enter the retirement redirect", async () => {
  for (const path of ["/chat", "/card/birthday", "/api/creation/intake", "/api/concierge/message", "/api/concierge/events/event-id/message", "/concierge-v20"]) {
    const response = await middleware(new NextRequest(`https://envitefy.test${path}`, {
      headers: { cookie: "next-auth.session-token=test-session" },
    }));
    assert.equal(response.headers.get("location"), null, path);
    assert.equal(response.headers.get("x-middleware-next"), "1", path);
  }
});

test("V2 runtime and creation APIs are removed while the current creator stays installed", () => {
  for (const path of ["app/concierge-v2", "lib/concierge-v2", "config/concierge-v2-flags.ts", "app/api/concierge/sessions", "app/api/concierge/parse"]) {
    assert.equal(existsSync(new URL(path, import.meta.url)), false, path);
  }
  for (const path of ["app/chat/ConciergeChatClient.tsx", "app/api/creation/intake/route.ts", "app/api/concierge/message/route.ts", "app/api/concierge/events/[id]/message/route.ts"]) {
    assert.equal(existsSync(new URL(path, import.meta.url)), true, path);
  }
});
