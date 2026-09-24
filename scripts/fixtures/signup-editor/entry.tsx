import React from "react";
import { createRoot } from "react-dom/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import UnsavedProgressProvider from "../../../src/components/UnsavedProgressProvider";
import TemplateEditorProvider from "../../../src/components/templates/TemplateEditorContext";
import SignupTemplatesPage from "../../../src/app/templates/signup/page";
import { createSignupThemeForm } from "../../../src/lib/signup-starters";
import { usePathname } from "./navigation";

const form = { ...createSignupThemeForm("school-days"), title: "Maple Grove Parent Conferences", start: "2026-10-22T15:00", end: "2026-10-22T16:00", timezone: "America/Chicago", locationMode: "tba", enabled: false, revision: 3,
  sections: [{ id: "day", title: "Thursday parent conferences", slots: [{ id: "conference", label: "3:00 PM conference", capacity: 1, startTime: "15:00", endTime: "15:15" }] }],
  responses: [],
};
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  if (String(input) === "/api/history/saved-form" && !init?.method) return new Response(JSON.stringify({ id: "saved-form", data: { status: "published", signupForm: form, templateEditor: { category: "signup-forms", templateId: "editorial--school-days", snapshot: { form } } } }), { status: 200 });
  return originalFetch(input, init);
};
const changeRoute = (url: string, replace = false) => {
  window.history[replace ? "replaceState" : "pushState"](null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
};
const router = { push: (url: string) => changeRoute(url), replace: (url: string) => changeRoute(url, true), back: () => history.back(), forward: () => history.forward(), refresh() {}, prefetch: async () => {} };
function App() {
  const pathname = usePathname();
  if (!pathname.includes("customize")) return <div className="p-8">Previous page: {pathname}</div>;
  return <UnsavedProgressProvider><TemplateEditorProvider category="signup-forms" templateId="editorial--school-days"><SignupTemplatesPage /></TemplateEditorProvider></UnsavedProgressProvider>;
}
createRoot(document.getElementById("root")!).render(<AppRouterContext.Provider value={router}><App /></AppRouterContext.Provider>);
