import { describe, expect, test } from "bun:test";
import { buildEventProductPath, getPrimaryEventProductOutput, isCardFirstEventProduct } from "./event-product-route";

describe("event product routing", () => {
  test("new categories and legacy scans use metadata before product words in their title", () => {
    for (const data of [
      { templateEditor: { category: "future-category" } },
      { createdVia: "template" },
      { createdVia: "manual" },
      { createdVia: "ocr" },
      { sourceContext: { type: "snap" } },
      { customEventPage: {} },
    ]) {
      expect(buildEventProductPath({ eventId: "saved", title: "Menu invite signup", data, publicSlug: "my-event" })).toBe("/event/my-event");
    }
  });

  test("all card products keep their renderer and stored slug when the title changes", () => {
    for (const primaryOutput of ["live_card", "invitation", "digital_flyer", "printable_flyer", "instagram_story", "thank_you_card", "menu", "welcome_sign"]) {
      expect(buildEventProductPath({ eventId: "saved", title: "Renamed", data: { primaryOutput, publicSlug: "original-address" } })).toBe("/card/original-address");
    }
    expect(buildEventProductPath({ eventId: "saved", title: "Dinner", data: { createdVia: "livecard-builder" }, publicSlug: "dinner" })).toBe("/card/dinner");
  });

  test("standalone signup templates use the signup renderer even without signup in their title", () => {
    const data = {
      title: "Pumpkin Day",
      category: "Smart sign-up",
      createdVia: "template",
      signupForm: { sections: [] },
      templateEditor: { category: "signup-forms" },
    };
    expect(getPrimaryEventProductOutput(data)).toBe("signup_form");
    expect(buildEventProductPath({
      eventId: "saved-event",
      title: data.title,
      publicSlug: "pumpkin-day-at-upper-school-lunchroom",
      data,
    })).toBe("/smart-signup-form/pumpkin-day-at-upper-school-lunchroom");
    expect(getPrimaryEventProductOutput({ ...data, templateEditor: undefined })).toBe("signup_form");
    expect(getPrimaryEventProductOutput({ ...data, category: "General" })).toBe("signup_form");
  });

  test("an embedded signup does not replace another event's renderer", () => {
    expect(getPrimaryEventProductOutput({
      title: "School Field Day",
      category: "General",
      signupForm: { sections: [] },
    })).toBe(null);
    expect(getPrimaryEventProductOutput({
      title: "School Field Day",
      category: "Smart sign-up",
      signupForm: { sections: [] },
      primaryOutput: "event_page",
    })).toBe("event_page");
  });

  test("gymnastics discovery titles containing Invite remain event pages", () => {
    const output = getPrimaryEventProductOutput(
      {
        title: "Fright Invite",
        category: "gymnastics",
        createdVia: "meet-discovery-v2",
      },
      "Fright Invite",
    );

    expect(output).toBe("event_page");
    expect(isCardFirstEventProduct(output)).toBe(false);
  });

  test("an explicit card output still overrides discovery defaults", () => {
    expect(
      getPrimaryEventProductOutput({
        createdVia: "meet-discovery-v2",
        primaryOutput: "live_card",
        title: "Fright Invite",
      }),
    ).toBe("live_card");
  });

  test("shared sports discovery always opens as an event page", () => {
    const output = getPrimaryEventProductOutput({
      title: "Central Invitational",
      category: "sport_event",
      createdVia: "sports-discovery-v1",
      activityProfile: "basketball",
    });

    expect(output).toBe("event_page");
    expect(isCardFirstEventProduct(output)).toBe(false);
  });

  test("non-discovery invitation requests keep card-first inference", () => {
    expect(
      getPrimaryEventProductOutput({
        createdVia: "concierge",
        prompt: "Create an invitation for our awards dinner",
      }),
    ).toBe("digital_flyer");
  });
});
