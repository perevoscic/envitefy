import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const favorites = loadTs("src/lib/category-favorites.ts");
const { resolveCreationAccess } = loadTs("src/lib/creation-access.ts");
const source = ts.createSourceFile(
  "sidebar.tsx",
  readFileSync("src/app/left-sidebar.tsx", "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const declaration = source.statements.find(
  (node) => ts.isFunctionDeclaration(node) && node.name?.text === "RootNavigationPanel",
);
const code = ts.transpileModule(declaration.getText(source), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;
const icon = () => null;

test("Sign-up Forms appears for published forms, forms-focused accounts and admins", () => {
  for (const scenario of [
    {
      name: "new ordinary account",
      isAdmin: false,
      isSignupFormsDefault: false,
      signupFormsCount: 0,
      draftsCount: 0,
      visible: false,
    },
    {
      name: "drafts only",
      isAdmin: false,
      isSignupFormsDefault: false,
      signupFormsCount: 0,
      draftsCount: 1,
      visible: false,
    },
    {
      name: "published form",
      isAdmin: false,
      isSignupFormsDefault: false,
      signupFormsCount: 1,
      draftsCount: 0,
      visible: true,
    },
    {
      name: "forms-focused account",
      isAdmin: false,
      isSignupFormsDefault: true,
      signupFormsCount: 0,
      draftsCount: 0,
      visible: true,
    },
    {
      name: "admin",
      isAdmin: true,
      isSignupFormsDefault: false,
      signupFormsCount: 0,
      draftsCount: 0,
      visible: true,
    },
  ]) {
    let opened = false;
    let createOpened = false;
    const links = [];
    const bindings = {
      Home: icon,
      Upload: icon,
      LiveCardIcon: icon,
      Plus: icon,
      SidebarMyEventsMenuIcon: icon,
      Trophy: icon,
      ClipboardList: icon,
      FileEdit: icon,
      ShieldCheck: icon,
      SidebarLink: ({ link }) => {
        links.push(link);
        return React.createElement(
          "button",
          { "aria-current": link.active ? "page" : undefined },
          link.label,
          link.badge ?? "",
        );
      },
    };
    const RootNavigationPanel = new Function(
      "require",
      "exports",
      ...Object.keys(bindings),
      `${code}; return RootNavigationPanel;`,
    )(require, {}, ...Object.values(bindings));
    const markup = renderToStaticMarkup(
      React.createElement(RootNavigationPanel, {
        pathname: "/",
        sidebarPage: "signupForms",
        eventContextSourcePage: "myEvents",
        hasCreateEventAccess: true,
        createEntryLabel: "Create Event",
        isCreateEntryActive: false,
        isSnapUploadActive: false,
        schedulesCount: 0,
        ...scenario,
        onSignupForms: () => {
          opened = true;
        },
        onCreate: () => {
          createOpened = true;
        },
      }),
    );
    const formsLink = links.find((link) => link.label === "Sign-up Forms");
    assert.equal(
      links.some((link) => link.label === "Live Card"),
      true,
      scenario.name,
    );
    assert.equal(
      links.some((link) => link.label === "Envitefy Create"),
      false,
      scenario.name,
    );
    assert.equal(Boolean(formsLink), scenario.visible, scenario.name);
    if (formsLink) {
      assert.equal(formsLink.active, true);
      assert.equal(formsLink.badge, scenario.signupFormsCount);
      formsLink.onClick();
      assert.equal(opened, true);
    }
    assert.equal(
      links.some((link) => link.label === "Admin"),
      scenario.isAdmin,
    );
    assert.equal(
      links.some((link) => link.label === "Schedules"),
      false,
      `${scenario.name}: Schedules needs a saved schedule`,
    );
    assert.equal(links.find((link) => link.label === "Drafts").badge, scenario.draftsCount);
    links.find((link) => link.label === "Create Event").onClick();
    assert.equal(createOpened, true);
    assert.equal(
      links.some((link) => link.label === "Sign-up Form"),
      false,
      "the form chooser is reached through Create event, without an unpinned root entry",
    );
    assert.match(markup, /aria-label="Main navigation"/);
  }
});

test("unified navigation keeps creation products independent and saved-work sidebar lists accessible", () => {
  for (const [pages, signup] of [
    [true, false],
    [false, true],
    [true, true],
    [false, false],
  ]) {
    for (const schedulesCount of [0, 1]) {
      for (const pinSignup of [false, true]) {
        const links = [];
        const bindings = {
          Home: icon,
          Upload: icon,
          LiveCardIcon: icon,
          Plus: icon,
          SidebarMyEventsMenuIcon: icon,
          Trophy: icon,
          ClipboardList: icon,
          FileEdit: icon,
          ShieldCheck: icon,
          SidebarLink: ({ link }) => {
            links.push(link);
            return React.createElement("button", null, link.label);
          },
        };
        const RootNavigationPanel = new Function(
          "require",
          "exports",
          ...Object.keys(bindings),
          `${code}; return RootNavigationPanel;`,
        )(require, {}, ...Object.values(bindings));
        const access = resolveCreationAccess({
          policy: "restricted",
          categories: pages ? ["general"] : [],
          products: [...(pages ? ["event_page"] : []), ...(signup ? ["signup_form"] : [])],
        });
        const { SidebarCategoryFavorites } = loadTs(
          "src/components/navigation/SidebarCategoryFavorites.tsx",
          {
            "@/components/ui/sidebar": { SidebarLink: bindings.SidebarLink },
            "lucide-react": new Proxy({}, { get: () => icon }),
          },
        );
        const selected = favorites.categoryFavoritesFor(
          [...(pages ? ["school"] : []), ...(pinSignup ? ["signup-forms"] : [])],
          access,
        );
        const markup = renderToStaticMarkup(
          React.createElement(RootNavigationPanel, {
            pathname: "/events",
            sidebarPage: "root",
            eventContextSourcePage: "myEvents",
            hasCreateEventAccess: pages || signup,
            unifiedCreation: true,
            createEntryLabel: "Create event",
            isCreateEntryActive: false,
            isSnapUploadActive: false,
            isAdmin: false,
            createdEventsCount: 3,
            schedulesCount,
            signupFormsCount: 1,
            draftsCount: 1,
            isSignupFormsDefault: false,
            categoryFavorites: React.createElement(SidebarCategoryFavorites, {
              favorites: selected,
              options: favorites.categoryFavoritesFor(
                favorites.CATEGORY_FAVORITES.map((item) => item.id),
                access,
              ),
              activeId: null,
              loading: false,
              saving: false,
              error: "",
              onNavigate: () => {},
              onToggle: async () => {},
            }),
          }),
        );
        assert.deepEqual(
          links.map((link) => link.label),
          [
            "Home",
            "Snap a Flyer",
            "Live Card",
            ...(pages || signup ? ["Create event"] : []),
            ...(pages ? ["School & classroom"] : []),
            ...(signup && pinSignup ? ["Sign-up Form"] : []),
            "My Events",
            ...(schedulesCount > 0 ? ["Schedules"] : []),
            "Sign-up Forms",
            "Drafts",
          ],
        );
        const createGroup = markup.slice(
          markup.indexOf(">Create</p>"),
          markup.indexOf("</div>", markup.indexOf(">Create</p>")),
        );
        assert.equal(
          createGroup.includes("Sign-up Form"),
          false,
          "Sign-up Form never appears as an unpinned Create-group entry",
        );
        assert.doesNotMatch(createGroup, /Favorites|School &amp; classroom/);
        if (pages || signup) {
          assert.match(markup, /<\/div><section aria-label="Favorite event types"/);
          assert.ok(
            markup.indexOf('aria-label="Favorite event types"') < markup.indexOf(">Manage</p>"),
          );
          const favoriteSection = markup.match(
            /<section aria-label="Favorite event types"[\s\S]*?<\/section>/,
          )?.[0];
          assert.equal(
            favoriteSection.includes("Sign-up Form"),
            signup && pinSignup,
            "Sign-up Form appears only when explicitly pinned and granted",
          );
        } else assert.doesNotMatch(markup, /Favorite event types/);
        assert.equal(
          links.find((link) => link.label === "Schedules")?.badge,
          schedulesCount > 0 ? schedulesCount : undefined,
        );
        assert.equal(links.find((link) => link.label === "My Events").active, true);
        assert.equal(links.find((link) => link.label === "My Events").badge, 3);
      }
    }
  }
});
