import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("admin dashboard is the executive operations surface", () => {
  const source = readSource("src/app/admin/page.tsx");

  assert.match(source, /Admin Dashboard/);
  assert.match(source, /Platform Funnel/);
  assert.match(source, /GA4 Snapshot/);
  assert.match(source, /Event Category Performance/);
  assert.match(source, /Needs Attention/);
  assert.doesNotMatch(source, /href="\/admin\/campaigns"/);
});

test("admin nav config has expected sections", () => {
  const source = readSource("src/components/admin/nav.ts");

  for (const label of [
    "Dashboard",
    "Users",
    "Events",
    "AI Concierge",
    "Scans & Traffic",
    "Emails",
    "Marketing Assets",
    "Analytics",
    "Settings",
    "Logs / Health",
  ]) {
    assert.match(source, new RegExp(`label: "${label}"`));
  }

  assert.match(source, /href: "\/admin"/);
  assert.match(source, /href: "\/admin\/marketing-images"/);
});

test("admin layout does not render the duplicate internal admin rail", () => {
  const layout = readSource("src/app/admin/layout.tsx");

  assert.doesNotMatch(layout, /AdminShell/);
  assert.doesNotMatch(layout, /adminEmail/);
});

test("admin compatibility redirects stay wired", () => {
  const campaigns = readSource("src/app/admin/campaigns/page.tsx");
  const marketingAssets = readSource("src/app/admin/marketing-assets/page.tsx");

  assert.match(campaigns, /redirect\("\/admin\/emails\?tab=campaigns"\)/);
  assert.match(marketingAssets, /redirect\("\/admin\/marketing-images"\)/);
});

test("main sidebar opens admin as a submenu instead of a direct global menu fanout", () => {
  const model = readSource("src/app/left-sidebar.model.ts");
  const controller = readSource("src/app/left-sidebar.controller.ts");
  const sidebar = readSource("src/app/left-sidebar.tsx");

  assert.match(model, /"admin"/);
  assert.match(controller, /openAdminPage/);
  assert.match(controller, /setSidebarPage\("admin"\)/);
  assert.match(controller, /pathname\?\.startsWith\("\/admin"\)/);
  assert.match(controller, /lastAdminRouteSyncPathRef/);
  assert.match(sidebar, /function AdminNavigationPanel/);
  assert.match(sidebar, /adminNavItems\.map/);
  assert.match(sidebar, /onAdmin=\{viewModel\.openAdminPage\}/);
  assert.doesNotMatch(sidebar, /\{item\.description\}/);
  assert.doesNotMatch(sidebar, /href="\/admin"\s+onClick=\{onAdmin\}/);
});

test("admin user table still shows last event date and debug URLs", () => {
  const source = readSource("src/app/admin/users/page.tsx");

  assert.match(source, /Last event/);
  assert.match(source, /formatDate\(u\.last_event_created_at, \{ forceUsNumeric: true \}\)/);
  assert.match(source, /import \{ buildEventProductPath \} from "@\/utils\/event-product-route";/);
  assert.match(source, /debugLinkKind="events"/);
  assert.match(source, /debugLinkKind="scans"/);
  assert.match(source, /\/debug-links\?kind=\$\{debugLinkKind\}/);
  assert.match(source, /Dev event URLs/);
  assert.match(source, /Dev scan URLs/);
  assert.match(source, /No saved scan URLs yet/);
  assert.match(source, /readAdminDebugLinks\(rawLinks\)/);
  assert.match(source, /buildAdminEventDebugHref/);
});
