const buildBunFixture = require("./build-bun-fixture.cjs");

function ensureLiveCardBuilderFixture(env = process.env, build = () => buildBunFixture("scripts/build-livecard-builder-fixture.mjs")) {
  if (env.ENVITEFY_LIVECARD_FIXTURE_READY === "1") return;
  build();
}

module.exports = ensureLiveCardBuilderFixture;
