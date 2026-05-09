import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("left sidebar controller derives a single create-access flag", () => {
  const source = readSource("src/app/left-sidebar.controller.ts");

  assert.match(
    source,
    /const hasCreateEventAccess = useMemo\(\s*\(\) => useGymnasticsDirectCreate \|\| createMenuOptionCount > 0,\s*\[createMenuOptionCount, useGymnasticsDirectCreate\],?\s*\)/s,
  );
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

test("left sidebar view still gates both root and compact create entries behind create access", () => {
  const source = readSource("src/app/left-sidebar.tsx");

  assert.match(
    source,
    /\{hasCreateEventAccess \? \(\s*<button\s+type="button"\s+onClick=\{onCreate\}[\s\S]*?Create Event\s*<\/span>/s,
  );
  assert.doesNotMatch(source, /CompactRail/);
  assert.doesNotMatch(source, /Collapse navigation/);
  assert.doesNotMatch(source, /Expand navigation/);
});

test("left sidebar exposes Studio below Home in the always-open navigation", () => {
  const source = readSource("src/app/left-sidebar.tsx");
  const controllerSource = readSource("src/app/left-sidebar.controller.ts");
  const modelSource = readSource("src/app/left-sidebar.model.ts");

  assert.match(
    source,
    /Home\s*<\/span>\s*<\/Link>\s*<Link\s+href="\/studio"[\s\S]*?Studio\s*<\/span>/s,
  );
  assert.match(
    controllerSource,
    /case "studio":\s*return pathname === "\/studio" && sidebarPage === "root";/s,
  );
  assert.match(modelSource, /\|\s*"studio"/);
});

test("left sidebar exposes signed-in AI create entry", () => {
  const source = readSource("src/app/left-sidebar.tsx");
  const controllerSource = readSource("src/app/left-sidebar.controller.ts");
  const modelSource = readSource("src/app/left-sidebar.model.ts");

  assert.match(source, /onClick=\{onAiThreads\}[\s\S]*?Create with AI/s);
  assert.match(
    source,
    /const isChatActive = pathname === "\/chat" \|\| sidebarPage === "aiThreads";/,
  );
  assert.match(source, /function AiThreadsPanel/);
  assert.match(
    source,
    /style=\{panelStyle\(\s*aiThreadsPanelTransform,\s*viewModel\.sidebarPage === "aiThreads",?\s*\)\}/s,
  );
  assert.match(source, /fetch\("\/api\/creation\/threads\?limit=20"/);
  assert.match(source, /method: "DELETE"/);
  assert.match(source, /text-red-500/);
  assert.match(source, /envitefy:creation-threads-changed/);
  assert.match(source, /href="\/chat"[\s\S]*?onClick=\{onNewChat\}[\s\S]*?New chat/s);
  assert.doesNotMatch(source, /href="\/chat"[\s\S]{0,160}onClick=\{onOpenThread\}/);
  assert.match(source, /href=\{`\/chat\?thread=\$\{encodeURIComponent\(thread\.id\)\}`\}/);
  assert.match(
    source,
    /onClick=\{\(event\) => \{\s*if \(!isPlainPrimaryLinkClick\(event\)\) return;\s*event\.preventDefault\(\);\s*onOpenThread\(thread\.id\);\s*\}\}/s,
  );
  assert.match(source, /className="group flex items-center gap-2"/);
  assert.match(
    source,
    /opacity-0[\s\S]*group-hover:opacity-100[\s\S]*group-focus-within:opacity-100/,
  );
  assert.match(source, /Recents/);
  assert.match(controllerSource, /resetSidebarToRoot: \(\) => void;/);
  assert.match(controllerSource, /resetSidebarToRoot,/);
  assert.match(controllerSource, /openAiThreadsPage: \(\) => void;/);
  assert.match(controllerSource, /openAiThread: \(threadId: string\) => void;/);
  assert.match(controllerSource, /startNewAiChat: \(\) => void;/);
  assert.match(
    controllerSource,
    /const openAiThreadsPage = useCallback\(\(\) => \{[\s\S]*?setSidebarPage\("aiThreads"\)/,
  );
  assert.match(controllerSource, /const startNewAiChat = useCallback\(\(\) => \{/);
  assert.match(
    controllerSource,
    /const startNewAiChat = useCallback\(\(\) => \{[\s\S]*?setSidebarPage\("aiThreads"\)/,
  );
  assert.match(
    controllerSource,
    /const openAiThread = useCallback\([\s\S]*?const nextHref = `\/chat\?thread=\$\{encodeURIComponent\(cleanThreadId\)\}`;[\s\S]*?router\.push\(nextHref\);/s,
  );
  assert.match(
    controllerSource,
    /const openAiThread = useCallback\([\s\S]*?clearEventContext\(\);\s*setSidebarPage\("aiThreads"\);\s*collapseSidebarOnTouch\(\);/s,
  );
  const openAiThreadSource =
    controllerSource.match(/const openAiThread = useCallback\([\s\S]*?\n {2}\);/)?.[0] ?? "";
  assert.doesNotMatch(openAiThreadSource, /setSidebarPage\("root"\)/);
  assert.doesNotMatch(openAiThreadSource, /setPendingAiThreadHref\(nextHref\)/);
  assert.doesNotMatch(openAiThreadSource, /router\.push\("\/chat"\)/);
  assert.match(controllerSource, /window\.dispatchEvent\(new CustomEvent\("envitefy:chat:new"\)\)/);
  assert.match(
    controllerSource,
    /const openAiThreadsPage = useCallback\(\(\) => \{[\s\S]*?router\.push\("\/chat"\);[\s\S]*?if \(!isDesktop\) \{[\s\S]*?envitefy:chat:new/s,
  );
  assert.match(modelSource, /\|\s*"aiThreads"/);
});

test("left sidebar gives My Events rows a hover delete affordance", () => {
  const source = readSource("src/app/left-sidebar.tsx");

  assert.match(
    source,
    /\) : showQuickActions \? \(\s*<button[\s\S]*?className="ml-2 inline-flex h-9 w-9[\s\S]*?aria-label=\{`Delete \$\{item\.title\}`\}/s,
  );
  assert.match(
    source,
    /group-hover:opacity-100 group-focus-within:opacity-100 hover:border-red-200 hover:bg-red-50 hover:text-red-600/,
  );
});

test("left sidebar keeps My Events visible on owner event tab routes", () => {
  const controllerSource = readSource("src/app/left-sidebar.controller.ts");
  const viewSource = readSource("src/app/left-sidebar.tsx");

  assert.match(
    controllerSource,
    /requestedTab !== "dashboard" &&[\s\S]*?requestedTab !== "settings"/,
  );
  assert.match(controllerSource, /setEventSidebarMode\("owner"\);/);
  assert.match(
    controllerSource,
    /const sourcePage = inferredSource \|\| "myEvents";[\s\S]*?setSidebarPage\(sourcePage\);/,
  );
  assert.match(
    controllerSource,
    /const openOwnerEventContext = useCallback\([\s\S]*?setEventContextSourcePage\("myEvents"\);[\s\S]*?setSidebarPage\("myEvents"\);[\s\S]*?router\.push\(buildEventOwnerHref/,
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
