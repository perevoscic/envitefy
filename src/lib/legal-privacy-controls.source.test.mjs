import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("signup requires current legal acceptance for email and Google", async () => {
  const [form, signupRoute, auth] = await Promise.all([
    read("src/components/auth/SignupForm.tsx"),
    read("src/app/api/auth/signup/route.ts"),
    read("src/lib/auth.ts"),
  ]);
  assert.match(form, /useState\(false\)/);
  assert.match(form, /I confirm I am at least 18/);
  assert.match(form, /href="\/privacy"/);
  assert.match(form, /ensureLegalAcceptance\("email_signup"\)/);
  assert.match(form, /ensureLegalAcceptance\("google_signup"\)/);
  assert.match(signupRoute, /legalAcceptance,/);
  assert.match(auth, /legalAcceptance,/);
  assert.match(auth, /blocked Google signup without current legal acceptance/);
});

test("optional tracking is consent gated and strips query strings", async () => {
  const [layout, controls, footer, tracker, interaction] = await Promise.all([
    read("src/app/layout.tsx"),
    read("src/components/PrivacyControls.tsx"),
    read("src/components/ConditionalFooter.tsx"),
    read("src/components/GoogleAnalyticsRouteTracker.tsx"),
    read("src/utils/event-tracking-client.ts"),
  ]);
  assert.doesNotMatch(layout, /googletagmanager/);
  assert.match(controls, /preferences\?\.analytics === true/);
  assert.doesNotMatch(controls, /hasLoaded && preferences && !isOpen/);
  assert.match(footer, /PrivacyChoicesButton/);
  assert.match(tracker, /hasAnalyticsConsent\(\)/);
  assert.doesNotMatch(tracker, /useSearchParams/);
  assert.match(interaction, /if \(!hasAnalyticsConsent\(\)\) return/);
  assert.match(interaction, /path: window\.location\.pathname/);
});

test("campaigns suppress opt-outs and carry compliance controls", async () => {
  const [campaigns, resend] = await Promise.all([
    read("src/lib/admin/email-campaign-send.ts"),
    read("src/lib/resend.ts"),
  ]);
  assert.match(campaigns, /marketing_opt_out_at IS NULL/);
  assert.match(resend, /LEGAL_POSTAL_ADDRESS is required/);
  assert.match(resend, /List-Unsubscribe/);
  assert.match(resend, /createMarketingUnsubscribeUrl/);
});

test("disconnect deletes stored provider tokens and clears sessions", async () => {
  const route = await read("src/app/api/oauth/disconnect/route.ts");
  assert.match(route, /deleteStoredOAuthTokens/);
  assert.match(route, /oauth2\.googleapis\.com\/revoke/);
  assert.match(route, /next-auth\.session-token/);
});

test("private scan content access is auditable", async () => {
  const [detail, preview] = await Promise.all([
    read("src/app/admin/scans/[id]/page.tsx"),
    read("src/app/api/admin/scan-attempts/[id]/preview/route.ts"),
  ]);
  assert.match(detail, /recordPrivateDataAccess/);
  assert.match(detail, /view_scan_detail/);
  assert.match(preview, /recordPrivateDataAccess/);
  assert.match(preview, /view_scan_preview/);
});
