import assert from "node:assert/strict";
import test from "node:test";
import {
  EVENT_PREVIEW_DEVICES,
  buildEmbeddedEventPreviewHref,
  buildOwnerEventViewHref,
  buildOwnerEventEditHref,
  eventPreviewReturnHref,
  fitEventPreview,
  getEventPreviewLayout,
  initialEventPreviewDevice,
  ownerEventEditorReturnHref,
} from "./event-preview-viewport.ts";

test("device previews use distinct real CSS viewport breakpoints", () => {
  assert.ok(EVENT_PREVIEW_DEVICES.desktop.width >= 1280);
  assert.ok(EVENT_PREVIEW_DEVICES.tablet.width >= 768 && EVENT_PREVIEW_DEVICES.tablet.width < 1024);
  assert.ok(EVENT_PREVIEW_DEVICES.mobile.width < 640);
  assert.equal(initialEventPreviewDevice(360), "mobile");
  assert.equal(initialEventPreviewDevice(800), "tablet");
  assert.equal(initialEventPreviewDevice(1500), "desktop");
  assert.equal(initialEventPreviewDevice(1024), "desktop");
  assert.equal(initialEventPreviewDevice(767), "mobile");
});

test("sidebar event links enter the owner view without stale editor or preview flags", () => {
  assert.equal(
    buildOwnerEventViewHref(
      "/event/fright-invite?tab=design&preview=owner&embed=dashboard-preview&edit=123&view=images&returnTo=%2F#schedule",
    ),
    "/event/fright-invite?tab=event#schedule",
  );
});

test("owned Live Cards and flyers open Design while event pages keep the event viewer", () => {
  assert.equal(buildOwnerEventViewHref("/event/card?tab=event&preview=owner", "card"), "/event/card?tab=design");
  assert.equal(buildOwnerEventViewHref("/event/meet?tab=design", "event"), "/event/meet?tab=event");
});

test("Mobile on a real phone fills its available CSS viewport without scaling", () => {
  for (const [width, height] of [[375, 716], [430, 836], [667, 279]]) {
    assert.deepEqual(getEventPreviewLayout("mobile", width, height, true), {
      viewport: { width, height },
      fit: { scale: 1, width, height },
    });
  }
  const tablet = getEventPreviewLayout("tablet", 375, 716, true);
  assert.equal(tablet.viewport.width, 820);
  assert.ok(tablet.fit.width <= 375 && tablet.fit.height <= 716);
  assert.equal(getEventPreviewLayout("mobile", 1440, 900).viewport.width, 390);
});

test("owner Edit opens the editing menu while preserving the saved event and chosen design", () => {
  const href = buildOwnerEventEditHref("/event/gymnastics/customize?edit=meet-123&templateId=airborne-atlas");
  assert.equal(href, "/event/gymnastics/customize?edit=meet-123&templateId=airborne-atlas&editor=menu");
  assert.equal(buildOwnerEventViewHref("/event/meet?editor=menu&edit=meet"), "/event/meet?tab=event");
  assert.doesNotMatch(buildEmbeddedEventPreviewHref(href), /editor=|edit=/);
});

test("editing round trips retain the owner canvas and support already-open editor links", () => {
  const editHref = buildOwnerEventEditHref(
    "/gymnastics/templates/airborne-atlas/customize?edit=meet-123",
    "/event/fright-invite?preview=owner&embed=dashboard-preview#schedule",
  );
  const search = new URL(editHref, "https://envitefy.local").searchParams;
  assert.equal(ownerEventEditorReturnHref(search), "/event/fright-invite?tab=event#schedule");
  assert.equal(ownerEventEditorReturnHref(new URLSearchParams("editor=menu&edit=meet-123")), "/event/meet-123?tab=event");
  assert.equal(ownerEventEditorReturnHref(new URLSearchParams("editor=menu&edit=meet-123&returnTo=https%3A%2F%2Fexample.com")), "/event/meet-123?tab=event");
  assert.equal(ownerEventEditorReturnHref(new URLSearchParams("edit=meet-123")), null);
  assert.equal(ownerEventEditorReturnHref(new URLSearchParams("editor=menu")), null);
  assert.equal(ownerEventEditorReturnHref(null), null);
});

test("the edit menu carries the event color without leaking editor state into public previews", () => {
  const href = buildOwnerEventEditHref("/event/gymnastics/customize?edit=meet", "/event/fright-invite", "#f6f1e7");
  assert.equal(new URL(href, "https://envitefy.local").searchParams.get("eventColor"), "#f6f1e7");
  assert.doesNotMatch(buildEmbeddedEventPreviewHref(href), /eventColor/);
  assert.doesNotMatch(buildOwnerEventViewHref(href), /eventColor/);
  assert.doesNotMatch(buildOwnerEventEditHref("/edit", "/event/meet", "red;display:none"), /eventColor/);
});

test("Close keeps the requested workspace destination and rejects external redirects", () => {
  const fallback = "/smart-signup-form/school";
  assert.equal(
    eventPreviewReturnHref("/event/school?tab=design#preview", fallback),
    "/event/school?tab=design#preview",
  );
  assert.equal(
    eventPreviewReturnHref(["/event/school?tab=dashboard"], fallback),
    "/event/school?tab=dashboard",
  );
  for (const href of [
    undefined,
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "javascript:alert(1)",
  ]) {
    assert.equal(eventPreviewReturnHref(href, fallback), fallback);
  }
});

test("every simulated device fits on phones and large displays without distorting its aspect ratio", () => {
  for (const device of Object.keys(EVENT_PREVIEW_DEVICES)) {
    for (const [width, height] of [
      [360, 600],
      [800, 1000],
      [1900, 950],
    ]) {
      const fit = fitEventPreview(device, width, height);
      assert.ok(fit.scale > 0 && fit.scale <= 1);
      assert.ok(fit.width <= width && fit.height <= height);
      const expected = EVENT_PREVIEW_DEVICES[device];
      assert.ok(Math.abs(fit.width / fit.height - expected.width / expected.height) < 0.00001);
    }
  }
  assert.equal(fitEventPreview("desktop", 0, 0).scale, 0);
});

test("preview URLs avoid editor redirects and nested preview controls across event products", () => {
  for (const path of [
    "/event/wedding",
    "/event/gymnastics-meet",
    "/card/birthday",
    "/smart-signup-form/school",
  ]) {
    const href = buildEmbeddedEventPreviewHref(
      `https://envitefy.com${path}?tab=design&edit=1&updated=1&created=1&t=12&returnTo=%2Fevent%2Fhost%3Ftab%3Ddashboard#schedule`,
    );
    const url = new URL(href, "http://localhost:3000");
    assert.equal(url.pathname, path);
    assert.equal(url.searchParams.get("preview"), "owner");
    assert.equal(url.searchParams.get("embed"), "dashboard-preview");
    assert.equal(url.searchParams.size, 2);
    assert.equal(url.hash, "#schedule");
    assert.equal(buildEmbeddedEventPreviewHref(href), href);
  }
});
