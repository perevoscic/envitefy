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
  const [layout, controls, footer, tracker, interaction, preferences, browserState] =
    await Promise.all([
      read("src/app/layout.tsx"),
      read("src/components/PrivacyControls.tsx"),
      read("src/components/ConditionalFooter.tsx"),
      read("src/components/GoogleAnalyticsRouteTracker.tsx"),
      read("src/utils/event-tracking-client.ts"),
      read("src/lib/privacy-preferences.ts"),
      read("src/utils/clearAppBrowserState.ts"),
    ]);
  assert.doesNotMatch(layout, /googletagmanager/);
  assert.match(controls, /preferences\?\.analytics === true/);
  assert.doesNotMatch(controls, /hasLoaded && preferences && !isOpen/);
  assert.match(footer, /PrivacyChoicesButton/);
  assert.match(tracker, /hasAnalyticsConsent\(\)/);
  assert.doesNotMatch(tracker, /useSearchParams/);
  assert.match(interaction, /if \(!hasAnalyticsConsent\(\)\) return/);
  assert.match(interaction, /path: window\.location\.pathname/);
  assert.match(preferences, /envitefy_privacy_preferences/);
  assert.match(preferences, /PRIVACY_PREFERENCES_COOKIE_MAX_AGE_SECONDS/);
  assert.match(preferences, /savePrivacyPreferencesCookie\(preferences\)/);
  assert.match(browserState, /PRIVACY_PREFERENCES_STORAGE_KEY/);
  assert.match(browserState, /PRESERVED_LOCAL_STORAGE_KEYS/);
  assert.match(browserState, /preservedKeys\?\.has\(key\)/);
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

test("Google user data is carved out from generalized improvement and AI uses", async () => {
  const [privacy, terms, faq, googleAuth, calendarScope] = await Promise.all([
    read("src/app/privacy/page.tsx"),
    read("src/app/terms/page.tsx"),
    read("src/app/faq/page.tsx"),
    read("src/app/api/google/auth/route.ts"),
    read("src/lib/google-calendar-oauth.ts"),
  ]);
  assert.match(privacy, /Google user data and Limited Use/);
  assert.match(privacy, /openid, email, and profile permissions/);
  assert.match(privacy, /calendar\.events\.owned/);
  assert.match(privacy, /analytics\.readonly/);
  assert.match(privacy, /not used for generalized product research or improvement/);
  assert.match(privacy, /does not make a local copy of your general Google Calendar contents/);
  assert.match(privacy, /does not sell Google user data/);
  assert.match(privacy, /do not read Google user data unless you give explicit consent/);
  assert.match(privacy, /merger, acquisition, or asset sale only after obtaining/);
  assert.match(privacy, /Google API Services User Data Policy/);
  assert.match(privacy, /Limited Use requirements/);
  assert.match(privacy, /https:\/\/developers\.google\.com\/terms\/api-services-user-data-policy/);
  assert.match(terms, /Except for information received from Google APIs/);
  assert.match(faq, /Information received from Google APIs is used only/);
  assert.match(googleAuth, /"openid"/);
  assert.match(googleAuth, /"email"/);
  assert.match(googleAuth, /"profile"/);
  assert.match(googleAuth, /analytics\.readonly/);
  assert.match(calendarScope, /calendar\.events\.owned/);
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
