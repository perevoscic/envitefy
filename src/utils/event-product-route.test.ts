import { describe, expect, test } from "bun:test";
import { getPrimaryEventProductOutput, isCardFirstEventProduct } from "./event-product-route";

describe("event product routing", () => {
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

  test("non-discovery invitation requests keep card-first inference", () => {
    expect(
      getPrimaryEventProductOutput({
        createdVia: "concierge",
        prompt: "Create an invitation for our awards dinner",
      }),
    ).toBe("digital_flyer");
  });
});
