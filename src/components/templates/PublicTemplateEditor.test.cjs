const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../../scripts/lib/event-messages-test-loader.cjs");

const nativeEditors = {
  weddings: "@/app/event/weddings/customize/page",
  birthdays: "@/app/event/birthdays/customize/page",
  anniversaries: "@/app/event/birthdays/customize/page",
  "baby-showers": "@/app/event/baby-showers/customize/page",
  "bridal-showers": "@/app/event/baby-showers/customize/page",
  "gender-reveal": "@/app/event/gender-reveal/customize/page",
  gymnastics: "@/app/event/gymnastics/customize/page",
  "sport-events": "@/app/event/sport-events/customize/page",
  "signup-forms": "@/app/templates/signup/page",
};

function loadEditor() {
  let query = new URLSearchParams();
  function CreationAccessBoundary() {}
  function TemplateEditorProvider() {}
  const modules = Object.fromEntries([...new Set(Object.values(nativeEditors))].map((name) => {
    function NativeInternalEditor() {}
    return [name, { __esModule: true, default: NativeInternalEditor }];
  }));
  const { default: PublicTemplateEditor } = loadTs("src/components/templates/PublicTemplateEditor.tsx", {
    ...modules,
    "next/dynamic": {
      __esModule: true,
      default: (loader) => {
        function SharedNativeEditor() {}
        SharedNativeEditor.load = loader;
        return SharedNativeEditor;
      },
    },
    "next/navigation": { useSearchParams: () => query },
    "next-auth/react": { useSession: () => { throw new Error("Editor selection must not depend on authentication."); } },
    "./TemplateEditorContext": { __esModule: true, default: TemplateEditorProvider },
    "@/components/event-create/CreationAccessBoundary": { __esModule: true, default: CreationAccessBoundary },
  });
  return { PublicTemplateEditor, CreationAccessBoundary, TemplateEditorProvider, modules,
    setQuery: (value) => { query = new URLSearchParams(value); } };
}

test("every public template loads the exact native internal editor with only access and draft wrappers", async () => {
  const fixture = loadEditor();
  for (const [category, modulePath] of Object.entries(nativeEditors)) {
    const templateId = category === "sport-events" ? "soccer--stadium" : "selected-design";
    const boundary = fixture.PublicTemplateEditor({ category, templateId });
    assert.equal(boundary.type, fixture.CreationAccessBoundary, category);
    assert.equal(boundary.props.product, category === "signup-forms" ? "signup_form" : "event_page", category);
    const provider = boundary.props.children;
    assert.equal(provider.type, fixture.TemplateEditorProvider, `${category} retains the shared save/auth lifecycle`);
    assert.equal(provider.props.category, category);
    assert.equal(provider.props.templateId, templateId);
    const editor = provider.props.children;
    assert.equal(typeof editor.type.load, "function", `${category} renders the native editor directly`);
    assert.deepEqual(Object.keys(editor.props), [], `${category} does not inject a separate guest canvas or toolset`);
    const imported = await editor.type.load();
    assert.equal(imported.default, fixture.modules[modulePath].default, `${category} must reuse ${modulePath}`);
  }
});

test("saved and fresh public templates keep the same editor while access checks retain the saved identity", async () => {
  const fixture = loadEditor();
  for (const category of Object.keys(nativeEditors)) {
    const templateId = category === "sport-events" ? "soccer--stadium" : "selected-design";
    fixture.setQuery("");
    const fresh = fixture.PublicTemplateEditor({ category, templateId });
    fixture.setQuery("edit=existing-event");
    const saved = fixture.PublicTemplateEditor({ category, templateId });
    assert.equal(saved.props.eventId, "existing-event", `${category} still checks saved editing access`);
    assert.equal(saved.props.children.type, fresh.props.children.type);
    assert.equal(saved.props.children.props.children.type, fresh.props.children.props.children.type,
      `${category} keeps the internal editor for both creation and saved editing`);
  }
});
