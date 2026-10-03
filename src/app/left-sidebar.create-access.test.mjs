import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("left sidebar renders personalized create navigation for signed-in accounts", () => {
  const source = readSource("src/app/left-sidebar.controller.ts");

  assert.match(
    source,
    /const canRenderCreateEventNavigation = status === "authenticated";/,
  );
  assert.match(
    source,
    /const createMenuItems = useMemo\(\s*\(\) =>\s*canRenderCreateEventNavigation\s*\? getCreateEventSections/s,
  );
  assert.match(
    source,
    /const hasCreateEventAccess = useMemo\(\s*\(\) =>\s*canRenderCreateEventNavigation &&\s*createMenuOptionCount > 0,\s*\[canRenderCreateEventNavigation, createMenuOptionCount\],?\s*\)/s,
  );
  assert.match(source, /featureVisibility\.hasLoadedPreferences\s*\? featureVisibility\.visibleTemplateKeys : EMPTY_TEMPLATE_KEYS/);
  const openCreate = source.slice(source.indexOf("const openCreateEventPage ="), source.indexOf("const openMyEventsPage ="));
  assert.match(openCreate, /setSidebarPage\("createEvent"\)/);
  assert.doesNotMatch(openCreate, /router\.push/);
});

test("left sidebar controller resets create panel state when create access disappears", () => {
  const source = readSource("src/app/left-sidebar.controller.ts");

  assert.match(
    source,
    /const openCreateEventPage = useCallback\(\(\) => \{\s*if \(!hasCreateEventAccess\) \{\s*setForcedCreateActiveLabel\(null\);\s*setSidebarPage\("root"\);\s*return;\s*\}/s,
  );
  assert.match(
    source,
    /useEffect\(\(\) => \{\s*if \(\s*hasCreateEventAccess \|\|\s*\(sidebarPage !== "createEvent" && sidebarPage !== "createEventOther"\)\s*\) \{\s*return;\s*\}\s*setForcedCreateActiveLabel\(null\);\s*setSidebarPage\("root"\);\s*\}, \[hasCreateEventAccess, setSidebarPage, sidebarPage\]\);/s,
  );
});

test("event creation routes open Create Event and do not activate My Events", () => {
  const controllerSource = readSource("src/app/left-sidebar.controller.ts");
  const viewSource = readSource("src/app/left-sidebar.tsx");

  assert.match(
    controllerSource,
    /const isCreateEntryActive =\s*isCreateRouteActive \|\| sidebarPage === "createEvent" \|\| sidebarPage === "createEventOther";/,
  );
  assert.match(
    viewSource,
    /const isViewingEventFromListInRoot =\s*sidebarPage === "root" &&\s*!isCreateEntryActive &&/,
  );
  assert.match(
    controllerSource,
    /if \(!hasCreateEventAccess \|\| !activeCreateItem\) return;\s*clearEventContext\(\);\s*setSidebarPage\("createEvent"\);/,
  );
  assert.match(
    controllerSource,
    /const activeCreateItem = useMemo\(\s*\(\) => findActiveCreateEventItem\(pathname, createMenuItems\)/,
  );
  assert.match(
    controllerSource,
    /if \(isCreateRouteActive\) \{\s*return activeCreateItem === item;\s*\}/,
  );
  assert.match(
    controllerSource,
    /const href = templateHrefMap\.get\(label\) \|\| fallbackHref;\s*if \(href\) \{\s*clearEventContext\(\);/,
  );
});

test("left sidebar view still gates both root and compact create entries behind create access", () => {
  const source = readSource("src/app/left-sidebar.tsx");

  assert.match(
    source,
    /\{hasCreateEventAccess \? \(\s*<SidebarLink link=\{\{ label: createEntryLabel,[\s\S]*?onClick: onCreate/s,
  );
  assert.match(source, /<Sidebar open=\{viewModel.isOpen\}>/);
});

test("left sidebar omits Studio and Snap Event from the always-open navigation", () => {
  const source = readSource("src/app/left-sidebar.tsx");

  assert.doesNotMatch(source, /href="\/studio"/);
  assert.doesNotMatch(source, /Snap Event/);
});

test("left sidebar uses current builders without legacy chat requests or navigation", () => {
  const source = readSource("src/app/left-sidebar.tsx");
  const controller = readSource("src/app/left-sidebar.controller.ts");
  const model = readSource("src/app/left-sidebar.model.ts");
  assert.match(source, /label: "Live Card"/);
  assert.match(source, /label: "Snap \/ Upload"/);
  assert.match(source, /buildSidebarDraftItems/);
  assert.doesNotMatch(source + controller + model, /aiThreads|AiThreadsPanel|creation\/threads|creation-threads-changed|envitefy:chat:new|\/chat/);
});

test("left sidebar gives event titles the row width without inline action controls", () => {
  const source = readSource("src/app/left-sidebar.tsx");
  const eventList = source.slice(source.indexOf("function EventListPanel("), source.indexOf("function DraftsPanel("));

  assert.match(eventList, /<button\s+type="button"\s+data-sidebar-press-surface/);
  assert.match(eventList, /SIDEBAR_SUBMENU_ROW_CLASS\} relative min-w-0 items-start px-2 py-2\.5/);
  assert.match(source, /const SIDEBAR_SUBMENU_ROW_CLASS =\s*"[^"]*flex w-full/);
  assert.doesNotMatch(eventList, /data-sidebar-press-trigger/);
  assert.match(eventList, /onClick=\{\(\) => onRowClick\(item\)\}/);
  assert.doesNotMatch(eventList, /renderRowActions|EventDeleteModal|Share2|Trash2/);
});

test("left sidebar keeps My Events visible on owner event tab routes", () => {
  const controllerSource = readSource("src/app/left-sidebar.controller.ts");
  const viewSource = readSource("src/app/left-sidebar.tsx");

  assert.match(controllerSource, /const requestedOwnerTab: EventContextTab \| null/);
  assert.match(controllerSource, /requestedTab === "guests"[\s\S]*?"rsvps"/);
  assert.match(controllerSource, /requestedTab === "communications"[\s\S]*?"messages"/);
  assert.match(
    controllerSource,
    /requestedTab === "dashboard"[\s\S]*?\|\|[\s\S]*?requestedTab === "rsvps"[\s\S]*?\|\|[\s\S]*?requestedTab === "messages"/,
  );
  assert.match(controllerSource, /setEventSidebarMode\("owner"\);/);
  assert.match(
    controllerSource,
    /const sourcePage = inferredSource \|\| "myEvents";[\s\S]*?setSidebarPage\(sourcePage\);/,
  );
  assert.match(
    controllerSource,
    /const openOwnerEventContext = useCallback\([\s\S]*?setEventContextSourcePage\(sourcePage\);[\s\S]*?setSidebarPage\(sourcePage\);[\s\S]*?const nextHref = buildOwnerEventViewHref/,
  );
  assert.match(controllerSource, /const ownerNavigationPendingRef = useRef\(false\);/);
  assert.match(
    controllerSource,
    /if \(!selectedEventId\) return;\s*if \(ownerNavigationPendingRef\.current\) return;\s*if \(invitedNavigationPendingRef\.current\) return;/,
  );
  assert.match(
    controllerSource,
    /if \(ownerNavigationPendingRef\.current\) return;\s*if \(invitedNavigationPendingRef\.current\) return;\s*if \(pathname !== "\/"\) return;/,
  );
  assert.match(
    controllerSource,
    /if \(!ownerNavigationPendingRef\.current && !invitedNavigationPendingRef\.current\) return;\s*if \(!pathname \|\| pathname === "\/"\) return;\s*ownerNavigationPendingRef\.current = false;\s*invitedNavigationPendingRef\.current = false;/,
  );
  assert.match(
    controllerSource,
    /setSidebarPage\(sourcePage\);\s*const nextHref = buildOwnerEventViewHref\(ownerHref, item\.productKind\);\s*const currentPath = typeof window !== "undefined" \? window\.location\.pathname : pathname;\s*if \(!String\(currentPath \|\| ""\)\.startsWith\("\/event\/"\)\) \{\s*ownerNavigationPendingRef\.current = true;\s*\}\s*router\.push\(nextHref\);/,
  );
  assert.match(viewSource, /const showOwnerEventsPanel =/);
  assert.match(
    viewSource,
    /viewModel\.eventContextSourcePage === "myEvents" &&[\s\S]*?viewModel\.eventSidebarMode === "owner"/,
  );
  assert.match(viewSource, /const showEventContextPanel =/);
  assert.match(viewSource, /aria-hidden=\{!showOwnerEventsPanel\}/);
  assert.match(viewSource, /aria-hidden=\{!showEventContextPanel\}/);
  assert.match(viewSource, /className="relative min-h-0 flex-1 overflow-clip"/);
});
