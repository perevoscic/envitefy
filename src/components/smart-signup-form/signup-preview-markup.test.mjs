import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
function load(relative, mocks, cache = new Map()) {
  const file = path.resolve(relative);
  if (file.endsWith(".json")) return JSON.parse(readFileSync(file, "utf8"));
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  function require(name) {
    if (name in mocks) return mocks[name];
    if (name.endsWith(".css"))
      return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (!name.startsWith(".") && !name.startsWith("@/")) return nativeRequire(name);
    const base = name.startsWith("@/")
      ? path.resolve("src", name.slice(2))
      : path.resolve(path.dirname(file), name);
    return load([base, `${base}.ts`, `${base}.tsx`].find(existsSync), mocks, cache);
  }
  new Function("require", "module", "exports", code)(require, module, module.exports);
  return module.exports;
}
const baseMocks = {
  "lucide-react": {
    Pencil: (props) => React.createElement("svg", props),
    Check: (props) => React.createElement("svg", props),
    X: (props) => React.createElement("svg", props),
    Copy: (props) => React.createElement("svg", props),
    GripVertical: (props) => React.createElement("svg", props),
    Trash2: (props) => React.createElement("svg", props),
    Upload: (props) => React.createElement("svg", props),
    ImagePlus: (props) => React.createElement("svg", props),
    RotateCcw: (props) => React.createElement("svg", props),
    Sparkles: (props) => React.createElement("svg", props),
    Undo2: (props) => React.createElement("svg", props),
  },
  "next/navigation": { useRouter: () => ({}) },
  "next-auth/react": { useSession: () => ({ status: "authenticated", update: async () => {} }) },
  "@/components/auth/AuthModal": { __esModule: true, default: () => null },
  "@/components/EventDeleteModal": { __esModule: true, default: () => null },
  "@/components/templates/TemplateEditorContext": { useTemplateEditor: () => null },
  "@/utils/media-upload-client": { validateClientUploadFile: () => null },
  "@/utils/thumbnail": { readFileAsDataUrl: async () => "" },
};
const { createSignupThemeForm } = load("src/lib/signup-starters.ts", baseMocks);

test("public guests can find their signup without exposing recovery inside owner tools or previews", () => {
  const Viewer = load("src/components/smart-signup-form/SignupViewer.tsx", baseMocks).default;
  const props = {
    eventId: "school",
    initialForm: createSignupThemeForm("harvest-table"),
    viewerKind: "guest",
  };
  const guest = renderToStaticMarkup(React.createElement(Viewer, props));
  assert.match(guest, /Already signed up\? Find my signup/);
  assert.match(guest, /Email or phone number/);
  assert.match(guest, /Email my link/);
  assert.doesNotMatch(
    renderToStaticMarkup(React.createElement(Viewer, { ...props, viewerKind: "owner" })),
    /Already signed up/,
  );
  assert.doesNotMatch(
    renderToStaticMarkup(React.createElement(Viewer, { ...props, eventId: "preview" })),
    /Already signed up/,
  );
  assert.doesNotMatch(
    renderToStaticMarkup(React.createElement(Viewer, { ...props, requiresInvitation: true })),
    /Already signed up/,
  );
});

test("device preview hides signup editing tools while preserving the sign-up board", () => {
  const Viewer = load("src/components/smart-signup-form/SignupViewer.tsx", baseMocks).default;
  const form = createSignupThemeForm("harvest-table");
  const props = {
    eventId: "school",
    initialForm: form,
    viewerKind: "owner",
  };
  const regular = renderToStaticMarkup(React.createElement(Viewer, props));
  assert.doesNotMatch(regular, /Edit event|Duplicate form/);
  assert.match(regular, /Host dashboard/);
  const preview = renderToStaticMarkup(
    React.createElement(Viewer, { ...props, hideOwnerTools: true }),
  );
  assert.match(preview, /Sign-up board/);
  assert.doesNotMatch(preview, /Edit event|Duplicate form|Host dashboard/);
});

test("signup owner actions render above the hero, separate from the response board", () => {
  const Page = load("src/components/smart-signup-form/SignupPageRenderer.tsx", baseMocks).default;
  const OwnerActions = load(
    "src/components/smart-signup-form/SignupOwnerActions.tsx",
    baseMocks,
  ).default;
  const form = createSignupThemeForm("harvest-table");
  const ownerActions = React.createElement(OwnerActions, {
    eventId: "school",
    eventTitle: "School event",
    eventData: { signupForm: form },
    form,
  });
  const html = renderToStaticMarkup(React.createElement(Page, { form, ownerActions }));
  assert.equal((html.match(/aria-label="Manage signup form"/g) || []).length, 1);
  assert.ok(html.indexOf('aria-label="Manage signup form"') < html.indexOf("<h1"));
  assert.match(html, /aria-label="Edit event"/);
  assert.match(html, /aria-label="Duplicate form"/);
  const guest = renderToStaticMarkup(React.createElement(Page, { form }));
  assert.doesNotMatch(guest, /Manage signup form|Edit event|Duplicate form/);
});

test("all 150 templates retain a distinct curated design through saving and rendering", () => {
  const { getPublicTemplates } = load("src/lib/public-template-catalog.ts", baseMocks);
  const { SIGNUP_DESIGNS, SIGNUP_DESIGN_PALETTES } = load("src/lib/signup-designs.ts", baseMocks);
  const { createSignupTemplateForm } = load("src/lib/signup-starters.ts", baseMocks);
  const { sanitizeSignupForm } = load("src/utils/signup.ts", baseMocks);
  const { signupContrast } = load("src/lib/signup-themes.ts", baseMocks);
  const Header = load(
    "src/components/smart-signup-form/SignupTemplateHeader.tsx",
    baseMocks,
  ).default;
  const templates = getPublicTemplates("signup-forms");
  assert.equal(SIGNUP_DESIGNS.length, templates.length);
  assert.equal(new Set(SIGNUP_DESIGNS.map((design) => design.composition)).size, 12);
  const signatures = new Set();
  for (const template of templates) {
    const design = SIGNUP_DESIGNS.find((design) => design.id === template.id);
    assert.ok(design, template.id);
    const signature = JSON.stringify([
      design.composition,
      design.palette,
      ["menu", "botanical", "journal", "invitation", "scrapbook"].includes(design.composition)
        ? design.motif
        : null,
      design.reverse,
    ]);
    assert.ok(!signatures.has(signature), `Duplicate art direction: ${template.id}`);
    signatures.add(signature);
    const form = createSignupTemplateForm(template);
    const saved = sanitizeSignupForm(JSON.parse(JSON.stringify(form)));
    assert.equal(saved.appearance.designId, template.id);
    assert.equal(saved.appearance.headerLayout, "designed");
    assert.deepEqual(
      saved.sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        slots: section.slots.map(({ id, label, capacity, notes }) => ({
          id,
          label,
          capacity,
          notes,
        })),
      })),
      form.sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        slots: section.slots.map(({ id, label, capacity, notes }) => ({
          id,
          label,
          capacity,
          notes,
        })),
      })),
    );
    const html = renderToStaticMarkup(React.createElement(Header, { form: saved }));
    assert.ok(html.includes(`data-composition="${design.composition}"`), template.id);
    assert.ok(html.includes(template.heroImage), template.id);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, template.id);
    for (const colors of [SIGNUP_DESIGN_PALETTES[design.palette]]) {
      assert.ok(signupContrast(colors.accent, "#FFFFFF") >= 4.5, `${template.id}: CTA`);
      assert.ok(signupContrast(colors.ink, colors.page) >= 7, `${template.id}: body`);
      assert.ok(signupContrast(colors.ink, colors.surface) >= 7, `${template.id}: form`);
    }
  }
});

test("designed headers retain empty-image and legacy-layout choices", () => {
  const { createSignupTemplateForm } = load("src/lib/signup-starters.ts", baseMocks);
  const { normalizeSignupAppearance } = load("src/lib/signup-themes.ts", baseMocks);
  const Header = load(
    "src/components/smart-signup-form/SignupTemplateHeader.tsx",
    baseMocks,
  ).default;
  const form = createSignupTemplateForm({
    id: "editorial--harvest-table",
    name: "Harvest Table",
    heroImage: "/templates/signup/editorial/harvest-table.webp",
  });
  form.header.backgroundImage = null;
  let html = renderToStaticMarkup(React.createElement(Header, { form }));
  assert.ok(html.includes('data-without-image="true"'));
  assert.ok(!html.includes("<img"));
  form.appearance.headerLayout = "none";
  html = renderToStaticMarkup(React.createElement(Header, { form }));
  assert.ok(!html.includes("data-composition"));
  assert.ok(!html.includes("<img"));
  const legacy = { ...form.appearance, designId: undefined, headerLayout: "header-2" };
  assert.equal(normalizeSignupAppearance(legacy).designId, undefined);
  assert.equal(normalizeSignupAppearance(legacy).headerLayout, "header-2");
  assert.equal(
    normalizeSignupAppearance({ ...legacy, designId: "unrecognized" }).designId,
    undefined,
  );
});

test("every signup catalog item renders an inert artwork thumbnail without form controls", () => {
  const { getPublicTemplates } = load("src/lib/public-template-catalog.ts", baseMocks);
  const Preview = load(
    "src/components/smart-signup-form/SignupTemplatePreview.tsx",
    baseMocks,
  ).default;
  for (const template of getPublicTemplates("signup-forms")) {
    const html = renderToStaticMarkup(React.createElement(Preview, { template }));
    assert.match(html, /data-template-thumbnail-preview="true"/);
    assert.match(html, /aria-hidden="true" inert=""/);
    assert.match(html, /aspect-square/);
    assert.doesNotMatch(html, /scale-\[0\.25\]/);
    assert.match(html, /data-composition=/);
    assert.ok(html.includes(template.heroImage), template.id);
    assert.ok(
      html.includes(template.name.replaceAll("&", "&amp;").replaceAll("'", "&#x27;")),
      template.id,
    );
    assert.doesNotMatch(html, /data-signup-slot=|<button\b|<input\b|<form\b|Hosted by/);
  }
});

function verifyMarkup(html, expectDesignPanel = true) {
  let depth = 0;
  for (const tag of html.matchAll(/<\/?button\b[^>]*>/g)) {
    depth += tag[0].startsWith("</") ? -1 : 1;
    assert.ok(depth >= 0 && depth <= 1, "A button must never contain another button");
  }
  assert.equal(depth, 0);
  assert.doesNotMatch(html, /Make it feel like your event|Explore all 150 designs|Use [^"]+ theme/);
  for (const label of expectDesignPanel
    ? ["Color palette", "Typography", "Header layout", "Fine-tune the design"]
    : []) {
    assert.ok(html.includes(label), label);
  }
  assert.doesNotMatch(html, /Photos &amp; artwork|Search artwork|Choose artwork/);
}

test("design editor retains customization controls without repeating template selection", () => {
  const Panel = load("src/components/smart-signup-form/SignupDesignPanel.tsx", baseMocks).default;
  verifyMarkup(
    renderToStaticMarkup(
      React.createElement(Panel, { form: createSignupThemeForm("harvest-table"), onChange() {} }),
    ),
  );
});

test("direct photo selection changes only the selected signup gallery image", () => {
  const Actions = load(
    "src/components/smart-signup-form/SignupImageActions.tsx",
    baseMocks,
  ).default;
  const form = createSignupThemeForm("harvest-table");
  form.appearance.headerLayout = "header-6";
  form.header.images = [0, 1, 2].map((index) => ({
    id: `photo-${index}`,
    name: `Photo ${index}`,
    type: "image/webp",
    dataUrl: `/photo-${index}.webp`,
  }));
  let updated;
  const controls = Actions({
    form,
    onChange: (value) => {
      updated = value;
    },
  }).props.children;
  controls[1].props.onChange("data:image/png;base64,aW1hZ2U=");
  assert.equal(updated.header.images[1].dataUrl, "data:image/png;base64,aW1hZ2U=");
  assert.equal(updated.header.images[1].id, "photo-1");
  assert.equal(updated.header.images[1].type, "image/png");
  assert.deepEqual(updated.header.images[0], form.header.images[0]);
  assert.deepEqual(updated.header.images[2], form.header.images[2]);
  assert.equal(form.header.images[1].dataUrl, "/photo-1.webp");
  assert.equal(updated.appearance.headerLayout, "header-6");
});

test("composer replaces the four-step wizard and keeps guest preview separate from editing", () => {
  for (const step of ["design", "details", "build", "review"]) {
    const Wizard = load("src/components/smart-signup-form/Wizard.tsx", {
      ...baseMocks,
      "./SignupContentEditor": {
        __esModule: true,
        default: () => React.createElement("div", null, "Editable sections"),
      },
      "./SignupDetailsEditor": { __esModule: true, default: () => null },
      "@/components/templates/TemplateEditorContext": {
        useTemplateEditor: () => null,
        useTemplateState: () => React.useState(step),
      },
      react: {
        ...React,
        useState: (initial) =>
          React.useState(initial === "build" ? (step === "review" ? "review" : "build") : initial),
      },
    }).default;
    const html = renderToStaticMarkup(
      React.createElement(Wizard, {
        form: createSignupThemeForm("harvest-table"),
        onChange() {},
        onSubmit() {},
      }),
    );
    verifyMarkup(html, false);
    assert.doesNotMatch(html, /Signup editor views/);
    assert.doesNotMatch(html, /Step [1-4] of 4|Start with a little structure/);
    if (step === "review") {
      assert.doesNotMatch(
        html,
        /Ready to publish|Your draft stays private until you publish|Guest preview — try it|Test signups are never saved/,
      );
      assert.match(html, /Publish signup/);
      assert.doesNotMatch(html, /Change hero image|Editable sections/);
    } else {
      assert.match(html, /Editable sections/);
      assert.match(html, /Form tools/);
      assert.match(html, /Registration places/);
      assert.match(html, /Change hero image/);
      // Keep the optional panel mounted so switching tools retains a custom brief and Undo.
      assert.match(html, /<div hidden="">[\s\S]*Color palette/);
    }
  }
});

test("custom recipes render the saved composition and board without exposing editing controls to guests", () => {
  const { applySignupCustomTheme } = load("src/lib/signup-custom-theme.ts", baseMocks);
  const Page = load("src/components/smart-signup-form/SignupPageRenderer.tsx", baseMocks).default;
  for (const board of ["ledger", "menu", "outline", "tiles", "tickets"]) {
    const form = applySignupCustomTheme(createSignupThemeForm("harvest-table"), {
      version: 1,
      name: "Custom woodland",
      description: "Sage paper and watercolor woodland.",
      composition: "botanical",
      board,
      motif: "sprig",
      reverse: false,
      fontPair: "friendly",
      colors: {
        page: "#F3F2EE",
        surface: "#FFFFFF",
        soft: "#E8ECF2",
        ink: "#222D40",
        accent: "#354B72",
        secondary: "#91A889",
      },
    });
    const html = renderToStaticMarkup(React.createElement(Page, { form }));
    assert.match(html, /data-signup-design="custom"/);
    assert.match(html, /data-composition="botanical"/);
    assert.ok(html.includes(`data-signup-board="${board}"`));
    assert.match(html, /--signup-secondary:#91A889/);
    assert.doesNotMatch(
      html,
      /Create with Envitefy|Undo design change|Edit event title|Describe your design/,
    );
  }
});

test("starters switch immediately for every untouched template and protect edited slot definitions", () => {
  const { getPublicTemplates } = load("src/lib/public-template-catalog.ts", baseMocks);
  const {
    createSignupTemplateForm,
    applySignupStarter,
    signupStarterNeedsConfirmation,
    SIGNUP_STARTERS,
  } = load("src/lib/signup-starters.ts", baseMocks);
  const { sanitizeSignupForm } = load("src/utils/signup.ts", baseMocks);
  for (const template of getPublicTemplates("signup-forms")) {
    const sample = createSignupTemplateForm(template);
    assert.equal(signupStarterNeedsConfirmation(sample), false, template.id);
    assert.equal(
      signupStarterNeedsConfirmation(sanitizeSignupForm(sample)),
      false,
      `saved ${template.id}`,
    );
  }
  const form = createSignupTemplateForm({
    id: "editorial--clean-clear",
    name: "Clean & Clear",
    heroImage: "/sample.webp",
  });
  form.title = "My own event title";
  form.settings.collectPhone = true;
  let selected = form;
  for (const starter of SIGNUP_STARTERS) {
    selected = applySignupStarter(selected, starter.id);
    assert.equal(signupStarterNeedsConfirmation(selected), false, starter.id);
    assert.equal(selected.starterId, starter.id);
    assert.deepEqual(
      selected.sections[0].slots.map((slot) => slot.label),
      [...starter.slots],
    );
    assert.equal(selected.title, form.title);
    assert.equal(selected.settings.collectPhone, true);
    assert.deepEqual(selected.appearance, form.appearance);
    assert.deepEqual(selected.questions, form.questions);
    assert.deepEqual(selected.header, form.header);
  }
  for (const edit of [
    (value) => {
      value.sections[0].title = "My section";
    },
    (value) => {
      value.sections[0].description = "My instructions";
    },
    (value) => {
      value.sections[0].slots[0].label = "My slot";
    },
    (value) => {
      value.sections[0].slots[0].capacity = 17;
    },
    (value) => {
      value.sections[0].slots[0].notes = "My notes";
    },
    (value) => {
      value.sections[0].slots[0].startTime = "09:15";
    },
    (value) => {
      value.sections[0].slots[0].endTime = "10:45";
    },
    (value) => {
      value.sections[0].slots.reverse();
    },
    (value) => {
      value.sections[0].slots.pop();
    },
    (value) => {
      value.sections.push({ id: "added", title: "My empty section", slots: [] });
    },
    (value) => {
      value.responses.push({ id: "existing-response", slots: [] });
    },
  ]) {
    const edited = structuredClone(form);
    edit(edited);
    assert.equal(signupStarterNeedsConfirmation(edited), true);
    const appended = applySignupStarter(edited, "potluck", true);
    assert.deepEqual(appended.sections.slice(0, -1), edited.sections);
    assert.deepEqual(appended.responses, edited.responses);
    assert.deepEqual(appended.settings, edited.settings);
  }
});

test("new signup templates keep all 150 designs without introducing fictional event data", () => {
  const { createEmptySignupTemplateForm } = load("src/lib/signup-starters.ts", baseMocks);
  const { getPublicTemplates } = load("src/lib/public-template-catalog.ts", baseMocks);
  for (const template of getPublicTemplates("signup-forms")) {
    const form = createEmptySignupTemplateForm(template);
    assert.equal(form.appearance.designId, template.id);
    assert.equal(form.header.backgroundImage.dataUrl, template.heroImage);
    assert.equal(form.title, "");
    assert.equal(form.start, null);
    assert.equal(form.location, null);
    assert.equal(form.header.creatorName, "");
    assert.equal(form.locationMode, "tba");
    assert.deepEqual(form.sections, []);
    assert.deepEqual(form.questions, []);
    assert.deepEqual(form.responses, []);
  }
});

test("section placement, copying and persistence retain IDs, instructions and existing responses", () => {
  const { createEmptySignupTemplateForm } = load("src/lib/signup-starters.ts", baseMocks);
  const { placeSignupSection, copySignupSection, signupSectionHasResponses } = load(
    "src/lib/signup-composer.ts",
    baseMocks,
  );
  const { sanitizeSignupForm } = load("src/utils/signup.ts", baseMocks);
  const { validateSignupPublish } = load("src/lib/signup-validation.ts", baseMocks);
  let form = createEmptySignupTemplateForm();
  form.title = "School day";
  form = placeSignupSection(form, { kind: "block", id: "registration" });
  const registration = form.sections[0];
  form = placeSignupSection(form, { kind: "block", id: "info" }, registration.id);
  form.sections[0].description = "Meet at the front entrance.";
  const info = form.sections[0];
  form = placeSignupSection(form, { kind: "section", id: registration.id }, info.id);
  assert.equal(form.sections[0].id, registration.id);
  const saved = sanitizeSignupForm(JSON.parse(JSON.stringify(form)));
  assert.equal(saved.sections[1].description, "Meet at the front entrance.");
  assert.equal(saved.sections[1].kind, "info");
  assert.equal(saved.sections[1].slots.length, 0);
  assert.equal(validateSignupPublish(form).length, 0);
  const copy = copySignupSection(registration);
  assert.notEqual(copy.id, registration.id);
  assert.notEqual(copy.slots[0].id, registration.slots[0].id);
  form.responses = [
    {
      id: "response",
      status: "confirmed",
      slots: [{ sectionId: registration.id, slotId: registration.slots[0].id, quantity: 1 }],
    },
  ];
  assert.equal(signupSectionHasResponses(form, registration.id), true);
  assert.equal(signupSectionHasResponses(form, registration.id, registration.slots[0].id), true);
  assert.equal(signupSectionHasResponses(form, info.id), false);
  const moved = placeSignupSection(form, { kind: "section", id: registration.id });
  assert.deepEqual(moved.responses, form.responses);
  assert.equal(moved.sections.at(-1).id, registration.id);
  assert.deepEqual(moved.header, form.header);
  assert.deepEqual(moved.settings, form.settings);
  const projected = {
    ...form,
    responses: [],
    availability: [
      { sectionId: registration.id, slotId: registration.slots[0].id, confirmed: 1, waitlisted: 0 },
    ],
  };
  assert.equal(signupSectionHasResponses(projected, registration.id), true);
});

test("empty questions are surfaced before publish and text alone cannot publish a signup", () => {
  const { createEmptySignupTemplateForm } = load("src/lib/signup-starters.ts", baseMocks);
  const { placeSignupSection } = load("src/lib/signup-composer.ts", baseMocks);
  const { validateSignupPublish } = load("src/lib/signup-validation.ts", baseMocks);
  let form = createEmptySignupTemplateForm();
  form.title = "Title";
  form = placeSignupSection(form, { kind: "block", id: "info" });
  form.questions = [{ id: "q1", prompt: "", required: true }];
  const issues = validateSignupPublish(form);
  assert.ok(issues.some((issue) => issue.field === "signup-slots"));
  assert.ok(issues.some((issue) => issue.field === "signup-questions"));
});

test("optional form headings preserve hidden, custom and inherited wording through saving", () => {
  const { sanitizeSignupForm } = load("src/utils/signup.ts", baseMocks);
  const Viewer = load("src/components/smart-signup-form/SignupViewer.tsx", baseMocks).default;
  const form = createSignupThemeForm("harvest-table");
  const render = (value) =>
    renderToStaticMarkup(
      React.createElement(Viewer, { eventId: "preview", initialForm: value, viewerKind: "guest" }),
    );
  assert.match(render(sanitizeSignupForm(form)), /Sign-up board/);
  const hidden = sanitizeSignupForm({ ...form, boardTitle: "", boardDescription: "" });
  assert.equal(hidden.boardTitle, "");
  assert.equal(hidden.boardDescription, "");
  assert.doesNotMatch(render(hidden), /Sign-up board|Every contribution counts/);
  const custom = sanitizeSignupForm({
    ...form,
    boardTitle: "Garden helpers",
    boardDescription: "Choose your activity.",
  });
  assert.match(render(custom), /Garden helpers/);
  assert.match(render(custom), /Choose your activity\./);
});

const nodes = (node) =>
  !node
    ? []
    : Array.isArray(node)
      ? node.flatMap(nodes)
      : React.isValidElement(node)
        ? [node, ...nodes(node.props.children)]
        : [];
const nodeText = (node) =>
  !node
    ? ""
    : Array.isArray(node)
      ? node.map(nodeText).join("")
      : React.isValidElement(node)
        ? nodeText(node.props.children)
        : String(node);

test("section editor removes and restores content, protects signed-up slots and supports drop ordering", () => {
  const { placeSignupSection } = load("src/lib/signup-composer.ts", baseMocks);
  const { createEmptySignupTemplateForm } = load("src/lib/signup-starters.ts", baseMocks);
  let form = placeSignupSection(createEmptySignupTemplateForm(), {
    kind: "block",
    id: "registration",
  });
  form = placeSignupSection(form, { kind: "block", id: "info" });
  const hookState = [];
  let cursor = 0;
  const Editor = load("src/components/smart-signup-form/SignupContentEditor.tsx", {
    ...baseMocks,
    "@dnd-kit/core": {
      ...nativeRequire("@dnd-kit/core"),
      useSensors: (...sensors) => sensors,
      useSensor: (sensor) => sensor,
    },
    react: {
      ...React,
      useState(initial) {
        const i = cursor++;
        if (!(i in hookState)) hookState[i] = initial;
        return [
          hookState[i],
          (value) => {
            hookState[i] = value;
          },
        ];
      },
    },
  }).default;
  let drag = null;
  const render = () => {
    cursor = 0;
    return nodes(
      Editor({
        form,
        onChange: (next) => {
          form = next;
        },
        drag,
        onDrag: (value) => {
          drag = value;
        },
        onAdd() {},
      }),
    );
  };
  const original = structuredClone(form);
  render()
    .find((node) => node.type === "button" && nodeText(node) === "Remove")
    .props.onClick();
  assert.equal(form.sections.length, 1);
  render()
    .find((node) => node.type === "button" && nodeText(node) === "Undo")
    .props.onClick();
  assert.deepEqual(form.sections, original.sections);
  const registration = form.sections[0];
  form.responses = [{ slots: [{ sectionId: registration.id, slotId: registration.slots[0].id }] }];
  const remove = render().find((node) => node.type === "button" && nodeText(node) === "Remove");
  assert.equal(remove.props.disabled, true);
  remove.props.onClick();
  assert.equal(form.sections.length, 2);
  drag = { kind: "section", id: form.sections[1].id };
  render()
    .find((node) => node.props.sectionId === registration.id)
    .props.onDrop({ preventDefault() {}, stopPropagation() {} });
  assert.equal(form.sections[0].kind, "info");
  assert.equal(form.sections[1].id, registration.id);
  assert.equal(form.responses.length, 1);
  render()
    .find((node) => node.props.onDragEnd && node.props.sensors)
    .props.onDragEnd({ active: { id: registration.id }, over: { id: form.sections[0].id } });
  assert.equal(form.sections[0].id, registration.id);
  assert.equal(form.responses.length, 1);
});

test("header pencils update canonical details and are omitted from guest pages", () => {
  const Header = load(
    "src/components/smart-signup-form/SignupTemplateHeader.tsx",
    baseMocks,
  ).default;
  let form = createSignupThemeForm("harvest-table");
  const render = () =>
    nodes(
      Header({
        form,
        editing: {
          onChange: (next) => {
            form = next;
          },
          details: null,
          onDetails() {},
        },
      }),
    );
  render()
    .find((node) => node.props.label === "Event title")
    .props.onChange("Neighborhood feast");
  render()
    .find((node) => node.props.label === "Welcome message")
    .props.onChange("Join us outside.");
  render()
    .find((node) => node.props.label === "Organizer name")
    .props.onChange("Garden club");
  assert.equal(form.title, "Neighborhood feast");
  assert.equal(form.description, "Join us outside.");
  assert.equal(form.header.creatorName, "Garden club");
  const editable = renderToStaticMarkup(
    React.createElement(Header, {
      form,
      editing: { onChange() {}, details: null, onDetails() {} },
    }),
  );
  assert.match(editable, /Edit event title/);
  assert.match(editable, /Edit date and time/);
  const guest = renderToStaticMarkup(React.createElement(Header, { form }));
  assert.match(guest, /Neighborhood feast/);
  assert.doesNotMatch(guest, /<button|Edit event title|Arrival &amp; other details/);
});

test("cancelling inline date edits restores dates without reverting other edits", () => {
  const original = createSignupThemeForm("harvest-table");
  let form = { ...original, start: "2026-10-24T10:00", title: "Changed separately" };
  let closed = false;
  const Editor = load("src/components/smart-signup-form/SignupHeaderDetailsEditor.tsx", {
    ...baseMocks,
    react: {
      ...React,
      useState: () => [original],
      useEffect() {},
      useRef: () => ({ current: null }),
    },
  }).default;
  const tree = nodes(
    Editor({
      form,
      section: "schedule",
      onChange: (next) => {
        form = next;
      },
      onClose: () => {
        closed = true;
      },
    }),
  );
  tree.find((node) => node.type === "button" && nodeText(node) === "Cancel").props.onClick();
  assert.equal(form.start, original.start);
  assert.equal(form.title, "Changed separately");
  assert.equal(closed, true);
});

test("saved waitlisted signups expose working edit and cancel actions", async () => {
  const form = createSignupThemeForm("harvest-table");
  form.settings.maxQuantityPerSlot = 3;
  form.sections[0].slots[0].capacity = 2;
  const response = {
    id: "parent-signup",
    userId: "parent",
    name: "Test parent",
    email: "parent@example.test",
    guests: 0,
    status: "waitlisted",
    slots: [{ sectionId: form.sections[0].id, slotId: form.sections[0].slots[0].id, quantity: 3 }],
    answers: [],
    createdAt: "2026-09-18T12:00:00Z",
    updatedAt: "2026-09-18T12:00:00Z",
  };
  form.responses = [response];
  const state = [];
  let cursor = 0;
  const requests = [];
  const oldFetch = globalThis.fetch,
    oldFrame = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => 0;
  globalThis.fetch = async (_url, options) => {
    const payload = JSON.parse(options.body);
    requests.push(payload);
    const saved = {
      ...response,
      ...payload,
      id: response.id,
      status: payload.action === "cancel" ? "cancelled" : "confirmed",
    };
    return {
      ok: true,
      json: async () => ({ signupForm: { ...form, responses: [saved] }, response: saved }),
    };
  };
  try {
    const Viewer = load("src/components/smart-signup-form/SignupViewer.tsx", {
      ...baseMocks,
      react: {
        ...React,
        useState(initial) {
          const i = cursor++;
          if (!(i in state)) state[i] = typeof initial === "function" ? initial() : initial;
          return [
            state[i],
            (value) => {
              state[i] = typeof value === "function" ? value(state[i]) : value;
            },
          ];
        },
        useEffect() {},
        useMemo: (fn) => fn(),
        useRef: (value) => ({ current: value }),
      },
    }).default;
    const render = () => {
      cursor = 0;
      return nodes(
        Viewer({
          eventId: "field-day",
          initialForm: form,
          viewerKind: "guest",
          viewerId: "parent",
        }),
      );
    };
    const button = (text) =>
      render().find((node) => node.type === "button" && nodeText(node) === text);
    assert.ok(button("Cancel my signup"));
    button("Edit my signup").props.onClick();
    await render()
      .find((node) => node.type === "form")
      .props.onSubmit({ preventDefault() {} });
    assert.equal(requests.length, 0, "invalid edits must not send a reservation");
    const quantity = render().find(
      (node) => node.type === "input" && node.props["aria-label"]?.startsWith("Quantity for"),
    );
    assert.equal(quantity.props["aria-invalid"], true);
    quantity.props.onChange({ target: { value: "1" } });
    await render()
      .find((node) => node.type === "form")
      .props.onSubmit({ preventDefault() {} });
    assert.equal(requests[0].signupId, "parent-signup");
    assert.equal(requests[0].slots[0].quantity, 1);
    assert.equal(requests[0].name, "Test parent");
    await button("Cancel my signup").props.onClick();
    assert.deepEqual(requests[1], { action: "cancel", signupId: "parent-signup" });
  } finally {
    globalThis.fetch = oldFetch;
    globalThis.requestAnimationFrame = oldFrame;
  }
});

test("interactive preview submits locally and never calls a reservation API", async () => {
  const hookState = [];
  let cursor = 0;
  let calls = 0;
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    calls++;
    throw new Error("Preview must not send requests");
  };
  try {
    const Viewer = load("src/components/smart-signup-form/SignupViewer.tsx", {
      ...baseMocks,
      react: {
        ...React,
        useState(initial) {
          const i = cursor++;
          if (!(i in hookState)) hookState[i] = typeof initial === "function" ? initial() : initial;
          return [
            hookState[i],
            (value) => {
              hookState[i] = typeof value === "function" ? value(hookState[i]) : value;
            },
          ];
        },
        useEffect() {},
        useMemo: (fn) => fn(),
        useRef: (value) => ({ current: value }),
      },
    }).default;
    const form = createSignupThemeForm("harvest-table");
    const render = () => {
      cursor = 0;
      return nodes(
        Viewer({
          eventId: "preview",
          initialForm: form,
          viewerKind: "guest",
          interactivePreview: true,
        }),
      );
    };
    render()
      .find((node) => node.type === "button" && nodeText(node) === "Select")
      .props.onClick();
    render()
      .find((node) => node.type === "input" && node.props["aria-label"] === "Your name")
      .props.onChange({ target: { value: "Preview guest" } });
    render()
      .find((node) => node.type === "input" && node.props["aria-label"] === "Email address")
      .props.onChange({ target: { value: "preview@example.test" } });
    await render()
      .find((node) => node.type === "form")
      .props.onSubmit({ preventDefault() {} });
    assert.equal(calls, 0);
    assert.ok(
      hookState.includes(
        "Test signup complete. Your selections would be confirmed. Nothing was submitted and no places were reserved.",
      ),
    );
    assert.deepEqual(form.responses, []);
  } finally {
    globalThis.fetch = nativeFetch;
  }
});

function themeDialogHarness(form, callbacks = {}) {
  const state = [];
  let cursor = 0;
  const hooks = {
    ...React,
    useId: () => "theme-test",
    useMemo: (fn) => fn(),
    useEffect: () => {},
    useState(initial) {
      const i = cursor++;
      if (!(i in state)) state[i] = typeof initial === "function" ? initial() : initial;
      return [
        state[i],
        (value) => {
          state[i] = typeof value === "function" ? value(state[i]) : value;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in state)) state[i] = { current: initial };
      return state[i];
    },
  };
  const Dialog = load("src/components/smart-signup-form/SignupCustomThemeDialog.tsx", {
    ...baseMocks,
    react: hooks,
  }).default;
  const render = () => {
    cursor = 0;
    return nodes(Dialog({ form, onUseTheme() {}, onClose() {}, ...callbacks }));
  };
  const button = (text) =>
    render().find((node) => node.type === "button" && nodeText(node).includes(text));
  return {
    render,
    button,
    describe(text) {
      render()
        .find((node) => node.type === "textarea")
        .props.onChange({ target: { value: text } });
    },
  };
}

const dialogRecipe = {
  version: 1,
  name: "Woodland",
  description: "Soft woodland colors",
  composition: "botanical",
  board: "outline",
  motif: "sprig",
  reverse: false,
  fontPair: "friendly",
  colors: {
    page: "#F3F2EE",
    surface: "#FFFFFF",
    soft: "#E8ECF2",
    ink: "#222D40",
    accent: "#354B72",
    secondary: "#91A889",
  },
};

test("theme dialog isolates generated options, supports refinement and only accepts on Use this theme", async (t) => {
  const form = createSignupThemeForm("harvest-table");
  const original = structuredClone(form);
  const accepted = [];
  let closed = 0;
  const requests = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return Response.json({
      theme: { ...dialogRecipe, name: requests.length === 1 ? "Woodland" : "Refined woodland" },
      details: { title: "Must not replace the existing event" },
    });
  });
  const dialog = themeDialogHarness(form, {
    onUseTheme: (value) => accepted.push(value),
    onClose: () => closed++,
  });
  assert.equal(dialog.button("Use this theme"), undefined);
  dialog.describe("Woodland with sage green");
  await dialog.button("Create with Envitefy").props.onClick();
  assert.deepEqual(form, original);
  assert.equal(accepted.length, 0);
  assert.equal(requests[0].generateArtwork, false);
  assert.equal(requests[0].includeContent, false);
  assert.ok(
    dialog.render().some((node) => node.props.form?.appearance?.customTheme?.name === "Woodland"),
  );
  dialog.button("Describe a change").props.onClick();
  dialog.describe("Make the colors cooler");
  await dialog.button("Update theme").props.onClick();
  assert.equal(requests[1].currentTheme.name, "Woodland");
  assert.deepEqual(form, original);
  dialog.button("Previous design").props.onClick();
  dialog.button("Use this theme").props.onClick();
  assert.equal(accepted.length, 1);
  assert.equal(accepted[0].appearance.customTheme.name, "Woodland");
  assert.equal(accepted[0].title, undefined);
  assert.equal(accepted[0].details, undefined);
  dialog
    .render()
    .find((node) => node.props["aria-label"] === "Close custom theme dialog")
    .props.onClick();
  assert.equal(closed, 1);
  assert.deepEqual(form, original);
});

test("cancel aborts generation and a late response cannot apply a theme", async (t) => {
  const form = createSignupThemeForm("harvest-table");
  let respond;
  let signal;
  let accepted = false;
  t.mock.method(globalThis, "fetch", (_url, options) => {
    signal = options.signal;
    return new Promise((resolve) => {
      respond = resolve;
    });
  });
  const dialog = themeDialogHarness(form, {
    onUseTheme: () => {
      accepted = true;
    },
  });
  dialog.describe("Quiet woodland");
  const generation = dialog.button("Create with Envitefy").props.onClick();
  assert.ok(dialog.button("Cancel generation"));
  dialog.button("Cancel generation").props.onClick();
  assert.equal(signal.aborted, true);
  respond(Response.json({ theme: dialogRecipe }));
  await generation;
  assert.equal(accepted, false);
  assert.equal(dialog.button("Use this theme"), undefined);
});

test("new theme previews use display placeholders without putting demo content into the accepted form", async (t) => {
  const { createEmptySignupTemplateForm } = load("src/lib/signup-starters.ts", baseMocks);
  const form = createEmptySignupTemplateForm();
  let accepted;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(JSON.parse(options.body).generateArtwork, true);
    return Response.json({
      theme: dialogRecipe,
      artwork: { dataUrl: "data:image/webp;base64,AAAA" },
    });
  });
  const dialog = themeDialogHarness(form, {
    isNew: true,
    onUseTheme: (value) => {
      accepted = value;
    },
  });
  dialog.describe("Woodland volunteer signup");
  await dialog.button("Create with Envitefy").props.onClick();
  const page = dialog.render().find((node) => node.props.form?.appearance?.customTheme);
  assert.equal(page.props.form.title, "Your event title");
  dialog.button("Use this theme").props.onClick();
  const { restoreSignupTheme } = load("src/lib/signup-custom-theme.ts", baseMocks);
  const next = restoreSignupTheme(form, accepted);
  assert.equal(next.title, "");
  assert.deepEqual(next.sections, []);
  assert.deepEqual(next.responses, []);
  assert.equal(next.start, null);
});

test("new signup briefs survive preview, refinement, undo and acceptance without fabricated content", async (t) => {
  const { createEmptySignupTemplateForm } = load("src/lib/signup-starters.ts", baseMocks);
  const { applySignupThemeDetails } = load("src/lib/signup-theme-brief.ts", baseMocks);
  const { restoreSignupTheme } = load("src/lib/signup-custom-theme.ts", baseMocks);
  const form = createEmptySignupTemplateForm();
  const original = structuredClone(form);
  const details = {
    title: "See you at the Pole - Breakfast",
    description: "Bring donuts or muffins. We are a tree nut / peanut free school.",
    organizerName: "Kayra Ayala",
    start: "2026-09-23T07:00",
    timezone: "America/Chicago",
    venue: "Upper School Campus",
    location: "10745 US Hwy 98 W., Miramar Beach, FL 32550",
    sections: [
      {
        title: "Breakfast",
        description: null,
        purpose: "items",
        slots: [
          { label: "Donuts", capacity: null, notes: "Tree nut / peanut free" },
          { label: "Muffins", capacity: null, notes: "Tree nut / peanut free" },
        ],
      },
    ],
  };
  const requests = [];
  let accepted;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return Response.json({
      theme: { ...dialogRecipe, name: requests.length === 1 ? "Original" : "Refined" },
      details: requests.length === 1 ? details : { title: "Breakfast at the Pole" },
      ...(requests.length === 1
        ? {
            artwork: { dataUrl: "data:image/webp;base64,AAAA", width: 325, height: 217 },
            artworkSource: "reference",
          }
        : {}),
    });
  });
  const dialog = themeDialogHarness(form, {
    isNew: true,
    onUseTheme: (value) => {
      accepted = value;
    },
  });
  dialog.describe(details.description);
  await dialog.button("Create with Envitefy").props.onClick();
  let preview = dialog.render().find((node) => node.props.form?.appearance?.customTheme).props.form;
  assert.equal(preview.title, details.title);
  assert.equal(preview.header.creatorName, details.organizerName);
  assert.equal(preview.sections[0].slots.length, 2);
  assert.equal(preview.appearance.imageFilterEnabled, false);
  assert.equal(preview.appearance.imageFit, "contain");
  assert.equal(requests[0].includeContent, true);
  assert.deepEqual(form, original);
  dialog.button("Describe a change").props.onClick();
  dialog.describe("Make the heading more classic");
  await dialog.button("Update theme").props.onClick();
  assert.deepEqual(requests[1].currentDetails, details);
  assert.equal(requests[1].generateArtwork, false);
  preview = dialog.render().find((node) => node.props.form?.appearance?.customTheme).props.form;
  assert.equal(preview.title, "Breakfast at the Pole");
  assert.equal(preview.start, details.start);
  assert.equal(preview.sections[0].slots[0].capacity, null);
  assert.equal(preview.appearance.imageFit, "contain");
  dialog.button("Previous design").props.onClick();
  dialog.button("Use this theme").props.onClick();
  const result = applySignupThemeDetails(restoreSignupTheme(form, accepted), accepted.details);
  assert.equal(result.title, details.title);
  assert.equal(result.description, details.description);
  assert.equal(result.location, details.location);
  assert.equal(result.header.creatorName, "Kayra Ayala");
  assert.deepEqual(
    result.sections[0].slots.map((slot) => slot.label),
    ["Donuts", "Muffins"],
  );
  assert.deepEqual(result.responses, []);
  assert.equal(result.end, null);
  assert.deepEqual(form, original);
});

function themeEditorHarness(preview, options = {}) {
  const state = [];
  const effects = [];
  let cursor = 0;
  let progress;
  let consumed = 0;
  let reads = 0;
  const writes = [];
  const redirects = [];
  const search = new URLSearchParams(options.search || "themePreview=generated-token");
  const hooks = {
    ...React,
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn,
    useState(initial) {
      const i = cursor++;
      if (!(i in state)) state[i] = typeof initial === "function" ? initial() : initial;
      return [
        state[i],
        (value) => {
          state[i] = typeof value === "function" ? value(state[i]) : value;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in state)) state[i] = { current: initial };
      return state[i];
    },
    useEffect(effect) {
      const i = cursor++;
      if (!(i in state)) {
        state[i] = { effectIndex: effects.length };
        effects.push(effect);
      }
      effects[state[i].effectIndex] = effect;
    },
  };
  const storage = load("src/lib/template-draft-storage.ts", baseMocks);
  const Provider = load("src/components/templates/TemplateEditorContext.tsx", {
    ...baseMocks,
    react: hooks,
    "@/lib/privacy-preferences": { hasAnalyticsConsent: () => false },
    "next/navigation": {
      useRouter: () => ({ replace: (href) => redirects.push(href) }),
      useSearchParams: () => search,
    },
    "@/lib/signup-theme-handoff": {
      takeSignupTheme: () => {
        consumed++;
        return consumed === 1 ? preview : null;
      },
    },
    "@/lib/template-draft-storage": {
      ...storage,
      readTemplateDraft: async () => {
        reads++;
        return options.saved || null;
      },
      retainDraftMedia: async () => {},
      writeTemplateDraft: async (draft) => writes.push(structuredClone(draft)),
    },
    "@/lib/template-draft-handoff": {
      saveTemplateDraftToAccount: async ({ draft }) => {
        draft.eventId = "saved-event";
        return draft.eventId;
      },
    },
    "@/components/UnsavedProgressProvider": {
      useUnsavedProgress: (value) => {
        progress = value;
        return { allowNavigation: (fn) => fn() };
      },
    },
  }).default;
  const render = () => {
    cursor = 0;
    return Provider({
      category: "signup-forms",
      templateId: "editorial--clean-clear",
      children: null,
    }).props.value;
  };
  return {
    render,
    effects,
    search,
    writes,
    redirects,
    progress: () => progress,
    reads: () => reads,
    consumed: () => consumed,
  };
}

test("theme handoff bypasses unrelated browser drafts, survives Strict Mode and remains dirty until saved", async (t) => {
  const { createEmptySignupTemplateForm } = load("src/lib/signup-starters.ts", baseMocks);
  const form = createEmptySignupTemplateForm();
  const { applySignupCustomTheme } = load("src/lib/signup-custom-theme.ts", baseMocks);
  const preview = applySignupCustomTheme(form, dialogRecipe);
  const harness = themeEditorHarness(preview);
  harness.render();
  // Strict Mode runs setup, cleanup, setup before asynchronous initialization finishes.
  const cleanup = harness.effects[0]();
  cleanup();
  harness.effects[0]();
  await new Promise((resolve) => setImmediate(resolve));
  const runtime = harness.render();
  assert.equal(harness.consumed(), 1);
  assert.equal(harness.reads(), 0);
  assert.equal(harness.writes.length, 0);
  assert.deepEqual(runtime.initial.form, JSON.parse(JSON.stringify(preview)));
  assert.equal(harness.progress().dirty, true);
  runtime.record("form", runtime.initial.form);
  harness.render();
  assert.equal(harness.progress().dirty, true);
  const previousWindow = globalThis.window;
  const urls = [];
  globalThis.window = {
    dispatchEvent() {},
    history: { replaceState: (_state, _title, href) => urls.push(href) },
  };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });
  await runtime.persist({ title: "" }, "draft");
  harness.render();
  assert.equal(harness.progress().dirty, false);
  assert.equal(harness.writes.length, 1);
  assert.deepEqual(harness.writes[0].snapshot.form.appearance.customTheme, dialogRecipe);
  assert.deepEqual(urls, [
    "/signup-forms/templates/editorial--clean-clear/customize?edit=saved-event",
  ]);
  runtime.record("form", { ...runtime.initial.form, title: "Edited just after saving" });
  harness.search.delete("themePreview");
  harness.search.set("edit", "saved-event");
  harness.render();
  harness.effects[0]();
  await new Promise((resolve) => setImmediate(resolve));
  harness.render();
  assert.equal(harness.reads(), 0);
  assert.equal(harness.progress().dirty, true, "replacing the URL must not mark later edits saved");
});

test("a missing theme preview returns to the dialog without reopening or overwriting browser drafts", async () => {
  const harness = themeEditorHarness(null);
  harness.render();
  harness.effects[0]();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(harness.reads(), 0);
  assert.equal(harness.writes.length, 0);
  assert.deepEqual(harness.redirects, ["/signup-forms/templates?customTheme=1&themeExpired=1"]);
});
