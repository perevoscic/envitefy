const { execSync } = require("node:child_process");

module.exports = function buildBunFixture(script, options = {}, execute = execSync) {
  if (typeof script !== "string" || !/^scripts\/build-[a-z0-9-]+\.mjs$/.test(script)) {
    throw new Error("Expected a fixed scripts/build-*.mjs fixture entrypoint");
  }
  // A shell is required for Bun's Windows npm .cmd shim. The entrypoint is
  // validated above and never contains caller-controlled shell syntax.
  return execute(`bun "${script}"`, { timeout: 60000, stdio: "pipe", ...options, windowsHide: true });
};
