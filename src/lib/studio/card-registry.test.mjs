import assert from "node:assert/strict";
import test from "node:test";
import {
  readCardRegistryLink,
  buildCardRegistryDataPatch,
  normalizeCardRegistryLink,
  isRegistryOnlyCardEdit,
} from "./card-registry.ts";

test("saved links hydrate from supported event shapes and explicit clears win", () => {
  const link = "https://example.com/registry";
  for (const data of [
    { studioCard: { invitationData: { eventDetails: { registryLink: link } } } },
    { studioCard: { eventDetails: { registryLink: link } } },
    { eventDetails: { registryLink: link } },
    { registryLink: link },
    { giftRegistryLink: link },
    {
      registries: [
        { label: "Wedding Website", url: "https://example.com/wedding" },
        { label: "Gift Registry", url: link },
      ],
    },
  ])
    assert.equal(readCardRegistryLink(data), link);
  assert.equal(
    readCardRegistryLink({ registryLink: "", registries: [{ label: "Registry", url: link }] }),
    "",
  );
  assert.equal(readCardRegistryLink({ registries: [{ label: "Tickets", url: link }] }), "");
});

test("editing one registry preserves additional registries and other guest links", () => {
  const extraRegistry = { label: "Second registry", url: "https://example.com/second" };
  const website = { label: "Wedding Website", url: "https://example.com/wedding" };
  const patch = buildCardRegistryDataPatch(
    {
      registryLink: "https://example.com/first",
      registries: [{ label: "Registry", url: "https://example.com/first" }, extraRegistry, website],
    },
    "https://example.com/new",
  );
  assert.deepEqual(patch.registries, [
    { label: "Registry", url: "https://example.com/new" },
    extraRegistry,
    website,
  ]);
});

test("only registry changes can bypass artwork preview", () => {
  assert.equal(isRegistryOnlyCardEdit({ registryLink: "" }), true);
  assert.equal(
    isRegistryOnlyCardEdit({ registryLink: "example.com", theme: "Change the printed link" }),
    false,
  );
  assert.equal(isRegistryOnlyCardEdit({ title: "A new title" }), false);
  assert.equal(isRegistryOnlyCardEdit({}), false);
  assert.equal(
    normalizeCardRegistryLink(" example.com/my-registry "),
    "https://example.com/my-registry",
  );
  assert.equal(normalizeCardRegistryLink(""), "");
});
