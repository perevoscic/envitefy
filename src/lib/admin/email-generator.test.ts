import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  buildEnvitefyMarketingCatalogPrompt,
  ENVITEFY_PRODUCT_MARKETING_CATALOG,
  listEnvitefyMarketingFeatures,
} from "../product-marketing-catalog.ts";
import {
  ADMIN_EMAIL_GENERATION_GUIDE,
  buildAdminEmailSystemPromptFromGuide,
} from "./email-generation-guide.ts";
import {
  applyAdminEmailPromptConstraints,
  buildScenarioRowHtml,
  buildStillImageRetryHint,
  ensureDraftIncludesImageAssets,
  extractCampaignIntroHtml,
  hasCompleteScenarioStillAssets,
  normalizeAdminEmailDraft,
  parseAdminEmailGenerationRequest,
  polishAdminEmailBodyHtml,
  recoverAdminEmailDraftForPrompt,
  sanitizeGeneratedEmailHtml,
  stripRedundantNameAfterGreeting,
  validateAdminEmailPromptFidelity,
} from "./email-generator.ts";
import {
  buildAdminEmailImageQaPrompt,
  normalizeAdminEmailImageQaResult,
  reasonsIndicateBrandLogo,
} from "./email-image-qa.ts";

const repoRoot = process.cwd();
const emailGeneratorSource = () =>
  fs.readFileSync(path.join(repoRoot, "src/lib/admin/email-generator.ts"), "utf8");
const emailScenariosSource = () =>
  fs.readFileSync(path.join(repoRoot, "src/lib/admin/email-scenarios.ts"), "utf8");

test("admin email generator defaults to Astra with compatible reasoning parameters", () => {
  const source = emailGeneratorSource();
  assert.match(source, /DEFAULT_ADMIN_EMAIL_GENERATOR_MODEL = "gpt-6-astra"/);
  assert.match(source, /\.\.\.openAiChatCompatibilityParams\(model\)/);
  assert.doesNotMatch(source, /OPENAI_CONCIERGE_CHAT_MODEL/);
});

test("admin email generator prompts distinguish individual vs broadcast audiences", () => {
  const source = emailGeneratorSource();
  assert.match(source, /buildAdminEmailSystemPromptFromGuide/);
  assert.match(source, /buildAdminEmailGuidePromptPayload/);
});

test("admin email generation guide is the source of truth for LLM rules", () => {
  const guideSource = fs.readFileSync(
    path.join(repoRoot, "src/lib/admin/email-generation-guide.ts"),
    "utf8",
  );
  const catalogSource = fs.readFileSync(
    path.join(repoRoot, "src/lib/product-marketing-catalog.ts"),
    "utf8",
  );
  assert.match(guideSource, /ADMIN_EMAIL_GENERATION_GUIDE/);
  assert.match(guideSource, /bodyHtmlOnly/);
  assert.match(guideSource, /serverInjected/);
  assert.match(guideSource, /client-focused marketing team/);
  assert.match(guideSource, /treat their words as the campaign brief/);
  assert.match(guideSource, /only the scenarioRows selected/);
  assert.match(guideSource, /ENVITEFY_PRODUCT_MARKETING_CATALOG/);
  assert.match(guideSource, /buildEnvitefyMarketingCatalogPrompt/);
  assert.match(catalogSource, /Google Calendar, Apple Calendar\/ICS, and Outlook/);
  assert.match(catalogSource, /lost invitations/);
  assert.match(catalogSource, /fridge and message-thread clutter/);
  assert.match(catalogSource, /rsvp-households-headcount/);
  assert.match(catalogSource, /smart-signups/);
  assert.match(guideSource, /messagingFramework/);
  assert.match(guideSource, /audience pain.*product transformation.*payoff/);
  assert.match(guideSource, /bannedTextLinkLabels/);
  assert.match(guideSource, /Turn a flyer into a live event card/);
  assert.match(guideSource, /Do not put scenario rows/);
  assert.match(guideSource, /imageVisuals/);
  assert.match(guideSource, /never animated GIFs/);
  assert.match(emailGeneratorSource(), /email-generation-guide/);
  assert.match(emailGeneratorSource(), /draft_prompt_fidelity_retry/);
});

test("complete product catalog is embedded in the email-team prompt", () => {
  const agentsSource = fs.readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8");
  const featureIds = new Set(listEnvitefyMarketingFeatures().map((feature) => feature.id));
  for (const requiredId of [
    "snap-source-import",
    "envitefy-concierge",
    "templates-manual-studio",
    "saved-event-workspace",
    "hosted-live-pages",
    "one-link-sharing-updates",
    "event-details-schedules",
    "calendar-saves",
    "maps-directions",
    "event-access-codes",
    "rsvp-responses",
    "rsvp-households-headcount",
    "rsvp-questions-notes",
    "rsvp-host-dashboard",
    "rsvp-specialized-flows",
    "registries-gifts",
    "smart-signups",
    "guest-reminders-updates",
    "guest-action-center",
    "wedding-suites",
    "family-celebrations",
    "gymnastics-meet-hubs",
    "sports-team-schedules",
    "school-community-business-events",
  ]) {
    assert.ok(featureIds.has(requiredId), `missing product marketing feature: ${requiredId}`);
  }

  const prompt = buildAdminEmailSystemPromptFromGuide("broadcast");
  assert.match(prompt, /Complete Envitefy product marketing catalog/);
  assert.match(prompt, /rsvp-households-headcount/);
  assert.match(prompt, /yes, maybe, and no responses/);
  assert.match(prompt, /automatic waitlists/);
  assert.match(prompt, /Envitefy Concierge/);
  assert.ok(prompt.includes(buildEnvitefyMarketingCatalogPrompt()));
  assert.equal(ADMIN_EMAIL_GENERATION_GUIDE.productCatalog, ENVITEFY_PRODUCT_MARKETING_CATALOG);
  assert.match(agentsSource, /Every launched customer-facing feature must add or update/);
  assert.match(agentsSource, /email marketing LLM prompt/);
});

test("admin email generator builds QA-checked still scenario photos without GIFs", () => {
  const source = emailGeneratorSource();
  const scenarios = emailScenariosSource();
  assert.match(source, /hasCompleteScenarioStillAssets/);
  assert.match(source, /isGifAssetUrl/);
  assert.doesNotMatch(source, /assembleAdminEmailSnapDemoGif/);
  assert.doesNotMatch(source, /generateSnapDemoGifAsset/);
  assert.doesNotMatch(scenarios, /ADMIN_EMAIL_SNAP_GIF_FRAMES/);
  assert.match(scenarios, /id: "snap"/);
  assert.match(scenarios, /id: "rsvp"/);
  assert.match(scenarios, /id: "signups"/);
  assert.match(scenarios, /id: "weddings"/);
  assert.match(scenarios, /id: "sports"/);
  assert.match(scenarios, /stillScene:/);
  assert.match(scenarios, /Documentary-style photo/);
  assert.match(scenarios, /No logos/);
  assert.match(source, /Absolutely no logos or watermarks/);
  assert.match(source, /reasonsIndicateBrandLogo/);
  assert.match(source, /buildStillImageRetryHint/);
  assert.match(source, /\[admin-email\]/);
  assert.match(source, /still_attempt_rejected/);
  assert.match(source, /still_generation_exhausted/);
  assert.match(source, /Last QA:/);
});

test("still image retry hints escalate with prior QA feedback", () => {
  assert.equal(
    buildStillImageRetryHint({ attempt: 1, previousReasons: [], logoRejected: false }),
    "",
  );

  const logoRetry = buildStillImageRetryHint({
    attempt: 2,
    previousReasons: ["Envitefy logo watermark in the corner"],
    logoRejected: true,
  });
  assert.match(logoRetry, /Envitefy logo watermark/i);
  assert.match(logoRetry, /CRITICAL FIX/i);
  assert.match(logoRetry, /blank phone lock screen|non-branded/i);
  assert.doesNotMatch(logoRetry, /Final attempt/);

  const finalLogoRetry = buildStillImageRetryHint({
    attempt: 3,
    previousReasons: ["Brand badge overlay"],
    logoRejected: true,
  });
  assert.match(finalLogoRetry, /Final attempt/i);
  assert.match(finalLogoRetry, /zero text/i);

  const surrealRetry = buildStillImageRetryHint({
    attempt: 2,
    previousReasons: ["glowing UI bubbles and collage panels"],
    logoRejected: false,
  });
  assert.match(surrealRetry, /glowing UI bubbles/i);
  assert.match(surrealRetry, /documentary stock photograph/i);
  assert.doesNotMatch(surrealRetry, /CRITICAL FIX/);

  const generateErrorRetry = buildStillImageRetryHint({
    attempt: 2,
    previousReasons: ["image generation error: rate_limit_exceeded"],
    logoRejected: false,
  });
  assert.match(generateErrorRetry, /rate_limit_exceeded/i);
  assert.match(generateErrorRetry, /Simplify the scene/i);
  assert.doesNotMatch(generateErrorRetry, /documentary stock photograph/i);
});

test("admin email generation requests require a prompt and normalize audience mode", () => {
  assert.deepEqual(parseAdminEmailGenerationRequest({ prompt: "" }), {
    ok: false,
    error: "Prompt is required.",
  });

  const parsed = parseAdminEmailGenerationRequest({
    prompt: "Generate a launch email for parents.",
    audienceMode: "broadcast",
    currentSubject: " Existing subject ",
    currentScenarioRows: [
      {
        scenarioId: "snap",
        title: " Existing wedding row ",
        body: " Existing copy ",
        imageScene: " Existing scene ",
      },
    ],
    currentImageAssets: [
      {
        role: "scenario",
        scenarioId: "snap",
        url: "https://envitefy.com/api/blob/event-media/admin-email/demo/header/snap.png",
        altText: " Snap photo ",
        prompt: " Snap scene ",
        model: "gpt-image-2",
      },
      {
        role: "demo",
        scenarioId: "snap",
        url: "https://envitefy.com/api/blob/event-media/admin-email/demo/header/snap-demo.gif",
        altText: "Legacy gif",
        prompt: "gif",
        model: "gpt-image-2",
      },
      { role: "hero", url: "javascript:alert('bad')" },
    ],
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.prompt, "Generate a launch email for parents.");
    assert.equal(parsed.value.audienceMode, "broadcast");
    assert.equal(parsed.value.currentSubject, "Existing subject");
    assert.deepEqual(parsed.value.currentImageAssets, [
      {
        role: "scenario",
        scenarioId: "snap",
        url: "https://envitefy.com/api/blob/event-media/admin-email/demo/header/snap.png",
        altText: "Snap photo",
        prompt: "Snap scene",
        model: "gpt-image-2",
      },
    ]);
    assert.deepEqual(parsed.value.currentScenarioRows, [
      {
        scenarioId: "snap",
        title: "Existing wedding row",
        body: "Existing copy",
        imageScene: "Existing scene",
      },
    ]);
  }
});

test("legacy gif assets force regeneration and are stripped from html", () => {
  assert.equal(
    hasCompleteScenarioStillAssets([
      {
        role: "demo",
        scenarioId: "snap",
        url: "http://localhost:3000/api/blob/event-media/x/header/snap-demo.gif",
        altText: "gif",
        prompt: "gif",
        model: "gpt-image-2",
      },
    ]),
    false,
  );

  const polished = polishAdminEmailBodyHtml(`
    <img src="http://localhost:3000/api/blob/x/snap-demo.gif" alt="gif">
    <p>Keep me</p>
  `);
  assert.doesNotMatch(polished, /\.gif/i);
  assert.match(polished, /Keep me/);
});

test("generated email HTML is reduced to a safe fragment", () => {
  const html = sanitizeGeneratedEmailHtml(`
    <!doctype html>
    <html>
      <head><title>Bad wrapper</title></head>
      <body>
        <p onclick="alert('x')" style="margin:0;">Hi {{firstName}}</p>
        <script>alert("bad")</script>
        <a href="javascript:alert('bad')">Open</a>
        <img src="data:image/png;base64,bad" alt="bad">
        <img src="https://envitefy.com/email/good.webp" alt="good">
      </body>
    </html>
  `);

  assert.match(html, /Hi \{\{firstName\}\}/);
  assert.match(html, /https:\/\/envitefy\.com\/email\/good\.webp/);
  assert.doesNotMatch(html, /doctype|<html|<head|<body|<script/i);
  assert.doesNotMatch(html, /onclick|javascript:|base64/i);
});

test("generated drafts require subject and body and keep only http CTA urls", () => {
  assert.equal(
    normalizeAdminEmailDraft({
      subject: "",
      bodyHtml: "<p>Missing subject</p>",
      buttonUrl: "https://envitefy.com",
    }),
    null,
  );

  const draft = normalizeAdminEmailDraft({
    subject: "Try live event cards",
    preheader: "Make RSVPs easier.",
    bodyHtml: "<p>{{greeting}}, create a live card.</p>",
    buttonText: "Create an event",
    buttonUrl: "javascript:alert('bad')",
    notes: "Assumed birthday parents.",
  });

  assert.deepEqual(draft, {
    subject: "Try live event cards",
    preheader: "Make RSVPs easier.",
    bodyHtml: "<p>{{greeting}}, create a live card.</p>",
    buttonText: "Create an event",
    buttonUrl: "",
    notes: "Assumed birthday parents.",
    scenarioRows: [],
    imageAssets: [],
  });
});

test("only model-selected scenario rows and assets are injected", () => {
  const draft = normalizeAdminEmailDraft({
    subject: "Try live event cards",
    preheader: "Make RSVPs easier.",
    bodyHtml:
      '<p>{{greeting}}</p><h1>Back to school</h1><p>Plan parties easily.</p><p><a href="https://envitefy.com/snap">Turn a flyer into a live event card</a></p>',
    buttonText: "Create an event",
    buttonUrl: "https://envitefy.com/studio",
    notes: "",
    scenarioRows: [
      {
        scenarioId: "snap",
        title: "Snap a wedding invitation in seconds",
        body: "Photograph the wedding invitation and keep its details together in one live card.",
        imageScene: "A parent photographing a printed wedding invitation at a kitchen table.",
      },
      {
        scenarioId: "concierge",
        title: "Create a polished birthday invitation",
        body: "Tell Envitefy Concierge the party details and get a share-ready invitation without a blank form.",
        imageScene: "A parent planning a birthday invitation on a phone at home.",
      },
    ],
  });

  assert.ok(draft);
  const withImage = ensureDraftIncludesImageAssets(draft, [
    {
      role: "scenario",
      scenarioId: "snap",
      url: "https://envitefy.com/api/blob/event-media/admin-email/demo/header/snap.png",
      altText: "Parents: snap a birthday flyer",
      prompt: "snap scene",
      model: "gpt-image-2",
    },
    {
      role: "scenario",
      scenarioId: "concierge",
      url: "https://envitefy.com/api/blob/event-media/admin-email/demo/concierge/display.webp",
      altText: "Birthday coming up? Ask Envitefy Concierge",
      prompt: "concierge scene",
      model: "gpt-image-2",
    },
    {
      role: "scenario",
      scenarioId: "teachers",
      url: "https://envitefy.com/api/blob/event-media/admin-email/demo/teachers/display.webp",
      altText: "Teachers: class parties made simpler",
      prompt: "teachers scene",
      model: "gpt-image-2",
    },
    {
      role: "scenario",
      scenarioId: "share",
      url: "https://envitefy.com/api/blob/event-media/admin-email/demo/share/display.webp",
      altText: "Share one link with every family",
      prompt: "share scene",
      model: "gpt-image-2",
    },
  ]);

  assert.match(withImage.bodyHtml, /snap\.png/);
  assert.match(withImage.bodyHtml, /concierge\/display\.webp/);
  assert.doesNotMatch(withImage.bodyHtml, /teachers\/display\.webp/);
  assert.doesNotMatch(withImage.bodyHtml, /share\/display\.webp/);
  assert.match(withImage.bodyHtml, /https:\/\/envitefy\.com\/snap/);
  assert.match(withImage.bodyHtml, /https:\/\/envitefy\.com\/chat/);
  assert.match(withImage.bodyHtml, /Snap a wedding invitation in seconds/);
  assert.match(withImage.bodyHtml, /Create a polished birthday invitation/);
  assert.match(withImage.bodyHtml, /Try Snap/);
  assert.match(withImage.bodyHtml, /Open Envitefy Concierge/);
  assert.doesNotMatch(withImage.bodyHtml, /Teachers:|class parties/i);
  assert.doesNotMatch(withImage.bodyHtml, /Turn a flyer into a live event card/i);
  assert.doesNotMatch(withImage.bodyHtml, /\.gif/i);
  assert.equal(withImage.buttonText, "");
  assert.equal(withImage.buttonUrl, "");
  assert.equal(withImage.imageAssets.length, 2);
});

test("parents-only campaign briefs reject teacher content before image generation", () => {
  const prompt =
    "Email of how to snap wedding invites and create birthday invites only for parents. Use new images. Make sure it looks professional.";
  const offBrief = normalizeAdminEmailDraft({
    subject: "Wedding and birthday invitations made easy",
    preheader: "Two simple ways to plan.",
    bodyHtml: "<p>{{greeting}}</p><h1>Plan with confidence</h1><p>For parents and teachers.</p>",
    buttonText: "",
    buttonUrl: "",
    notes: "",
    scenarioRows: [
      {
        scenarioId: "teachers",
        title: "Teachers: class parties made simpler",
        body: "Plan a classroom event.",
        imageScene: "Teachers gathered in a classroom.",
      },
    ],
  });
  assert.ok(offBrief);
  assert.match(validateAdminEmailPromptFidelity(prompt, offBrief).join(" "), /parents only/i);
  assert.match(validateAdminEmailPromptFidelity(prompt, offBrief).join(" "), /teachers scenario/i);
  assert.match(
    validateAdminEmailPromptFidelity(prompt, offBrief).join(" "),
    /Envitefy Concierge creation scenario/i,
  );
  assert.deepEqual(
    validateAdminEmailPromptFidelity(
      "Make the subject shorter without changing the campaign sections.",
      offBrief,
      offBrief.scenarioRows,
    ),
    [],
  );

  const onBrief = normalizeAdminEmailDraft({
    subject: "Snap wedding details. Create birthday magic.",
    preheader: "Two professional invitation tools made for busy parents.",
    bodyHtml:
      "<p>{{greeting}}</p><h1>Two invitations, one easier workflow</h1><p>Capture a wedding invitation or create a birthday invitation from your words.</p>",
    buttonText: "",
    buttonUrl: "",
    notes: "Parents-only audience honored.",
    scenarioRows: [
      {
        scenarioId: "snap",
        title: "Snap the wedding invitation",
        body: "Photograph the printed wedding invitation and Envitefy creates a saved live event card with the details organized. Add it to a calendar, share one easy link, and reopen it anytime instead of losing the paper invite or adding more fridge clutter.",
        imageScene: "A parent photographing an elegant printed wedding invitation at home.",
      },
      {
        scenarioId: "concierge",
        title: "Create the birthday invitation",
        body: "Describe the celebration in your own words and Envitefy Concierge creates a polished invitation and live event page. Add RSVP and calendar details, then share one guest-ready link.",
        imageScene: "A parent creating a birthday invitation on a phone in a bright home.",
      },
    ],
  });
  assert.ok(onBrief);
  assert.deepEqual(validateAdminEmailPromptFidelity(prompt, onBrief), []);
});

test("parents-only briefs are repaired automatically instead of exposing a fidelity error", () => {
  const prompt =
    "Email of how to snap wedding invites and create birthday invites only for parents. Use new images. Make sure it looks professional.";
  const repeatedTeacherDraft = normalizeAdminEmailDraft({
    subject: "Wedding and birthday planning for parents and teachers",
    preheader: "Keep every school event organized.",
    bodyHtml:
      "<p>{{greeting}}</p><h1>Plan every invitation</h1><p>Parents and teachers can keep class-party details together.</p>",
    buttonText: "",
    buttonUrl: "",
    notes: "Teacher campaign",
    scenarioRows: [
      {
        scenarioId: "teachers",
        title: "Teachers: class parties made simpler",
        body: "Help school staff plan classroom events.",
        imageScene: "Teachers gathered in a classroom.",
      },
    ],
  });
  assert.ok(repeatedTeacherDraft);

  const constrained = applyAdminEmailPromptConstraints(prompt, repeatedTeacherDraft);
  assert.equal(constrained.scenarioRows.length, 0);
  assert.doesNotMatch(
    [constrained.subject, constrained.preheader, constrained.bodyHtml, constrained.notes].join(" "),
    /teachers?|classrooms?|school[-\s]+staff|class[-\s]+part(?:y|ies)|school[-\s]+events?/i,
  );

  const recovered = recoverAdminEmailDraftForPrompt(prompt, repeatedTeacherDraft);
  assert.deepEqual(
    recovered.scenarioRows.map((row) => row.scenarioId),
    ["snap", "concierge"],
  );
  assert.match(recovered.scenarioRows[0]?.title || "", /wedding/i);
  assert.match(recovered.scenarioRows[1]?.title || "", /birthday/i);
  assert.deepEqual(validateAdminEmailPromptFidelity(prompt, recovered), []);
  assert.doesNotMatch(
    [
      recovered.subject,
      recovered.preheader,
      recovered.bodyHtml,
      ...recovered.scenarioRows.flatMap((row) => [row.title, row.body, row.imageScene]),
    ].join(" "),
    /teachers?|classrooms?|school[-\s]+staff|class[-\s]+part(?:y|ies)|school[-\s]+events?/i,
  );
  assert.doesNotMatch(emailGeneratorSource(), /Email generator did not follow the campaign brief/);
});

test("teacher and room-parent preset recovers to a clean relevant scenario set", () => {
  const prompt =
    "Email for teachers and room parents: turn class party flyers into live pages, collect helpers with smart sign-ups, and share one link with every family.";
  const rejectedDraft = normalizeAdminEmailDraft({
    subject: "Simplify the next class party",
    preheader: "One place for the flyer and helpers.",
    bodyHtml:
      "<p>{{greeting}}</p><h1>Make class parties easier</h1><p>Keep every family informed.</p>",
    buttonText: "",
    buttonUrl: "",
    notes: "",
    scenarioRows: [
      {
        scenarioId: "snap",
        title: "Turn the flyer into a card",
        body: "Photograph the flyer.",
        imageScene: "A classroom flyer on a desk.",
      },
      {
        scenarioId: "rsvp",
        title: "Collect replies",
        body: "Add an RSVP button.",
        imageScene: "A teacher looking at a phone.",
      },
    ],
  });
  assert.ok(rejectedDraft);

  const recovered = recoverAdminEmailDraftForPrompt(prompt, rejectedDraft);
  assert.deepEqual(
    recovered.scenarioRows.map((row) => row.scenarioId),
    ["teachers", "signups", "share"],
  );
  assert.deepEqual(validateAdminEmailPromptFidelity(prompt, recovered), []);
  assert.doesNotMatch(recovered.bodyHtml, /Photograph the flyer|Add an RSVP button/i);

  const recoveredWithoutCandidate = recoverAdminEmailDraftForPrompt(prompt, null);
  assert.deepEqual(
    recoveredWithoutCandidate.scenarioRows.map((row) => row.scenarioId),
    ["teachers", "signups", "share"],
  );
  assert.deepEqual(validateAdminEmailPromptFidelity(prompt, recoveredWithoutCandidate), []);
});

test("Snap scenario copy must explain the full product outcome", () => {
  const shallowDraft = normalizeAdminEmailDraft({
    subject: "Snap a wedding invite",
    preheader: "Keep the details handy.",
    bodyHtml:
      "<p>{{greeting}}</p><h1>Snap the invitation</h1><p>Turn the printed details into a live card.</p>",
    buttonText: "",
    buttonUrl: "",
    notes: "",
    scenarioRows: [
      {
        scenarioId: "snap",
        title: "Snap a wedding invite into a live card",
        body: "Photograph a printed wedding invitation to quickly turn its details into a convenient live card that parents can keep handy.",
        imageScene: "A parent photographing a printed wedding invitation.",
      },
    ],
  });
  assert.ok(shallowDraft);
  const violations = validateAdminEmailPromptFidelity(
    "Explain how parents can snap a wedding invitation.",
    shallowDraft,
  ).join(" ");
  assert.match(violations, /calendar action/i);
  assert.match(violations, /easy sharing/i);

  const completeDraft = normalizeAdminEmailDraft({
    ...shallowDraft,
    scenarioRows: [
      {
        scenarioId: "snap",
        title: "Turn the paper invite into an event you can use",
        body: "Snap or upload the wedding invitation and Envitefy creates a saved live event card with every important detail organized. Add it to your calendar, share one easy link, and reopen it anytime instead of losing the paper invite or crowding the fridge.",
        imageScene: "A parent photographing a printed wedding invitation.",
      },
    ],
  });
  assert.ok(completeDraft);
  assert.deepEqual(
    validateAdminEmailPromptFidelity(
      "Explain how parents can snap a wedding invitation.",
      completeDraft,
    ),
    [],
  );
});

test("explicit RSVP and smart-signup briefs require complete dedicated scenarios", () => {
  const incompleteRsvpDraft = normalizeAdminEmailDraft({
    subject: "Know who is coming",
    preheader: "Keep guest replies organized.",
    bodyHtml:
      "<p>{{greeting}}</p><h1>Make responses easier</h1><p>Collect RSVP responses from one event page.</p>",
    buttonText: "",
    buttonUrl: "",
    notes: "",
    scenarioRows: [
      {
        scenarioId: "live-page",
        title: "One live page",
        body: "Guests can RSVP from the event page.",
        imageScene: "A parent reviewing an event page on a phone.",
      },
    ],
  });
  assert.ok(incompleteRsvpDraft);
  assert.match(
    validateAdminEmailPromptFidelity(
      "Email for parents about RSVP, household headcounts, and pending replies.",
      incompleteRsvpDraft,
    ).join(" "),
    /include an RSVP scenario/i,
  );

  const completeRsvpDraft = normalizeAdminEmailDraft({
    ...incompleteRsvpDraft,
    scenarioRows: [
      {
        scenarioId: "rsvp",
        title: "Keep every RSVP with the invitation",
        body: "Guests respond from the live page while the host tracks household headcounts, plus-ones, notes, and pending replies in one organized place.",
        imageScene: "A parent reviewing birthday guest responses on a laptop.",
      },
    ],
  });
  assert.ok(completeRsvpDraft);
  assert.deepEqual(
    validateAdminEmailPromptFidelity(
      "Email for parents about RSVP, household headcounts, and pending replies.",
      completeRsvpDraft,
    ),
    [],
  );

  const shallowSignupDraft = normalizeAdminEmailDraft({
    subject: "Organize volunteer signups",
    preheader: "A simple form for helpers.",
    bodyHtml:
      "<p>{{greeting}}</p><h1>Bring every helper together</h1><p>Create a volunteer signup.</p>",
    buttonText: "",
    buttonUrl: "",
    notes: "",
    scenarioRows: [
      {
        scenarioId: "signups",
        title: "Volunteer signup",
        body: "Create a form for volunteer roles and share it with the group.",
        imageScene: "A community organizer planning with a laptop.",
      },
    ],
  });
  assert.ok(shallowSignupDraft);
  const signupViolations = validateAdminEmailPromptFidelity(
    "Promote smart signups for volunteer shifts, capacity, and waitlists.",
    shallowSignupDraft,
  ).join(" ");
  assert.match(signupViolations, /claimed, full, waitlisted, or still needed/i);

  const completeSignupDraft = normalizeAdminEmailDraft({
    ...shallowSignupDraft,
    scenarioRows: [
      {
        scenarioId: "signups",
        title: "Fill every volunteer shift without spreadsheet cleanup",
        body: "Create volunteer slots with capacity and automatic waitlists, then see what is claimed, full, waitlisted, or still needed from one live form.",
        imageScene: "A community organizer reviewing volunteer shifts on a laptop.",
      },
    ],
  });
  assert.ok(completeSignupDraft);
  assert.deepEqual(
    validateAdminEmailPromptFidelity(
      "Promote smart signups for volunteer shifts, capacity, and waitlists.",
      completeSignupDraft,
    ),
    [],
  );
});

test("generated copy always uses the full Envitefy Concierge product name", () => {
  const bareNameDraft = normalizeAdminEmailDraft({
    subject: "Create your birthday invitation with Concierge",
    preheader: "Turn your words into a polished event page.",
    bodyHtml:
      "<p>{{greeting}}</p><h1>Start with a simple description</h1><p>Concierge helps shape the invitation.</p>",
    buttonText: "",
    buttonUrl: "",
    notes: "",
    scenarioRows: [
      {
        scenarioId: "concierge",
        title: "Ask Concierge",
        body: "Concierge drafts a polished invitation from your words with RSVP and a shareable link.",
        imageScene: "A parent creating an invitation on a phone.",
      },
    ],
  });
  assert.ok(bareNameDraft);
  assert.equal(bareNameDraft.subject, "Create your birthday invitation with Envitefy Concierge");
  assert.match(bareNameDraft.bodyHtml, /Envitefy Concierge helps shape the invitation/);
  assert.equal(bareNameDraft.scenarioRows[0]?.title, "Ask Envitefy Concierge");
  assert.doesNotMatch(
    [
      bareNameDraft.subject,
      bareNameDraft.bodyHtml,
      ...bareNameDraft.scenarioRows.flatMap((row) => [row.title, row.body]),
    ].join(" "),
    /(?<!Envitefy\s)\bConcierge\b/i,
  );
  assert.deepEqual(
    validateAdminEmailPromptFidelity("Create a birthday invitation for parents.", bareNameDraft),
    [],
  );

  const brandedDraft = normalizeAdminEmailDraft({
    ...bareNameDraft,
    subject: "Create your birthday invitation with Envitefy Concierge",
    bodyHtml:
      "<p>{{greeting}}</p><h1>Start with a simple description</h1><p>Envitefy Concierge helps shape the invitation.</p>",
    scenarioRows: [
      {
        scenarioId: "concierge",
        title: "Ask Envitefy Concierge",
        body: "Envitefy Concierge drafts a polished invitation from your words with RSVP and a shareable link.",
        imageScene: "A parent creating an invitation on a phone.",
      },
    ],
  });
  assert.ok(brandedDraft);
  assert.deepEqual(
    validateAdminEmailPromptFidelity("Create a birthday invitation for parents.", brandedDraft),
    [],
  );
});

test("polish removes flyer text links and duplicate purple buttons", () => {
  const polished = polishAdminEmailBodyHtml(`
    <div style="text-align:center; margin:0;">
      <a href="https://envitefy.com/snap" style="background-color:#7F67D3; color:#FFFFFF;">Try Snap</a>
    </div>
    <a href="https://envitefy.com/snap">Turn a flyer into a live event card</a>
    <div style="text-align:center; margin:0;">
      <a href="https://envitefy.com" style="background-color:#7F67D3; color:#FFFFFF;">Create an event</a>
    </div>
    <div style="text-align:center; margin:0;">
      <a href="https://envitefy.com" style="background-color:#7F67D3; color:#FFFFFF;">Create an event</a>
    </div>
  `);

  assert.match(polished, /Try Snap/);
  assert.doesNotMatch(polished, /Turn a flyer into a live event card/i);
  assert.equal((polished.match(/Create an event/g) || []).length, 1);
});

test("campaign intro removes model-owned nested card styling", () => {
  const intro = extractCampaignIntroHtml(`
    <div style="background:#fff; border:1px solid #ddd; border-radius:16px; padding:28px;">
      <p style="background:#fafafa; padding:8px;">{{greeting}}</p>
      <h1 style="background:#fff; margin:20px;">Keep every invitation useful</h1>
      <p style="border:1px solid #ddd;">Snap the details and keep them ready.</p>
    </div>
  `);

  assert.doesNotMatch(intro, /<\/?div\b/i);
  assert.doesNotMatch(intro, /background|border|padding/i);
  assert.match(intro, /<p style="margin:0 0 16px 0;/);
  assert.match(intro, /<h1 style="margin:0 0 12px 0;/);
  assert.match(intro, /<p style="margin:0 0 24px 0;/);
});

test("polish strips repeated firstName after greeting", () => {
  const polished = polishAdminEmailBodyHtml(`
    <p style="margin:0 0 16px 0;">{{greeting}}</p>
    <h1>Make the birthday invite easy</h1>
    <p>{{firstName}}, snap a party flyer into a live card, use Envitefy Concierge while the details come together.</p>
  `);

  assert.match(polished, /\{\{greeting\}\}/);
  assert.doesNotMatch(polished, /\{\{firstName\}\}/);
  assert.match(polished, /Snap a party flyer into a live card/);

  assert.equal(
    stripRedundantNameAfterGreeting(
      `<p>{{firstName}}, before greeting should stay.</p><p>{{greeting}}</p>`,
    ),
    `<p>{{firstName}}, before greeting should stay.</p><p>{{greeting}}</p>`,
  );
});

test("generation guide forbids repeating the recipient name after greeting", () => {
  const guideSource = fs.readFileSync(
    path.join(repoRoot, "src/lib/admin/email-generation-guide.ts"),
    "utf8",
  );
  assert.match(guideSource, /Do not repeat the recipient name after \{\{greeting\}\}/);
  assert.match(guideSource, /Do not also lead the next paragraph with \{\{firstName\}\}/);
});

test("scenario row helper renders title body image and CTA", () => {
  const html = buildScenarioRowHtml({
    title: "Parents: snap a birthday flyer",
    body: "Point the camera at the invite.",
    ctaLabel: "Try Snap",
    ctaUrl: "https://envitefy.com/snap",
    image: {
      role: "scenario",
      scenarioId: "snap",
      url: "https://envitefy.com/snap.png",
      altText: "Snap photo",
      prompt: "scene",
      model: "gpt-image-2",
    },
  });

  assert.match(html, /Parents: snap a birthday flyer/);
  assert.match(html, /Try Snap/);
  assert.match(html, /https:\/\/envitefy\.com\/snap/);
  assert.match(html, /snap\.png/);
  assert.match(html, /border-top:1px solid #E8E1FF/);
  assert.doesNotMatch(html, /background:#FBFAFF|border-radius:16px/);
});

test("image QA rejects high AI-ish scores and keeps guide reject traits", () => {
  const rejected = normalizeAdminEmailImageQaResult({
    pass: true,
    aiIshScore: 0.8,
    reasons: ["glowing overlays"],
  });
  assert.ok(rejected);
  assert.equal(rejected.pass, false);
  assert.equal(rejected.aiIshScore, 0.8);

  const mild = normalizeAdminEmailImageQaResult({
    pass: true,
    aiIshScore: 0.5,
    reasons: ["phone screen shows paper detail"],
  });
  assert.ok(mild);
  assert.equal(mild.pass, true);

  const logo = normalizeAdminEmailImageQaResult({
    pass: true,
    aiIshScore: 0.2,
    hasBrandLogoOverlay: true,
    reasons: [],
  });
  assert.ok(logo);
  assert.equal(logo.pass, false);
  assert.match(logo.reasons.join(" "), /logo|watermark/i);

  const prompt = buildAdminEmailImageQaPrompt(ADMIN_EMAIL_GENERATION_GUIDE.imageVisuals);
  assert.match(prompt, /glowing overlays|floating icons|stock-photo/i);
  assert.match(prompt, /phones|printed invitation/i);
  assert.match(prompt, /HARD FAIL if any brand logo/i);
  assert.match(prompt, /Do NOT fail solely/i);
});

test("image QA does not treat negated logo reasons as brand overlays", () => {
  assert.equal(
    reasonsIndicateBrandLogo([
      "Looks like a natural lifestyle photograph with realistic lighting and materials",
      "Single-scene composition with a person using a phone and writing in a notebook",
      "No visible logo, watermark, badge, or brand overlay",
    ]),
    false,
  );
  assert.equal(reasonsIndicateBrandLogo(["Envitefy logo watermark in the corner"]), true);
  assert.equal(reasonsIndicateBrandLogo(["without logos or watermarks"]), false);

  const passed = normalizeAdminEmailImageQaResult({
    pass: true,
    aiIshScore: 0.25,
    hasBrandLogoOverlay: false,
    reasons: [
      "Looks like a natural lifestyle photograph with realistic lighting and materials",
      "No visible logo, watermark, badge, or brand overlay",
    ],
  });
  assert.ok(passed);
  assert.equal(passed.pass, true);
  assert.ok(passed.aiIshScore < 0.75);
});
