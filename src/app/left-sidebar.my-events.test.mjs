import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);

function sourceFile(file) {
  return ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true,
    file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
}

function evaluate(source, bindings, result) {
  const code = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  }).outputText;
  return new Function("require", "exports", ...Object.keys(bindings), `${code}; return ${result};`)(
    require, {}, ...Object.values(bindings),
  );
}

function findVariable(source, name) {
  let declaration;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      declaration = node;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(declaration, `${name} exists in the sidebar controller`);
  return `const ${declaration.getText(source)};`;
}

test("My Events opens its sidebar list without navigating away with either creation rollout setting", () => {
  const source = sourceFile("src/app/left-sidebar.controller.ts");
  const callbacks = ["openCompactEventsPage", "openMyEventsPage"]
    .map((name) => findVariable(source, name)).join("\n");
  for (const unifiedCreation of [true, false]) {
    const calls = [];
    const open = evaluate(callbacks, {
      useCallback: (callback) => callback,
      UNIFIED_CREATION_ENABLED: unifiedCreation,
      clearEventContext: () => calls.push(["clear"]),
      setIsCollapsed: (value) => calls.push(["collapsed", value]),
      setSidebarPage: (value) => calls.push(["page", value]),
      collapseSidebarOnTouch: () => calls.push(["close mobile navigation"]),
      router: { push: (href) => calls.push(["navigate", href]) },
    }, "openMyEventsPage");
    open();
    assert.deepEqual(calls, [["clear"], ["collapsed", false], ["page", "myEvents"]],
      `the event list stays open when unified creation is ${unifiedCreation}`);
  }
});

async function loadEventPanel() {
  const model = await import("./left-sidebar.model.ts");
  const source = sourceFile("src/app/left-sidebar.tsx");
  const declaration = source.statements.find((node) =>
    ts.isFunctionDeclaration(node) && node.name?.text === "EventListPanel");
  assert.ok(declaration);
  const icon = () => null;
  const styles = Object.fromEntries([
    "SIDEBAR_SUBMENU_ROW_CLASS", "SIDEBAR_SUBMENU_ROW_ACTIVE_CLASS",
    "SIDEBAR_SUBMENU_ROW_INACTIVE_CLASS", "SIDEBAR_SUBMENU_ICON_CLASS",
    "SIDEBAR_SUBMENU_ICON_ACTIVE_CLASS", "SIDEBAR_SUBMENU_ICON_INACTIVE_CLASS",
    "SIDEBAR_SUBMENU_LABEL_ACTIVE_CLASS", "SIDEBAR_SUBMENU_LABEL_INACTIVE_CLASS",
    "SIDEBAR_SUBMENU_CARD_CLASS", "SIDEBAR_DIVIDER_CLASS",
  ].map((name) => [name, ""]));
  const EventListPanel = evaluate(declaration.getText(source), {
    ...styles,
    Fragment: React.Fragment,
    ClipboardList: icon,
    PartyPopper: icon,
    ChevronRight: icon,
    SidebarListPanel: ({ children }) => React.createElement("section", null, children),
    sidebarIconLookup: {},
    getChronologicalEventItems: model.getChronologicalEventItems,
    getSidebarEventDateLabels: model.getSidebarEventDateLabels,
  }, "EventListPanel");
  return { ...model, EventListPanel };
}

function elements(root) {
  if (Array.isArray(root)) return root.flatMap(elements);
  if (!React.isValidElement(root)) return [];
  return [root, ...elements(root.props.children)];
}

function textContent(root) {
  if (Array.isArray(root)) return root.map(textContent).join("");
  if (React.isValidElement(root)) return textContent(root.props.children);
  return typeof root === "string" || typeof root === "number" ? String(root) : "";
}

function group(model, history) {
  return model.buildGroupedEventLists({
    history,
    getEventStartIso: (data) => data.startISO,
    buildEventPath: (id) => `/event/${id}`,
    isSportsPreviewFirstEvent: () => false,
    isInvitedEventLikeRecord: (data) => data.ownership === "invited",
    canShowOwnerRsvpDashboard: () => false,
  }).myEvents;
}

test("My Events renders all categories in event-date order and reveals selectable past events", async () => {
  const model = await loadEventPanel();
  const grouped = group(model, [
    { id: "later", title: "Later birthday", data: { category: "birthdays", startISO: "2200-08-01T12:00:00Z" } },
    { id: "earlier", title: "Earlier wedding", data: { category: "weddings", startISO: "2200-06-01T12:00:00Z" } },
    { id: "invited", title: "Invited picnic", data: { ownership: "invited", category: "general_event", startISO: "2200-07-01T12:00:00Z" } },
    { id: "undated", title: "Undated meetup", data: { category: "general_event" } },
    { id: "older", title: "Older celebration", data: { category: "birthdays", startISO: "2019-01-01T12:00:00Z" } },
    { id: "recent", title: "Recent celebration", data: { category: "weddings", startISO: "2020-01-01T12:00:00Z" } },
  ]);
  let pastExpanded = false;
  const selected = [];
  const render = () => model.EventListPanel({
    title: "My Events", grouped,
    emptyStateCopy: "No events yet.", emptyPastCopy: "No past events.",
    isHistoryRowActive: (id) => id === "earlier",
    onRowClick: (item) => selected.push(item.row.id),
    pastExpanded,
    setPastExpanded: (update) => { pastExpanded = update(pastExpanded); },
    showPendingBadge: false, pastRowOpacityClass: "", onBack: () => {},
  });
  const eventRows = (tree) => elements(tree).filter((element) =>
    element.type === "button" && element.props["data-sidebar-press-surface"] !== undefined);
  const pastToggle = (tree) => elements(tree).find((element) =>
    element.type === "button" && typeof element.props["aria-expanded"] === "boolean");
  const collapsed = render();
  const initialRows = eventRows(collapsed);
  for (const row of initialRows) row.props.onClick();
  assert.deepEqual(selected, ["earlier", "invited", "later", "undated"]);
  assert.equal(initialRows[0].props["aria-current"], "page");
  assert.match(textContent(collapsed), /Date to confirm/);
  assert.doesNotMatch(textContent(collapsed), /Recent celebration|Older celebration/);
  assert.equal(pastToggle(collapsed).props["aria-expanded"], false);
  assert.equal(textContent(pastToggle(collapsed)), "Show past events");

  pastToggle(collapsed).props.onClick();
  const expanded = render();
  assert.equal(pastToggle(expanded).props["aria-expanded"], true);
  assert.equal(textContent(pastToggle(expanded)), "Hide past events");
  selected.length = 0;
  for (const row of eventRows(expanded)) row.props.onClick();
  assert.deepEqual(selected, ["earlier", "invited", "later", "undated", "recent", "older"]);
  pastToggle(expanded).props.onClick();
  assert.equal(eventRows(render()).length, 4);
});

test("an account with only past events can still expand its event list", async () => {
  const model = await loadEventPanel();
  const tree = model.EventListPanel({
    title: "My Events",
    grouped: group(model, [{ id: "past", title: "Past event", data: { startISO: "2020-01-01T12:00:00Z" } }]),
    emptyStateCopy: "No events yet.", emptyPastCopy: "No past events.",
    isHistoryRowActive: () => false, onRowClick: () => {},
    pastExpanded: true, setPastExpanded: () => {},
    showPendingBadge: false, pastRowOpacityClass: "", onBack: () => {},
  });
  assert.match(textContent(tree), /No upcoming events\./);
  assert.match(textContent(tree), /Past event/);
  assert.doesNotMatch(textContent(tree), /No events yet\./);
});
