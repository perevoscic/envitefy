import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import AppearanceProvider from "../../src/components/AppearanceProvider";
import AppearanceSelector from "../../src/components/AppearanceSelector";
import UnsavedProgressProvider from "../../src/components/UnsavedProgressProvider";
import InlineEditableText from "../../src/components/events/InlineEditableText";
import TemplateEditorProvider from "../../src/components/templates/TemplateEditorContext";
import SignupPageRenderer from "../../src/components/smart-signup-form/SignupPageRenderer";
import SignupViewer from "../../src/components/smart-signup-form/SignupViewer";
import SignupContentEditor from "../../src/components/smart-signup-form/SignupContentEditor";
import SignupTemplatesPage from "../../src/app/templates/signup/page";
import { getTemplates } from "../../src/lib/public-template-catalogs/signup-forms";
import { createSignupTemplateForm } from "../../src/lib/signup-starters";
import { resolveSignupThemeStyle } from "../../src/lib/signup-themes";
import type { SignupForm } from "../../src/types/signup";
import { usePathname } from "./signup-editor/navigation";

const storageKey = "template-appearance:saved";
const template = getTemplates().find((item) => item.id === "editorial--school-days")!;
const initialForm = createSignupTemplateForm(template);
const initialRow = {
  id: "saved-form", title: initialForm.title, revision: "original-revision",
  permissions: { canManageCollaborators: true },
  data: {
    status: "draft", signupForm: initialForm,
    templateEditor: { category: "signup-forms", templateId: template.id, snapshot: { form: initialForm } },
  },
};
const readSaved = () => JSON.parse(localStorage.getItem(storageKey) || "null") || initialRow;
const originalFetch = window.fetch.bind(window);
(window as any).__templateWrites = [];
window.fetch = async (input, init) => {
  const url = String(input);
  if (/^\/api\/history(?:\/saved-form)?$/.test(url)) {
    if (!init?.method || init.method === "GET") return new Response(JSON.stringify(readSaved()), { status: 200 });
    const payload = JSON.parse(String(init.body));
    const row = { ...readSaved(), ...payload, id: "saved-form", revision: `revision-${Date.now()}` };
    localStorage.setItem(storageKey, JSON.stringify(row));
    (window as any).__templateWrites.push({ method: init.method, payload });
    return new Response(JSON.stringify(row), { status: 200 });
  }
  return originalFetch(input, init);
};
const navigate = (url: string, replace = false) => {
  history[replace ? "replaceState" : "pushState"](null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
};
const router = { push: (url: string) => navigate(url), replace: (url: string) => navigate(url, true), back: () => history.back(), forward: () => history.forward(), refresh() {}, prefetch: async () => {} };

function InlineFixture() {
  const [value, setValue] = useState<string | undefined>("A lovely day together");
  return <div data-app-surface="true" data-testid="outer-app-surface" style={{ padding: 20 }}>
    <section data-appearance-scope="authored" data-testid="inline-template" style={{ background: "#dfe6f1", color: "#243f70", padding: 24 }}>
      <h2><InlineEditableText label="Template message" value={value} fallback="Welcome" onChange={setValue} /></h2>
      <div data-app-dialog="true" role="dialog" aria-label="Nested application controls" className="bg-white text-gray-900" style={{ padding: 16 }}>
        <label htmlFor="nested-app-input">Application field</label>
        <input id="nested-app-input" defaultValue="Readable application input" />
        <section data-appearance-scope="authored" data-testid="inner-authored-template" style={{ background: "#f8f2e8", color: "#332b25", padding: 16, marginTop: 16 }}>
          <label id="deep-authored-label" htmlFor="deep-authored-input" className="text-gray-900">Authored field inside application dialog</label>
          <input id="deep-authored-input" type="text" defaultValue="Original authored text" placeholder="Original authored placeholder" className="bg-white text-gray-900 border-gray-300" />
        </section>
      </div>
    </section>
  </div>;
}

const catalogTemplates = getTemplates();
const catalog = catalogTemplates.flatMap((item) => (["original", "soft", "ink"] as const).map((palette) => {
  const form = createSignupTemplateForm(item);
  return { template: item, palette, form: { ...form, appearance: { ...form.appearance!, palette } } };
}));
const paletteKeys = ["--signup-page", "--signup-surface", "--signup-text", "--signup-muted", "--signup-border", "--signup-accent", "--signup-accent-text", "--signup-soft"];
const representatives = [...new Map(catalog.map((entry) => {
  const style = resolveSignupThemeStyle(entry.form) as Record<string, string>;
  return [paletteKeys.map((key) => style[key]).join("|"), entry];
})).values()];

function CustomDarkSignup() {
  const [form, setForm] = useState<SignupForm>(() => ({
    ...initialForm,
    appearance: { ...initialForm.appearance!, customTheme: {
      version: 1 as const, name: "Midnight gathering", description: "Authored dark paper",
      composition: "studio" as const, board: "ledger" as const, motif: "star" as const, fontPair: "editorial" as const, reverse: false,
      colors: { page: "#17242c", surface: "#20353e", soft: "#29424b", ink: "#f8f2e8", accent: "#354b72", secondary: "#283e47" },
    } },
  }));
  return <SignupPageRenderer form={form} editing={{ onChange: setForm, details: null, onDetails: () => {} }}>
    <SignupContentEditor form={form} onChange={setForm} drag={null} onDrag={() => {}} onAdd={() => {}} />
  </SignupPageRenderer>;
}

function App() {
  const pathname = usePathname();
  const mode = new URLSearchParams(location.search).get("fixture");
  return <AppearanceProvider>
    <div style={{ padding: 16 }}><AppearanceSelector /></div>
    {mode === "inline" ? <InlineFixture /> : mode === "custom" ? <CustomDarkSignup /> : mode === "catalog" ? <>
      <output data-testid="catalog-count">{catalogTemplates.length}:{representatives.length}:{catalog.length}</output>
      {representatives.map(({ template: item, palette, form }) => <div key={`${item.id}:${palette}`} data-template-case={`${item.id}:${palette}`}>
        <SignupPageRenderer form={form}><div data-testid="catalog-copy"><SignupViewer eventId="preview" initialForm={form} viewerKind="readonly" /></div>
          <div data-palette-soft style={{ background: "var(--signup-soft)", color: "var(--signup-muted)", padding: 16 }}>Additional slot notes</div>
          <div data-palette-accent style={{ background: "var(--signup-surface)", color: "var(--signup-accent-text)", padding: 16 }}>Useful signup information</div>
        </SignupPageRenderer>
      </div>)}
    </> : mode === "viewer" ? <SignupPageRenderer form={readSaved().data.signupForm} /> : pathname.includes("customize") ?
      <div data-app-surface="true"><UnsavedProgressProvider><TemplateEditorProvider category="signup-forms" templateId="editorial--school-days"><SignupTemplatesPage /></TemplateEditorProvider></UnsavedProgressProvider></div>
      : <div data-destination>{pathname}</div>}
  </AppearanceProvider>;
}
createRoot(document.getElementById("root")!).render(<AppRouterContext.Provider value={router}><App /></AppRouterContext.Provider>);
