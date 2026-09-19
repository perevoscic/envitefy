import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

registerHooks({
  resolve(specifier, context, next) {
    const url = specifier.startsWith("@/")
      ? pathToFileURL(resolve("src", specifier.slice(2)))
      : specifier.startsWith(".")
        ? new URL(specifier, context.parentURL)
        : null;
    if (url && existsSync(new URL(`${url}.ts`))) return next(`${url}.ts`, context);
    return next(specifier, context);
  },
});

const { buildStudioRequest } = await import("./studio-workspace-builders.ts");
const { createInitialDetails } = await import("./studio-workspace-sanitize.ts");
const { approvedArtworkText } = await import("../../lib/studio/artwork-copy.ts");

const venueName = "Maple Community Center, Room B";
const address = `${venueName}, 100 Example Lane, Austin, TX`;
const refinement = "Make the background darker and the lettering larger. Keep every approved fact and line of copy.";

function eventDetails(product) {
  return {
    ...createInitialDetails(),
    product,
    category: "Game Day",
    eventTitle: "Cedar Hawks vs. Maple Bears",
    venueName,
    location: address,
    theme: "Navy and silver stadium artwork",
  };
}

for (const product of ["live_card", "digital_flyer", "printable_flyer", "event_page"]) {
  test(`${product} appearance edits retain the product's address contract`, () => {
    const details = eventDetails(product);
    const request = buildStudioRequest(details, "image", "page", refinement, "data:image/png;base64,c291cmNl", details);
    assert.equal(request.product, product);
    assert.equal(request.event.venueName, venueName);
    assert.equal(request.event.venueAddress, address);
    assert.ok(request.imageEdit.editInstruction.includes(refinement));

    if (product === "live_card") {
      assert.ok(request.imageEdit.editInstruction.includes(`street address "${address}"`));
      assert.match(request.imageEdit.editInstruction, /Do not print the street address/);
    } else {
      assert.doesNotMatch(request.imageEdit.editInstruction, /street address|replace that visible place text/);
      if (product.endsWith("flyer")) {
        assert.ok(approvedArtworkText(request.event, product).some((block) => block.includes(address)));
      } else {
        assert.deepEqual(approvedArtworkText(request.event, product), []);
      }
    }
  });

  test(`${product} venue corrections do not inherit another product's address-removal rule`, () => {
    const details = eventDetails(product);
    const previousDetails = { ...details, venueName: "Maple Community Center, Room A", location: "Maple Community Center, Room A, 100 Example Lane, Austin, TX" };
    const request = buildStudioRequest(details, "image", "page", "Change Room A to Room B.", "data:image/png;base64,c291cmNl", previousDetails);
    assert.equal(request.event.venueName, venueName);
    assert.equal(request.event.venueAddress, address);
    if (product === "live_card") {
      assert.match(request.imageEdit.editInstruction, /Replace the visible place\/location chip or line/);
      assert.match(request.imageEdit.editInstruction, /Do not print the street address/);
    } else {
      assert.doesNotMatch(request.imageEdit.editInstruction, /Do not print the street address|replace that visible place text/);
    }
  });
}
