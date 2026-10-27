import { createRoot } from "react-dom/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import UnifiedCreatePageClient from "../../src/app/create/UnifiedCreatePageClient";
import Birthdays from "../../src/app/event/birthdays/customize/page";
import GeneralEvents from "../../src/app/event/general/customize/page";
import TemplateEditorProvider from "../../src/components/templates/TemplateEditorContext";
import UnsavedProgressProvider from "../../src/components/UnsavedProgressProvider";
import { usePathname } from "./signup-editor/navigation";
import { getCreationTemplates } from "../../src/lib/create/template-selection";
import { HOLIDAY_COLLECTIONS } from "../../src/lib/holiday-collections";
import { createCreationIntake, writeCreationIntake, readCreationIntake, listCreationIntakes, clearCreationIntakes } from "../../src/lib/create/creation-intake";
import { readTemplateDraft } from "../../src/lib/template-draft-storage";
import EventsWorkspaceClient from "../../src/app/events/EventsWorkspaceClient";
import EventCustomThemeLauncher from "../../src/components/events/EventCustomThemeLauncher";
import EventCustomEditor from "../../src/components/events/custom/EventCustomEditor";
import CreationIntakeCleanup from "../../src/components/events/CreationIntakeCleanup";
import ThemeProvider from "../../src/components/AppearanceProvider";
import { SidebarProvider } from "../../src/app/sidebar-context";
import { MainContentWrapper } from "../../src/components/MainContentWrapper";
import MobileNavHeader from "../../src/components/navigation/MobileNavHeader";
import { List } from "lucide-react";
import Link from "./unified-create-link";
import { fixtureOwner, setFixtureOwner } from "./unified-create-auth";
import { setFixtureMenuPreferences } from "./unified-create-menu";
import PublicTemplateGallery from "../../src/components/templates/PublicTemplateGallery";

const navigate = (url: string, replace = false) => { history[replace ? "replaceState" : "pushState"](null, "", url); window.dispatchEvent(new PopStateEvent("popstate", { state: history.state })); };
const router = { push: (url: string) => navigate(url), replace: (url: string) => navigate(url, true), back: () => history.back(), forward: () => history.forward(), refresh() {}, prefetch: async () => {} };
const fetchWithAbort = window.fetch.bind(window);
window.fetch = (input, options) => {
  if (!String(input).startsWith("/api/history")) return fetchWithAbort(input, options);
  const headers = new Headers(options?.headers); headers.set("x-fixture-owner", fixtureOwner());
  return fetchWithAbort(input, { ...options, headers, ...((window as any).__ignoreHistoryAbort ? { signal: undefined } : {}) });
};
const openDatabase = indexedDB.open.bind(indexedDB);
indexedDB.open = (name: string, version?: number) => {
  const request = version === undefined ? openDatabase(name) : openDatabase(name, version);
  const delay = Number((window as any).__idbOpenDelayMs || 0);
  if (!delay) return request;
  (window as any).__idbDelayedOpenCount = ((window as any).__idbDelayedOpenCount || 0) + 1;
  return new Proxy(request, {
    get(target, key) { const value = Reflect.get(target, key, target); return typeof value === "function" ? value.bind(target) : value; },
    set(target, key, value) { return Reflect.set(target, key, key === "onsuccess" && typeof value === "function" ? (event: Event) => setTimeout(() => value.call(target, event), delay) : value, target); },
  });
};
(window as any).__creationBrowser = { getCreationTemplates, holidayCollections: HOLIDAY_COLLECTIONS, createCreationIntake, writeCreationIntake, readCreationIntake, listCreationIntakes, clearCreationIntakes, readTemplateDraft, setFixtureOwner, setFixtureMenuPreferences, navigate };
function App() {
  const pathname = usePathname();
  const match = pathname.match(/^\/birthdays\/templates\/([^/]+)\/customize$/);
  const initialCreationAccess = JSON.parse(sessionStorage.getItem("fixture-initial-creation-access") || "null") || undefined;
  const content = pathname === "/create" ? <UnifiedCreatePageClient initialCreationAccess={initialCreationAccess} /> : pathname === "/signup-forms/templates" ? <div data-native-signup-gallery><PublicTemplateGallery category="signup-forms" /></div> : pathname === "/gallery" ? <EventCustomThemeLauncher category="birthdays" /> : pathname === "/event/design/customize" && new URLSearchParams(location.search).has("intake") ? <div data-custom-editor><EventCustomEditor /></div> : pathname === "/event/general/customize" ? <div data-native-general><GeneralEvents /></div> : pathname === "/events" ? <EventsWorkspaceClient /> : match ? <div data-native-birthday><TemplateEditorProvider category="birthdays" templateId={decodeURIComponent(match[1])}><Birthdays /></TemplateEditorProvider></div> : pathname === "/chrome-origin" ? <main data-fixture-navigation-origin style={{ minHeight: "180dvh", paddingTop: 180 }}><h1>Navigation starting page</h1><Link href="/create?chrome=1">Create an event page</Link></main> : <main data-destination>{pathname}<a href="/create">Create another event</a></main>;
  const chrome = new URLSearchParams(location.search).get("chrome") === "1";
  return <UnsavedProgressProvider>{chrome ? <><MobileNavHeader visible onOpenNavigation={() => {}} onHome={event => { event.preventDefault(); navigate("/chrome-origin?chrome=1"); }} menuIcon={<List size={18} aria-hidden="true" />} /><MainContentWrapper isAuthenticated><div className="min-h-0 flex-1 min-w-0">{content}</div></MainContentWrapper></> : content}</UnsavedProgressProvider>;
}
createRoot(document.getElementById("root")!).render(<ThemeProvider><SidebarProvider><AppRouterContext.Provider value={router}><CreationIntakeCleanup /><App /></AppRouterContext.Provider></SidebarProvider></ThemeProvider>);
