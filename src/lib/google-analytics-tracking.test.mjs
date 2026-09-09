import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const measurementId = "G-TEST123456";
const readyEvent = "envitefy:analytics-ready";

function trackingHarness(analytics) {
  const window = new EventTarget();
  window.location = { origin: "https://example.com" };
  const preferences = { analytics };
  const states = [preferences, true, false];
  const effects = [];
  const mocks = {
    react: {
      useCallback: (callback) => callback,
      useEffect: (callback) => effects.push(callback),
      useState: () => [states.shift(), () => {}],
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "next/script": { __esModule: true, default: "script" },
    "next/navigation": { usePathname: () => "/faq" },
    "lucide-react": { ShieldCheck: "svg" },
    "@vercel/speed-insights/next": { SpeedInsights: "speed-insights" },
    "@/lib/google-analytics": { GOOGLE_ANALYTICS_MEASUREMENT_ID: measurementId },
    "@/lib/privacy-preferences": {
      ANALYTICS_READY_EVENT: readyEvent,
      hasAnalyticsConsent: () => analytics,
      readPrivacyPreferences: () => preferences,
    },
  };
  const load = (name) => {
    const source = readFileSync(new URL(`../components/${name}.tsx`, import.meta.url), "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    });
    const exports = {};
    runInNewContext(outputText, {
      exports,
      require: (name) => {
        assert.ok(name in mocks, `Unexpected dependency: ${name}`);
        return mocks[name];
      },
      window,
      document: { title: "FAQ" },
      Event,
    });
    return exports.default;
  };
  const controls = load("PrivacyControls")();
  effects.length = 0;
  load("GoogleAnalyticsRouteTracker")();
  for (const effect of effects) effect();

  function findScript(element) {
    if (!element || typeof element !== "object") return null;
    if (element.props?.id === "envitefy-ga4") return element;
    const children = element.props?.children;
    for (const child of Array.isArray(children) ? children : [children]) {
      const script = findScript(child);
      if (script) return script;
    }
    return null;
  }

  return { window, script: findScript(controls) };
}

test("consented initialization uses Google's Arguments command format and sends the initial view", () => {
  const { window, script } = trackingHarness(true);
  assert.ok(script, "Analytics consent must load the tag");
  assert.equal(window.dataLayer, undefined, "The tracker waits for the tag to initialize");

  script.props.onLoad();

  assert.equal(window.dataLayer.length, 3);
  for (const command of window.dataLayer) {
    assert.equal(Object.prototype.toString.call(command), "[object Arguments]");
  }
  assert.equal(window.dataLayer[0][0], "js");
  assert.equal(window.dataLayer[1][0], "config");
  assert.equal(window.dataLayer[1][1], measurementId);
  assert.equal(window.dataLayer[1][2].send_page_view, false);
  assert.equal(window.dataLayer[2][0], "event");
  assert.equal(window.dataLayer[2][1], "page_view");
  assert.equal(window.dataLayer[2][2].send_to, measurementId);
  assert.equal(window.dataLayer[2][2].page_location, "https://example.com/faq");
});

test("essential-only visitors do not load the Google tag or queue page views", () => {
  const { window, script } = trackingHarness(false);
  assert.equal(script, null);
  window.dispatchEvent(new Event(readyEvent));
  assert.equal(window.dataLayer, undefined);
  assert.equal(window.gtag, undefined);
});
